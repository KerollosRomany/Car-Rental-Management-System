using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using wayfare_backend.Dtos.AuthDtos;
using wayfare_backend.Models;
using wayfare_backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace wayfare_backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthenticationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly JwtTokenService _tokenService;
        private readonly IImageService _imageService;

        public AuthenticationController(AppDbContext context
            , UserManager<ApplicationUser> userManager
            , JwtTokenService tokenService
            , IImageService imageService)
        {
            _context = context;
            _userManager = userManager;
            _tokenService = tokenService;
            _imageService = imageService;
        }

        [HttpPost("admin")]
        public async Task<IActionResult> AdminLogin(LoginRequestDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email))
            {
                return BadRequest(new { message = "email is required" });
            }
            if (string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { message = "password is required" });
            }

            var admin = await _userManager.FindByEmailAsync(dto.Email);
            if (admin is null
                || !await _userManager.CheckPasswordAsync(admin, dto.Password)
                || !await _userManager.IsInRoleAsync(admin, "Admin"))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var token = await _tokenService.CreateTokenAsync(admin);
            return Ok(new
            {
                message = "admin login successfully!",
                email = admin.Email,
                name = admin.UserName,
                id = admin.Id,
                role = "Admin",
                token
            });
        }

        [HttpPost("user")]
        public async Task<IActionResult> UserLogin(LoginRequestDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email))
            {
                return BadRequest(new { message = "email is required" });
            }
            if (string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { message = "password is required" });
            }

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user is null
                || !await _userManager.CheckPasswordAsync(user, dto.Password)
                || !await _userManager.IsInRoleAsync(user, "User"))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var token = await _tokenService.CreateTokenAsync(user);
            return Ok(new
            {
                message = "user login successfully!",
                email = user.Email,
                name = user.UserName,
                id = user.Id,
                role = "User",
                token
            });
        }

        [HttpPost("Register")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Register([FromForm] RegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var imageUrl = await _imageService.UploadImageAsync(dto.LicenseImage);
            if (string.IsNullOrEmpty(imageUrl))
                return BadRequest(new { message = "Failed to upload license image." });

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                LicenseUrl = imageUrl
            };
            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, "User");

            return Ok(new { message = "User registered successfully", licenseUrl = imageUrl });
        }

        [HttpPost("ChangePassword")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userEmail == null)
                return Unauthorized(new { message = "Invalid token or user not authenticated." });

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
                return NotFound(new { message = "User not found." });

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = "Password changed successfully." });
        }

        [HttpGet("Profile")]
        [Authorize]
        public async Task<IActionResult> GetUserProfile()
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userEmail == null)
                return Unauthorized(new { message = "Invalid token or user not authenticated." });

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
                return NotFound(new { message = "User not found." });

            var profileDto = new UserProfileDto
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                LicenseUrl = user.LicenseUrl
            };

            return Ok(profileDto);
        }

        [HttpPut("UpdateProfile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userEmail == null)
                return Unauthorized(new { message = "Invalid token or user not authenticated." });

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
                return NotFound(new { message = "User not found." });

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = "Profile updated successfully." });
        }

        [HttpPut("UpdateLicense")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateLicense(IFormFile newLicenseImage)
        {
            if (newLicenseImage == null || newLicenseImage.Length == 0)
                return BadRequest(new { message = "Please provide a valid image." });

            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userEmail == null)
                return Unauthorized(new { message = "Invalid token or user not authenticated." });

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
                return NotFound(new { message = "User not found." });

            var imageUrl = await _imageService.UploadImageAsync(newLicenseImage);
            if (string.IsNullOrEmpty(imageUrl))
                return BadRequest(new { message = "Failed to upload the new license image." });

            user.LicenseUrl = imageUrl;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = "License updated successfully.", licenseUrl = imageUrl });
        }

        [HttpGet("Admin/Profile")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAdminProfile()
        {
            var adminEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (adminEmail == null)
                return Unauthorized(new { message = "Invalid token." });

            var admin = await _userManager.FindByEmailAsync(adminEmail);
            if (admin == null)
                return NotFound(new { message = "Admin not found." });

            return Ok(new
            {
                FirstName = admin.FirstName,
                LastName = admin.LastName,
                Email = admin.Email,
                LicenseUrl = admin.LicenseUrl
            });
        }

        [HttpPut("Admin/UpdateProfile")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateAdminProfile([FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var adminEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (adminEmail == null)
                return Unauthorized(new { message = "Invalid token." });

            var admin = await _userManager.FindByEmailAsync(adminEmail);
            if (admin == null)
                return NotFound(new { message = "Admin not found." });

            admin.FirstName = dto.FirstName;
            admin.LastName = dto.LastName;

            var result = await _userManager.UpdateAsync(admin);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = "Admin profile updated successfully." });
        }
    }
}