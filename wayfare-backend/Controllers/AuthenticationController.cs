<<<<<<< HEAD
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
=======
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;
using wayfare_backend.Dtos.AuthDtos;
using wayfare_backend.Models;
using wayfare_backend.Services;
using System.Linq;

namespace wayfare_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;
        private readonly IImageService _imageService;
        private readonly JwtTokenService _jwtTokenService;

        public AuthenticationController(
            UserManager<ApplicationUser> userManager,
            AppDbContext context,
            IImageService imageService,
            JwtTokenService jwtTokenService)
        {
            _userManager = userManager;
            _context = context;
            _imageService = imageService;
            _jwtTokenService = jwtTokenService;
        }

        [HttpPost("register")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Register([FromForm] RegisterRequestDto request)
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

<<<<<<< HEAD
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
=======
            // Check if the email is already registered
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                return BadRequest(new { Message = "Email is already registered." });

            // Upload the license image to Cloudflare R2
            var licenseImageUrl = await _imageService.UploadImageAsync(request.LicenseImage, "licenses");
            if (string.IsNullOrEmpty(licenseImageUrl))
                return BadRequest(new { Message = "Failed to upload license image." });

            // Create the base application user matching the ApplicationUser model
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                FullName = request.FullName
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                // If user creation fails, delete the uploaded image to prevent orphaned files
                await _imageService.DeleteImageAsync(licenseImageUrl);
                return BadRequest(result.Errors);
            }

            // Assign the "Customer" role to the user
            await _userManager.AddToRoleAsync(user, "Customer");

            // Create the customer profile matching the exact properties in the Customer model
            var customer = new Customer
            {
                UserId = user.Id,
                LicenseExp = request.LicenseExp,
                LicenseState = request.LicenseState,
                LicenseImageUrl = licenseImageUrl
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "User registered successfully." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

<<<<<<< HEAD
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
=======
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            {
                return Unauthorized(new { Message = "Invalid email or password." });
            }

            var roles = await _userManager.GetRolesAsync(user);

            // Generate token using the correct async method
            var token = await _jwtTokenService.CreateTokenAsync(user);

            return Ok(new { Token = token, Roles = roles });
        }

        [HttpPost("change-password")]
        [Authorize] 
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 1. Extract the user ID from the JWT token claims
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "User not found or token is invalid." });

            // 2. Find the user in the database
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User does not exist." });

            // 3. Change the password using the built-in Identity method
            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

            if (result.Succeeded)
            {
                return Ok(new { message = "Password changed successfully." });
            }

            // 4. If the current password is wrong or any other validation fails, return the errors
            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { errors });
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetUserProfile()
        {
            // 1. Extract User ID from the token
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "User not found or token is invalid." });

            // 2. Fetch User from Identity
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound(new { message = "User does not exist." });

            // 3. Fetch Customer details (License info) from the database
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);

            // 4. Map the data to the DTO
            var profileDto = new UserProfileDto
            {
                FullName = user.FullName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                LicenseExp = customer?.LicenseExp,
                LicenseState = customer?.LicenseState ?? default,
                LicenseImageUrl = customer?.LicenseImageUrl
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
            };

            return Ok(profileDto);
        }
<<<<<<< HEAD

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
=======
        [HttpPut("profile")]
[Authorize]
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

    user.FullName = request.FullName;
    user.PhoneNumber = request.PhoneNumber;

    var result = await _userManager.UpdateAsync(user);
    if (!result.Succeeded)
    {
        var errors = result.Errors.Select(e => e.Description);
        return BadRequest(new { errors });
    }

    return Ok(new { message = "Profile updated successfully." });
}

        [HttpPut("license")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateLicense([FromForm] UpdateLicenseRequestDto request)
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

<<<<<<< HEAD
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
=======
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(new { message = "User not found or token is invalid." });

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
                return NotFound(new { message = "Customer profile not found." });

            customer.LicenseExp = request.LicenseExp;
            customer.LicenseState = request.LicenseState;

            if (request.LicenseImage != null)
            {
                var newImageUrl = await _imageService.UploadImageAsync(request.LicenseImage, "licenses");
                if (string.IsNullOrEmpty(newImageUrl))
                    return BadRequest(new { message = "Failed to upload new license image." });

            
                if (!string.IsNullOrEmpty(customer.LicenseImageUrl))
                {
                    await _imageService.DeleteImageAsync(customer.LicenseImageUrl);
                }

                customer.LicenseImageUrl = newImageUrl;
            }

            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();

            return Ok(new { message = "License updated successfully." });
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
        }
    }
}