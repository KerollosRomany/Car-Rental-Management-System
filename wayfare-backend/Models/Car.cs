using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using wayfare_backend.Enums.CarEnums;

namespace wayfare_backend.Models
{
    public class Car
    {
        // PK
        public int Id { get; set; }

        // Car Properties
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public short Year { get; set; }
        public string Color { get; set; } = string.Empty;
        public short Luggage { get; set; }
        public short Seat { get; set; }
        public decimal DailyRate { get; set; }
        public string PlateNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string IncludedFeature { get; set; } = string.Empty;
        public CarStatus CarStatus;
        public CarFuel CarFuel;
        public CarTransmission CarTransmission;
        public CarType CarType;
        
        public ICollection<CarImage> Images { get; set; }
            = new List<CarImage>();
        public ICollection<Rental> Rentals { get; set; }
            = new List<Rental>();
        //FK to branch where car is in 
        public int BranchId { get; set; }
        public Branch Branch { get; set; } = null!;

    }
}