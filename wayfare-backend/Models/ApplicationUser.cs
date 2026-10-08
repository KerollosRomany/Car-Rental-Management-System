using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;

namespace wayfare_backend.Models
{
    public class ApplicationUser : IdentityUser
    {
        // full name property for admin and customer 
        public string FullName { get; set; } = string.Empty;
        public Customer? Customer { get; set; }
    }
}