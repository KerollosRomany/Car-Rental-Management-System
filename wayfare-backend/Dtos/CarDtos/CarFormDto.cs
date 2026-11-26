using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace wayfare_backend.Dtos.CarDtos
{
    // multipart/form-data body for POST /api/admin/newcar and PUT /api/admin/editcar/{id}
    public class CarFormDto
    {
        [Required, MaxLength(50)] public string Brand { get; set; } = string.Empty;
        [Required, MaxLength(50)] public string Model { get; set; } = string.Empty;
        [Range(1980, 2100)] public short Year { get; set; }
        [Required] public string Category { get; set; } = string.Empty;
        [Required] public string Transmission { get; set; } = string.Empty;
        [Required] public string Fuel { get; set; } = string.Empty;
        [Range(1, 60)] public short Seats { get; set; }
        [Range(0, 30)] public short Bags { get; set; }
        [Range(0.01, 100000)] public decimal DailyRate { get; set; }
        [Required, MaxLength(20)] public string Plate { get; set; } = string.Empty;
        [MaxLength(30)] public string? Color { get; set; }
        public string? Status { get; set; }
        [MaxLength(1000)] public string? Description { get; set; }
        [MaxLength(500)] public string? Features { get; set; } // comma separated
        public int? BranchId { get; set; }

        // New photo files.
        public List<IFormFile> Photos { get; set; } = new();

        // Final photo order. Each entry is either the URL of a photo the car already has,
        // or "file:N" for the N-th file in Photos. The first entry is the main photo.
        // When empty, existing photos are kept and new files are appended.
        public List<string> ImageOrder { get; set; } = new();
    }
}
