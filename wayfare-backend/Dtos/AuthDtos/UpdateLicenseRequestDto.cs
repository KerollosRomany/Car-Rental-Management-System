using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using wayfare_backend.Enums.UserEnums;

namespace wayfare_backend.Dtos.AuthDtos
{
    public class UpdateLicenseRequestDto
    {
        [Required]
        public DateTime LicenseExp { get; set; }

        [Required]
        public UserLicense LicenseState { get; set; }

        public IFormFile? LicenseImage { get; set; } 
    }
}