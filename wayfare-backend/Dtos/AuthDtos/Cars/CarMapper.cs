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