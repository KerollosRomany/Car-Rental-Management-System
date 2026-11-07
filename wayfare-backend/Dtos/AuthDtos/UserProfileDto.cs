using System;

namespace wayfare_backend.Dtos.AuthDtos
{
    public class UserProfileDto
    {
        public string CustomerId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
        public int RentalsTaken { get; set; }
        public DateTime? LicenseExpiry { get; set; } 
        public string LicenseState { get; set; } = string.Empty; 
        public string? LicenseImageUrl { get; set; }
    }
}