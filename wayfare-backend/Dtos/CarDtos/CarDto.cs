using System;
using System.Collections.Generic;

namespace wayfare_backend.Dtos.CarDtos
{
    // Shape the frontend reads (see wayfare-frontend/README.md "Data shape").
    public class CarDto
    {
        public string Id { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Category { get; set; } = string.Empty;     // Economy | SUV | Luxury | Van
        public string Transmission { get; set; } = string.Empty; // Automatic | Manual
        public string Fuel { get; set; } = string.Empty;         // Petrol | Diesel | Hybrid | Electric
        public int Seats { get; set; }
        public int Bags { get; set; }
        public decimal DailyRate { get; set; }
        public string Status { get; set; } = string.Empty;       // available | rented | maintenance
        public string Plate { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Images { get; set; } = new();
        public List<string> Features { get; set; } = new();
        public string BranchId { get; set; } = string.Empty;
        public bool AvailableForDates { get; set; } = true;
        public List<BookedRangeDto>? BookedRanges { get; set; }
    }

    public class BookedRangeDto
    {
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string RentalId { get; set; } = string.Empty;
    }
}
