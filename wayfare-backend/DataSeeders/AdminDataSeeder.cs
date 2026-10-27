using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using wayfare_backend.Models;

namespace wayfare_backend.DataSeeders
{
    public static class AdminDataSeeder
    {
        public static async Task SeedAdminAndRoles(IServiceProvider serviceProvider)
        {
            var _roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var _userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var _configuration = serviceProvider.GetRequiredService<IConfiguration>();

            // 1.Seeding Roles
            string[] roles = ["Admin", "User"];
            foreach (var role in roles)
            {
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // 2.Seeding Admin account
            var adminEmail = _configuration["Admin:Email"];
            var adminPassword = _configuration["Admin:Password"];
            var adminPhone = _configuration["Admin:Phone"];

            if ((await _userManager.FindByEmailAsync(adminEmail!)) is null)
            {
                var adminUser = new ApplicationUser
                {
                    FirstName = "Admin",
                    LastName = "WayFare",
                    UserName = "AdminWayFare",
                    Email = adminEmail,
                    PhoneNumber = adminPhone,
                    EmailConfirmed = true,
                    PhoneNumberConfirmed = true
                };

                var result = await _userManager.CreateAsync(adminUser, adminPassword!);

                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(adminUser, "Admin");
                }
                else
                {
                    var errors = string.Join("\n", result.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Failed to seed admin user: {errors}");
                }
            }
        }
    }
}