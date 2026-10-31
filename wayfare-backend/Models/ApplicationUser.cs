<<<<<<< HEAD
=======
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;
using Microsoft.AspNetCore.Authentication.Cookies;
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
using Microsoft.AspNetCore.Identity;

namespace wayfare_backend.Models
{
    public class ApplicationUser : IdentityUser
    {
<<<<<<< HEAD
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? LicenseUrl { get; set; }
=======
        // full name property for admin and customer 
        public string FullName { get; set; } = string.Empty;
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
        public Customer? Customer { get; set; }
    }
}