using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using wayfare_backend.Dtos.AuthDtos;
using wayfare_backend.Enums.UserEnums;
using wayfare_backend.Models;
using wayfare_backend.Services;

namespace wayfare_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;
        private readonly IImageService _imageService;

        public CustomerController(
            UserManager<ApplicationUser> userManager,
            AppDbContext context,
            IImageService imageService)
        {
            _userManager = userManager;
            _context = context;
            _imageService = imageService;
        }
        [HttpPut("change-password")]
        [Authorize(Roles ="Customer")] 
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.CurrentPassword == request.NewPassword)
                return BadRequest(new { message = "New password cannot be the same as the current password." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "User not found or token is invalid." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User does not exist." });

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

            if (result.Succeeded)
            {
                return NoContent();
            }

            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { errors });
        }

        [HttpGet("profile")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetUserProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "User not found or token is invalid." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User does not exist." });

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);

            var profileDto = new UserProfileDto
            {
                CustomerId = customer?.UserId ?? string.Empty, 
                FullName = user.FullName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                Phone = user.PhoneNumber ?? string.Empty,
                JoinedAt = DateTime.UtcNow, 
                RentalsTaken = 0, 
                LicenseExpiry = customer?.LicenseExp,
                LicenseState = customer?.LicenseState.ToString().ToLower() ?? "pending",
                LicenseImageUrl = customer?.LicenseImageUrl
            };

            return Ok(profileDto);
        }

        [HttpPut("profile")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "User not found or token is invalid." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User does not exist." });

            if (user.Email != request.Email)
            {
                var existingEmailUser = await _userManager.FindByEmailAsync(request.Email);
                if (existingEmailUser != null)
                    return Conflict(new { message = "Email is already registered to another account." });

                user.Email = request.Email;
                user.UserName = request.Email;
            }

            user.FullName = request.FullName;
            user.PhoneNumber = request.Phone;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description);
                return BadRequest(new { errors });
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);

            var profileDto = new UserProfileDto
            {
                CustomerId = customer?.UserId ?? string.Empty,
                FullName = user.FullName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                Phone = user.PhoneNumber ?? string.Empty,
                JoinedAt = DateTime.UtcNow,
                RentalsTaken = 0,
                LicenseExpiry = customer?.LicenseExp,
                LicenseState = customer?.LicenseState.ToString().ToLower() ?? "pending",
                LicenseImageUrl = customer?.LicenseImageUrl
            };

            return Ok(profileDto);
        }

        [HttpPut("license")]
        [Authorize(Roles = "Customer")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateLicense([FromForm] UpdateLicenseRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.LicenseExpiry.Date <= DateTime.UtcNow.Date)
                return BadRequest(new { Message = "License expiry date must be in the future." });

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "User not found or token is invalid." });

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
                return NotFound(new { message = "Customer profile not found." });

            string? oldImageUrl = customer.LicenseImageUrl;
            string? newImageUrl = null;

            if (request.LicensePhoto != null)
            {
                newImageUrl = await _imageService.UploadImageAsync(request.LicensePhoto, "licenses");
                if (string.IsNullOrEmpty(newImageUrl))
                    return BadRequest(new { message = "Failed to upload new license image." });

                customer.LicenseImageUrl = newImageUrl;
            }

            customer.LicenseExp = request.LicenseExpiry;
            customer.LicenseState = UserLicense.Pending;

            _context.Customers.Update(customer);
            await _context.SaveChangesAsync(); 

            if (request.LicensePhoto != null && !string.IsNullOrEmpty(oldImageUrl))
            {
                await _imageService.DeleteImageAsync(oldImageUrl);
            }

            return Ok(new { message = "License updated successfully." });
        }
    }
}