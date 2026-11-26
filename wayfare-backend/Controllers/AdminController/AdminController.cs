using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using wayfare_backend.Dtos.AuthDtos;
using wayfare_backend.Dtos.CarDtos;
using wayfare_backend.Enums.CarEnums;
using wayfare_backend.Mappers;
using wayfare_backend.Models;
using wayfare_backend.Services;

namespace wayfare_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] 
    public class AdminController : ControllerBase
    {
        private const int MaxPhotos = 8;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;
        private readonly IImageService _imageService;


        public AdminController(UserManager<ApplicationUser> userManager,AppDbContext context,IImageService imageService)
        {
            _userManager = userManager;
            _context = context;
            _imageService = imageService;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetAdminProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized(new { message = "User not found." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound(new { message = "User does not exist." });

            return Ok(new AdminProfileDto
            {
                AdminId = user.Id,
                FullName = user.FullName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                Phone = user.PhoneNumber ?? string.Empty
            });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateAdminProfile([FromBody] UpdateAdminProfileRequestDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized(new { message = "User not found or token is invalid." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound(new { message = "User does not exist." });

            if (user.Email != request.Email)
            {
                var existingEmailUser = await _userManager.FindByEmailAsync(request.Email);
                if (existingEmailUser != null)
                    return Conflict(new { message = "Email is already registered to another account." });

                user.Email = request.Email;
                user.UserName = request.Email;
            }

            user.FullName = request.FullName;
            user.PhoneNumber = request.Phone;

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return Ok(new AdminProfileDto
                {
                    AdminId = user.Id,
                    FullName = user.FullName ?? string.Empty,
                    Email = user.Email ?? string.Empty,
                    Phone = user.PhoneNumber ?? string.Empty
                });
            }

            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { errors });
        }
         [HttpGet("cars")]
        public async Task<IActionResult> ListFleet()
        {
            var cars = await _context.Cars.AsNoTracking().Include(c => c.Images).OrderByDescending(c => c.Id).ToListAsync();
            return Ok(cars.Select(c => c.ToDto()));
        }

        // POST /api/admin/newcar   multipart/form-data (CarFormDto)
        [HttpPost("newcar")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> AddCar([FromForm] CarFormDto form)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var car = new Car();
            var error = await ApplyFormAsync(car, form, isNew: true);
            if (error != null) return error;

            if (await _context.Cars.AnyAsync(c => c.PlateNumber == car.PlateNumber))
                return Conflict(new { message = "Another car already uses this plate number." });

            var imageError = await ApplyImagesAsync(car, form);
            if (imageError != null) return imageError;

            _context.Cars.Add(car);
            await _context.SaveChangesAsync();
            return Ok(car.ToDto());
        }

        // PUT /api/admin/editcar/{id}   multipart/form-data (CarFormDto)
        [HttpPut("editcar/{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> EditCar(int id, [FromForm] CarFormDto form)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var car = await _context.Cars.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == id);
            if (car == null) return NotFound(new { message = "Car not found." });

            var error = await ApplyFormAsync(car, form, isNew: false);
            if (error != null) return error;

            if (await _context.Cars.AnyAsync(c => c.PlateNumber == car.PlateNumber && c.Id != id))
                return Conflict(new { message = "Another car already uses this plate number." });

            var imageError = await ApplyImagesAsync(car, form);
            if (imageError != null) return imageError;

            await _context.SaveChangesAsync();
            return Ok(car.ToDto());
        }

        // DELETE /api/admin/deletecar/{id}   a car with rental history answers 409
        [HttpDelete("deletecar/{id:int}")]
        public async Task<IActionResult> DeleteCar(int id)
        {
            var car = await _context.Cars.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == id);
            if (car == null) return NotFound(new { message = "Car not found." });

            if (car.Status == Status.Rented)
                return Conflict(new { message = "This car is rented right now. Record its return before deleting it." });

            if (await _context.Rentals.AnyAsync(r => r.CarId == id))
                return Conflict(new { message = "This car has rental history and cannot be deleted. Set it to maintenance instead." });

            var urls = car.Images.Select(i => i.ImageUrl).ToList();
            _context.Cars.Remove(car);
            await _context.SaveChangesAsync();

            foreach (var url in urls) await SafeDeleteImage(url);
            return NoContent();
        }

        private async Task<IActionResult?> ApplyFormAsync(Car car, CarFormDto form, bool isNew)
        {
            if (!Mapping.TryEnum<CarType>(form.Category, out var category))
                return BadRequest(new { message = "Unknown car type." });
            if (!Mapping.TryEnum<Transmission>(form.Transmission, out var transmission))
                return BadRequest(new { message = "Unknown transmission." });
            if (!Mapping.TryEnum<Fuel>(form.Fuel, out var fuel))
                return BadRequest(new { message = "Unknown fuel type." });

            var status = isNew ? Status.Available : car.Status;
            if (!string.IsNullOrWhiteSpace(form.Status) && !Mapping.TryEnum(form.Status, out status))
                return BadRequest(new { message = "Unknown car status." });

            var branchId = form.BranchId ?? (isNew ? 1 : car.BranchId);
            if (!await _context.Branches.AnyAsync(b => b.Id == branchId))
                return BadRequest(new { message = "Branch not found." });

            car.Brand = form.Brand.Trim();
            car.Model = form.Model.Trim();
            car.Year = form.Year;
            car.CarType = category;
            car.Transmission = transmission;
            car.Fuel = fuel;
            car.Seat = form.Seats;
            car.Luggage = form.Bags;
            car.DailyRate = form.DailyRate;
            car.PlateNumber = form.Plate.Trim().ToUpperInvariant();
            car.Color = form.Color?.Trim() ?? string.Empty;
            car.Status = status;
            car.Description = form.Description?.Trim() ?? string.Empty;
            car.IncludedFeature = string.Join(", ", Mapping.SplitFeatures(form.Features));
            car.BranchId = branchId;
            return null;
        }

        // Builds the final photo list from ImageOrder (existing URLs and "file:N" tokens).
        private async Task<IActionResult?> ApplyImagesAsync(Car car, CarFormDto form)
        {
            var existing = car.Images.ToDictionary(i => i.ImageUrl, i => i);
            var order = form.ImageOrder.Where(s => !string.IsNullOrWhiteSpace(s)).ToList();
            if (order.Count == 0)
            {
                order = car.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList();
                order.AddRange(form.Photos.Select((_, i) => $"file:{i}"));
            }

            if (order.Count == 0) return BadRequest(new { message = "Add at least one photo of the car." });
            if (order.Count > MaxPhotos) return BadRequest(new { message = $"A car can have up to {MaxPhotos} photos." });

            var uploaded = new List<string>();
            var finalUrls = new List<string>();
            try
            {
                foreach (var token in order)
                {
                    if (token.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!int.TryParse(token[5..], out var index) || index < 0 || index >= form.Photos.Count)
                            return BadRequest(new { message = "Photo order refers to a file that was not sent." });
                        var url = await _imageService.UploadImageAsync(form.Photos[index], "cars");
                        if (string.IsNullOrEmpty(url)) return BadRequest(new { message = "Failed to upload a photo." });
                        uploaded.Add(url);
                        finalUrls.Add(url);
                    }
                    else if (existing.ContainsKey(token))
                    {
                        finalUrls.Add(token);
                    }
                    else
                    {
                        return BadRequest(new { message = "Photo order refers to a photo this car does not have." });
                    }
                }
            }
            catch
            {
                foreach (var url in uploaded) await SafeDeleteImage(url);
                throw;
            }

            var removed = existing.Keys.Except(finalUrls).ToList();
            foreach (var url in removed) car.Images.Remove(existing[url]);

            for (var i = 0; i < finalUrls.Count; i++)
            {
                if (existing.TryGetValue(finalUrls[i], out var img))
                {
                    img.DisplayOrder = i;
                    img.IsMainImage = i == 0;
                }
                else
                {
                    car.Images.Add(new CarImage { ImageUrl = finalUrls[i], DisplayOrder = i, IsMainImage = i == 0 });
                }
            }

            foreach (var url in removed) await SafeDeleteImage(url);
            return null;
        }

        private async Task SafeDeleteImage(string url)
        {
            try { await _imageService.DeleteImageAsync(url); } catch { /* the photo is already gone from the car */ }
        }

    }
}