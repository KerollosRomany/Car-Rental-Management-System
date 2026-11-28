using System;
using System.Collections.Generic;
using System.Linq;
using wayfare_backend.Models;

namespace wayfare_backend.DTOs.Cars
{
    public static class CarMapper
    {
        public static CarListItemDto ToListItemDto(this Car car, bool availableForDates = true)
        {
            var orderedImages = GetOrderedImages(car);

            return new CarListItemDto(
                Id: car.Id,
                Brand: car.Brand,
                Model: car.Model,
                Year: car.Year,
                Color: car.Color,
                Seats: car.Seat,
                Bags: car.Luggage,
                DailyRate: car.DailyRate,
                Description: car.Description,
                IncludedFeature: car.IncludedFeature,
                Status: car.Status.ToString().ToLowerInvariant(),
                Fuel: car.Fuel.ToString(),
                Transmission: car.Transmission.ToString(),
                Category: car.CarType.ToString(),
                BranchId: car.BranchId,
                BranchName: car.Branch?.Name.ToString() ?? string.Empty,
                Images: orderedImages,
                AvailableForDates: availableForDates
            );
        }

        public static CarDetailsDto ToDetailsDto(
            this Car car,
            IEnumerable<(DateTime StartDate, DateTime EndDate)> bookedRanges)
        {
            var orderedImages = GetOrderedImages(car);
            var features = ParseFeatures(car.IncludedFeature);
            var ranges = bookedRanges
                .Select(r => new BookedRangeDto(
                    From: r.StartDate.ToString("yyyy-MM-dd"),
                    To: r.EndDate.ToString("yyyy-MM-dd")))
                .ToList();

            return new CarDetailsDto(
                Id: car.Id,
                Brand: car.Brand,
                Model: car.Model,
                Year: car.Year,
                Color: car.Color,
                Seats: car.Seat,
                Bags: car.Luggage,
                DailyRate: car.DailyRate,
                PlateNumber: car.PlateNumber,
                Description: car.Description,
                Status: car.Status.ToString().ToLowerInvariant(),
                Fuel: car.Fuel.ToString(),
                Transmission: car.Transmission.ToString(),
                Category: car.CarType.ToString(),
                BranchId: car.BranchId,
                BranchName: car.Branch?.Name.ToString() ?? string.Empty,
                Features: features,
                Images: orderedImages,
                BookedRanges: ranges
            );
        }

        // ---------- Staff (admin) side ----------

        public static AdminCarDto ToAdminCarDto(this Car car)
        {
            var images = car.Images
                .OrderByDescending(i => i.IsMainImage)
                .ThenBy(i => i.DisplayOrder)
                .ThenBy(i => i.Id)
                .Select(i => new AdminCarImageDto(
                    Id: i.Id,
                    Url: i.ImageUrl,
                    IsMain: i.IsMainImage,
                    DisplayOrder: i.DisplayOrder))
                .ToList();

            return new AdminCarDto(
                Id: car.Id,
                Brand: car.Brand,
                Model: car.Model,
                Year: car.Year,
                CarType: car.CarType.ToString().ToLowerInvariant(),
                Transmission: car.Transmission.ToString().ToLowerInvariant(),
                Fuel: car.Fuel.ToString().ToLowerInvariant(),
                Seats: car.Seat,
                Luggage: car.Luggage,
                DailyRate: car.DailyRate,
                Color: car.Color,
                PlateNumber: car.PlateNumber,
                Status: car.Status.ToString().ToLowerInvariant(),
                BranchId: car.BranchId,
                BranchName: car.Branch?.Name.ToString() ?? string.Empty,
                Description: car.Description,
                Features: ParseFeatures(car.IncludedFeature),
                Images: images
            );
        }

        // Builds a new Car from the request. Images are added by the service after upload.
        public static Car ToCarEntity(this AddCarRequestDto dto)
        {
            var car = new Car();
            dto.ApplyToCar(car);
            return car;
        }

        // Copies the form fields onto a car. Used by Add (new car) and Edit (existing car).
        public static void ApplyToCar(this AddCarRequestDto dto, Car car)
        {
            car.Brand = dto.Brand.Trim();
            car.Model = dto.Model.Trim();
            car.Year = dto.Year;
            car.CarType = dto.CarType!.Value;
            car.Transmission = dto.Transmission!.Value;
            car.Fuel = dto.Fuel!.Value;
            car.Seat = dto.Seat;
            car.Luggage = dto.Luggage;
            car.DailyRate = dto.DailyRate;
            car.PlateNumber = NormalizePlate(dto.PlateNumber);
            car.Color = dto.Color.Trim();
            car.Status = dto.Status!.Value;
            car.BranchId = dto.BranchId;
            car.Description = dto.Description?.Trim() ?? string.Empty;
            car.IncludedFeature = dto.IncludedFeature?.Trim() ?? string.Empty;
        }

        // Plates are stored in upper case so "wf 5150" and "WF 5150" count as the same plate.
        public static string NormalizePlate(string plate) => plate.Trim().ToUpperInvariant();

        private static List<string> GetOrderedImages(Car car)
        {
            return car.Images
                .OrderByDescending(i => i.IsMainImage)
                .ThenBy(i => i.DisplayOrder)
                .ThenBy(i => i.Id)
                .Select(i => i.ImageUrl)
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Distinct()
                .ToList();
        }

        private static IReadOnlyList<string> ParseFeatures(string? includedFeature)
        {
            if (string.IsNullOrWhiteSpace(includedFeature))
                return Array.Empty<string>();

            return includedFeature
                .Split(new[] { ',', ';', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(f => f.Trim())
                .Where(f => !string.IsNullOrWhiteSpace(f))
                .Distinct()
                .ToList();
        }
    }
}