using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using wayfare_backend.Dtos.AuthDtos;
using wayfare_backend.Enums.UserEnums;
using wayfare_backend.Models;
using wayfare_backend.Services;

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
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.LicenseExpiry.Date <= DateTime.UtcNow.Date)
                return BadRequest(new { Message = "License expiry date must be in the future." });

            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
                return Conflict(new { Message = "Email is already registered." });

            using var transaction = await _context.Database.BeginTransactionAsync();
            string? licenseImageUrl = null;
            ApplicationUser? user = null;

            try
            {
                licenseImageUrl = await _imageService.UploadImageAsync(request.LicensePhoto, "licenses");
                if (string.IsNullOrEmpty(licenseImageUrl))
                    return BadRequest(new { Message = "Failed to upload license image." });

                user = new ApplicationUser
                {
                    UserName = request.Email,
                    Email = request.Email,
                    PhoneNumber = request.Phone,
                    FullName = request.Name 
                };

                var result = await _userManager.CreateAsync(user, request.Password);
                if (!result.Succeeded)
                {
                    await _imageService.DeleteImageAsync(licenseImageUrl);
                    return BadRequest(result.Errors);
                }

                await _userManager.AddToRoleAsync(user, "Customer");

                var customer = new Customer
                {
                    UserId = user.Id,
                    LicenseExp = request.LicenseExpiry,
                    LicenseState = UserLicense.Pending, 
                    LicenseImageUrl = licenseImageUrl
                };

                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

            return StatusCode(StatusCodes.Status201Created, new
            {
                Message = "User registered successfully.",
                UserId = user.Id,
                Email = user.Email
            });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();

                if (!string.IsNullOrEmpty(licenseImageUrl))
                {
                    await _imageService.DeleteImageAsync(licenseImageUrl);
                }

                if (user != null)
                {
                     await _userManager.DeleteAsync(user);
                }

                throw; 
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            {
                return Unauthorized(new { Message = "Invalid email or password." });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var token = await _jwtTokenService.CreateTokenAsync(user);

            return Ok(new { Token = token, Roles = roles });
        }


    }
}