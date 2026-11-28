using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using wayfare_backend.Enums.CarEnums;

namespace wayfare_backend.DTOs.Cars
{
    public class AddCarRequestDto
    {
        [Required, StringLength(50, MinimumLength = 1)]
        public string Brand { get; set; } = string.Empty;


        [Required, StringLength(50, MinimumLength = 1)]
        public string Model { get; set; } = string.Empty;


        [Range(2000, 2100)]
        public short Year { get; set; }


        [Required, EnumDataType(typeof(CarType))]
        public CarType? CarType { get; set; }


        [Required, EnumDataType(typeof(Transmission))]
        public Transmission? Transmission { get; set; }


        [Required, EnumDataType(typeof(Fuel))]
        public Fuel? Fuel { get; set; }


        [Range(2, 12)]
        public short Seat { get; set; }


        [Range(0, 10)]
        public short Luggage { get; set; }


        [Range(typeof(decimal), "0.01", "9999.99",
            ParseLimitsInInvariantCulture = true,
            ConvertValueInInvariantCulture = true)]
        public decimal DailyRate { get; set; }


        [Required, StringLength(20, MinimumLength = 1)]
        public string PlateNumber { get; set; } = string.Empty;


        [Required, StringLength(30, MinimumLength = 1)]
        public string Color { get; set; } = string.Empty;


        [Required, EnumDataType(typeof(Status))]
        public Status? Status { get; set; }


        [Range(1, int.MaxValue, ErrorMessage = "BranchId is required.")]
        public int BranchId { get; set; }


        [StringLength(1000)]
        public string? Description { get; set; }


        [StringLength(500)]
        public string? IncludedFeature { get; set; }


        // 1 to 8 files. The first one is the main photo.
        public List<IFormFile> Images { get; set; } = new();
    }
}