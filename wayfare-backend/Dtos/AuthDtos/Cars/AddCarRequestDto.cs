using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using wayfare_backend.Enums.CarEnums;
using wayfare_backend.Models;

namespace wayfare_backend.Dtos.Cars
{
    public class AddCarRequestDto
    {
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public short Year { get; set; }
        public CarType CarType{ get; set; }
        public Transmission Transmission{ get; set; }
        public Fuel Fuel { get; set; } 
        public short Seat { get; set; }
        public short Luggage { get; set; }
        public decimal DailyRate { get; set; }
        public string PlateNumber { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public Status Status { get; set; } 
        public List<IFormFile>? Images { get; set; }
        public string Description { get; set; } = string.Empty;
        public string IncludedFeature { get; set; } = string.Empty;
        public int BranchId { get; set; }
    }
}