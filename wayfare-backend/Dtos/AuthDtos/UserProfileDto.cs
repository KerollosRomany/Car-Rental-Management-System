<<<<<<< HEAD
=======
using System;
using wayfare_backend.Enums.UserEnums;

>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
namespace wayfare_backend.Dtos.AuthDtos
{
    public class UserProfileDto
    {
<<<<<<< HEAD
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? LicenseUrl { get; set; }
=======
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime? LicenseExp { get; set; } 
        public UserLicense LicenseState { get; set; } 
        public string? LicenseImageUrl { get; set; }
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
    }
}