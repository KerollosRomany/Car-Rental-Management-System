using wayfare_backend.Dtos.CarDtos;
using wayfare_backend.Enums.BranchEnums;
using wayfare_backend.Enums.CarEnums;
using wayfare_backend.Enums.RentalEnums;
using wayfare_backend.Enums.UserEnums;
using wayfare_backend.Models;

namespace wayfare_backend.Mappers
{
    // Converts entities to the JSON shapes the frontend reads.
    public static class Mapping
    {
        public static string Day(DateTime d) => d.ToString("yyyy-MM-dd");
        public static string? Day(DateTime? d) => d.HasValue ? Day(d.Value) : null;

        public static int DaysBetween(DateTime from, DateTime to) =>
            Math.Max(1, (int)Math.Round((to.Date - from.Date).TotalDays));

        // Rentals that hold a car for their dates.
        public static readonly RentalStatus[] Blocking = { RentalStatus.Approved, RentalStatus.Active };

        /* ---------- Enums <-> text ---------- */

        public static string CategoryName(CarType t) => t switch
        {
            CarType.Suv => "SUV",
            _ => t.ToString()
        };

        public static string BranchLabel(BranchName b) => b switch
        {
            BranchName.AirportBranch => "Airport terminal 2",
            BranchName.DownTownBranch => "Downtown branch",
            BranchName.CentralStationBranch => "Central station",
            BranchName.HarborBranch => "Harbor branch",
            _ => b.ToString()
        };

        public static bool TryEnum<T>(string? value, out T result) where T : struct, Enum
        {
            result = default;
            if (string.IsNullOrWhiteSpace(value)) return false;
            return Enum.TryParse(value.Trim(), true, out result) && Enum.IsDefined(typeof(T), result);
        }

        public static string RentalRef(int id) => $"R-{id}";

        public static string PaymentState(Rental r)
        {
            if (r.RefundedAmount <= 0) return "paid";
            return r.RefundedAmount >= r.PaidAmount ? "refunded" : "partial";
        }

        /* ---------- Entities -> DTOs ---------- */

        public static CarDto ToDto(this Car c) => new()
        {
            Id = c.Id.ToString(),
            Brand = c.Brand,
            Model = c.Model,
            Year = c.Year,
            Category = CategoryName(c.CarType),
            Transmission = c.Transmission.ToString(),
            Fuel = c.Fuel.ToString(),
            Seats = c.Seat,
            Bags = c.Luggage,
            DailyRate = c.DailyRate,
            Status = c.Status.ToString().ToLowerInvariant(),
            Plate = c.PlateNumber,
            Color = c.Color,
            Description = c.Description,
            Images = c.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList(),
            Features = SplitFeatures(c.IncludedFeature),
            BranchId = c.BranchId.ToString()
        };

        public static List<string> SplitFeatures(string? value) =>
            string.IsNullOrWhiteSpace(value)
                ? new List<string>()
                : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    }
}
