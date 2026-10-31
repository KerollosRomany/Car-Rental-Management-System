using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using wayfare_backend.Enums.UserEnums;

namespace wayfare_backend.Dtos.AuthDtos
{
    public class RegisterRequestDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public DateTime LicenseExp { get; set; }

        [Required]
        public UserLicense LicenseState { get; set; }

        [Required]
        public IFormFile LicenseImage { get; set; } = null!;
    }
}