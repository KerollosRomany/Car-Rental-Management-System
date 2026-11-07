using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;

namespace wayfare_backend.Dtos.AuthDtos
{
    public class UpdateLicenseRequestDto
    {
        [Required]
        public DateTime LicenseExpiry { get; set; }

        public IFormFile? LicensePhoto { get; set; } 
    }
}