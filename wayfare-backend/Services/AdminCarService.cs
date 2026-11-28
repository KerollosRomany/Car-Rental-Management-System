using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using wayfare_backend.DTOs.Cars;
using wayfare_backend.Enums.CarEnums;
using wayfare_backend.Enums.RentalEnums;
using wayfare_backend.Models;

namespace wayfare_backend.Services
{
    public class AdminCarService : IAdminCarService
    {
        private const int MaxImages = 8;
        private const string ImageFolder = "cars";

        private const string PlateTakenMessage = "Another car already has this plate number.";
        private const string CarNotFoundMessage = "Car not found.";

        private readonly AppDbContext _context;
        private readonly IImageService _imageService;
        private readonly ILogger<AdminCarService> _logger;

        public AdminCarService(
            AppDbContext context,
            IImageService imageService,
            ILogger<AdminCarService> logger)
        {
            _context = context;
            _imageService = imageService;
            _logger = logger;
        }

        // ------------------- LIST -------------------

        public async Task<IReadOnlyList<AdminCarDto>> GetAllAsync()
        {
            var cars = await _context.Cars
                .AsNoTracking()
                .Include(c => c.Branch)
                .Include(c => c.Images)
                .OrderByDescending(c => c.Id)
                .ToListAsync();

            return cars.Select(c => c.ToAdminCarDto()).ToList();
        }

        // ------------------- ADD -------------------

        public async Task<ServiceResult<AdminCarDto>> AddAsync(AddCarRequestDto request)
        {
            var errors = new Dictionary<string, string[]>();

            CheckYear(request.Year, errors);

            if (request.Status == Status.Rented)
                errors[nameof(request.Status)] = new[] { "Status can only be Available or Maintenance. A car becomes Rented only when keys are handed over." };

            var images = ValidFiles(request.Images);
            CheckImageCount(images.Count, errors);

            if (errors.Count > 0)
                return ServiceResult<AdminCarDto>.Invalid(errors);

            if (!await BranchExistsAsync(request.BranchId))
                return ServiceResult<AdminCarDto>.Invalid("Branch does not exist.");

            var plate = CarMapper.NormalizePlate(request.PlateNumber);
            if (await IsPlateTakenAsync(plate, exceptCarId: null))
                return ServiceResult<AdminCarDto>.Conflict(PlateTakenMessage);

            // Upload first. If anything fails afterwards, delete what was uploaded.
            var uploadedUrls = new List<string>();
            try
            {
                var uploadFailed = !await UploadAllAsync(images, uploadedUrls);
                if (uploadFailed)
                {
                    await DeleteImagesSafelyAsync(uploadedUrls);
                    return ServiceResult<AdminCarDto>.Invalid("Failed to upload car image.");
                }

                var car = request.ToCarEntity();
                for (int i = 0; i < uploadedUrls.Count; i++)
                {
                    car.Images.Add(new CarImage
                    {
                        ImageUrl = uploadedUrls[i],
                        IsMainImage = i == 0,
                        DisplayOrder = i
                    });
                }

                _context.Cars.Add(car);
                await _context.SaveChangesAsync();

                await _context.Entry(car).Reference(c => c.Branch).LoadAsync();
                return ServiceResult<AdminCarDto>.Success(car.ToAdminCarDto());
            }
            catch (DbUpdateException)
            {
                await DeleteImagesSafelyAsync(uploadedUrls);

                // Safety net: the unique index caught a plate added between our check and the save.
                if (await IsPlateTakenAsync(plate, exceptCarId: null))
                    return ServiceResult<AdminCarDto>.Conflict(PlateTakenMessage);

                throw;
            }
            catch
            {
                await DeleteImagesSafelyAsync(uploadedUrls);
                throw;
            }
        }

        // ------------------- EDIT -------------------

        public async Task<ServiceResult<AdminCarDto>> EditAsync(int id, EditCarRequestDto request)
        {
            var car = await _context.Cars
                .Include(c => c.Images)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (car == null)
                return ServiceResult<AdminCarDto>.NotFound(CarNotFoundMessage);

            // ---------- Field and photo checks ----------
            var errors = new Dictionary<string, string[]>();

            CheckYear(request.Year, errors);

            var keepIds = request.KeepImageIds?.Distinct().ToList() ?? new List<int>();
            var carImageIds = car.Images.Select(i => i.Id).ToHashSet();
            if (keepIds.Any(k => !carImageIds.Contains(k)))
                errors[nameof(request.KeepImageIds)] = new[] { "One or more image ids do not belong to this car." };

            var newFiles = ValidFiles(request.Images);
            CheckImageCount(keepIds.Count + newFiles.Count, errors);

            if (errors.Count > 0)
                return ServiceResult<AdminCarDto>.Invalid(errors);

            // ---------- Status rules ----------
            // A car is out on rent if its status is Rented, pending or it has an Active rental.
            var isOutOnRent = car.Status == Status.Rented ||
                await _context.Rentals.AnyAsync(r => r.CarId == id && (r.RentalStatus == RentalStatus.Active || r.RentalStatus == RentalStatus.Pending));

            if (isOutOnRent && request.Status != Status.Rented)
                return ServiceResult<AdminCarDto>.Conflict("This car is out on rent, so its status cannot change. Record the return first.");

            if (!isOutOnRent && request.Status == Status.Rented)
                return ServiceResult<AdminCarDto>.Invalid(new Dictionary<string, string[]>
                {
                    [nameof(request.Status)] = new[] { "Status can only be Available or Maintenance. A car becomes Rented only when keys are handed over." }
                });

            // ---------- Branch and plate ----------
            if (request.BranchId != car.BranchId && !await BranchExistsAsync(request.BranchId))
                return ServiceResult<AdminCarDto>.Invalid("Branch does not exist.");

            var plate = CarMapper.NormalizePlate(request.PlateNumber);
            if (await IsPlateTakenAsync(plate, exceptCarId: id))
                return ServiceResult<AdminCarDto>.Conflict(PlateTakenMessage);

            // ---------- Save ----------
            var uploadedUrls = new List<string>();
            try
            {
                var uploadFailed = !await UploadAllAsync(newFiles, uploadedUrls);
                if (uploadFailed)
                {
                    await DeleteImagesSafelyAsync(uploadedUrls);
                    return ServiceResult<AdminCarDto>.Invalid("Failed to upload car image.");
                }

                request.ApplyToCar(car);

                // Remove images that were not kept.
                var removedImages = car.Images.Where(i => !keepIds.Contains(i.Id)).ToList();
                foreach (var img in removedImages)
                {
                    car.Images.Remove(img);
                    _context.CarImages.Remove(img);
                }

                // Kept images first, in the order staff sent, then the new ones.
                var order = 0;
                foreach (var keepId in keepIds)
                {
                    var img = car.Images.First(i => i.Id == keepId);
                    img.DisplayOrder = order;
                    img.IsMainImage = order == 0;
                    order++;
                }

                foreach (var url in uploadedUrls)
                {
                    car.Images.Add(new CarImage
                    {
                        ImageUrl = url,
                        DisplayOrder = order,
                        IsMainImage = order == 0
                    });
                    order++;
                }

                await _context.SaveChangesAsync();

                // The database is updated, now delete the removed files from storage.
                await DeleteImagesSafelyAsync(removedImages.Select(i => i.ImageUrl));

                await _context.Entry(car).Reference(c => c.Branch).LoadAsync();
                return ServiceResult<AdminCarDto>.Success(car.ToAdminCarDto());
            }
            catch (DbUpdateException)
            {
                await DeleteImagesSafelyAsync(uploadedUrls);

                if (await IsPlateTakenAsync(plate, exceptCarId: id))
                    return ServiceResult<AdminCarDto>.Conflict(PlateTakenMessage);

                throw;
            }
            catch
            {
                await DeleteImagesSafelyAsync(uploadedUrls);
                throw;
            }
        }

        // ------------------- DELETE -------------------

        public async Task<ServiceResult> DeleteAsync(int id)
        {
            var car = await _context.Cars
                .Include(c => c.Images)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (car == null)
                return ServiceResult.NotFound(CarNotFoundMessage);

            var hasRentals = await _context.Rentals.AnyAsync(r => r.CarId == id);
            if (hasRentals)
                return ServiceResult.Conflict("This car has rental history, so it cannot be deleted. Set it to Maintenance instead.");

            var imageUrls = car.Images.Select(i => i.ImageUrl).ToList();

            // CarImage rows are removed by cascade delete.
            _context.Cars.Remove(car);
            await _context.SaveChangesAsync();

            // Delete files only after the database delete succeeded.
            await DeleteImagesSafelyAsync(imageUrls);

            return ServiceResult.Success();
        }

        // ------------------- HELPERS -------------------

        private static void CheckYear(short year, Dictionary<string, string[]> errors)
        {
            var maxYear = DateTime.UtcNow.Year + 1;
            if (year > maxYear)
                errors["Year"] = new[] { $"Year must be between 2000 and {maxYear}." };
        }

        private static void CheckImageCount(int count, Dictionary<string, string[]> errors)
        {
            if (count == 0)
                errors["Images"] = new[] { "A car must have at least one image." };
            else if (count > MaxImages)
                errors["Images"] = new[] { $"A car can have at most {MaxImages} images." };
        }

        private static List<IFormFile> ValidFiles(List<IFormFile>? files) =>
            files?.Where(f => f != null && f.Length > 0).ToList() ?? new List<IFormFile>();

        private Task<bool> BranchExistsAsync(int branchId) =>
            _context.Branches.AnyAsync(b => b.Id == branchId);

        private Task<bool> IsPlateTakenAsync(string plate, int? exceptCarId) =>
            _context.Cars.AsNoTracking().AnyAsync(c =>
                c.PlateNumber == plate && (exceptCarId == null || c.Id != exceptCarId));

        // Uploads every file and adds its URL to uploadedUrls. Returns false if one upload gave no URL.
        // Throws BadHttpRequestException for a bad image (the caller cleans up).
        private async Task<bool> UploadAllAsync(List<IFormFile> files, List<string> uploadedUrls)
        {
            foreach (var file in files)
            {
                var url = await _imageService.UploadImageAsync(file, ImageFolder);
                if (string.IsNullOrEmpty(url))
                    return false;

                uploadedUrls.Add(url);
            }
            return true;
        }

        // Deletes files from storage without failing the request if one delete fails.
        private async Task DeleteImagesSafelyAsync(IEnumerable<string> urls)
        {
            foreach (var url in urls)
            {
                try
                {
                    await _imageService.DeleteImageAsync(url);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not delete image {Url} from storage.", url);
                }
            }
        }
    }
}