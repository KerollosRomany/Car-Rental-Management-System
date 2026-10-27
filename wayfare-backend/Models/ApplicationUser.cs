using Microsoft.AspNetCore.Identity;

namespace wayfare_backend.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? LicenseUrl { get; set; }
        public Customer? Customer { get; set; }
    }
}