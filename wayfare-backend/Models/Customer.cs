using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using wayfare_backend.Enums.UserEnums;

namespace wayfare_backend.Models
{
    public class Customer
    {
        // Customer table PK
        public int Id { get; set; }

        // Customer properties
        public string LicenseImageUrl { get; set; } = string.Empty;
        public DateTime LicenseExp { get; set; }
        public DateTime JoinedAtDate { get; private set; }
        public UserLicense LicenseState { get; set; }
        
        public ICollection<Rental> Rental 
            = new List<Rental>();

        // Ctor to set the Join
        public Customer()
        {
            JoinedAtDate = DateTime.UtcNow;
        }

        // Link to ApplicationUser identity table (FK)
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

    }
}