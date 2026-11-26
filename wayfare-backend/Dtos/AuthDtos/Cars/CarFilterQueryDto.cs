using System;
using System.Collections.Generic;
using wayfare_backend.Enums.CarEnums;

namespace wayfare_backend.DTOs.Cars
{
    public class CarFilterQueryDto
    {
        public int? BranchId { get; set; }
        public List<CarType>? Category { get; set; }
        public List<Fuel>? Fuel { get; set; }
        public Transmission? Transmission { get; set; }
        public string? Seats { get; set; } // "2-4", "5", "7+", or "Any"
        public decimal? MaxPrice { get; set; }
        public string? Q { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public string? Sort { get; set; } // "price-asc" | "price-desc"
        public bool IncludeMaintenance { get; set; } = false;
    }
}