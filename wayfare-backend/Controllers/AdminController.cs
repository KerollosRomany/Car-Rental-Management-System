using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using wayfare_backend.Dtos.AuthDtos;
using wayfare_backend.Models;

namespace wayfare_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] 
    public class AdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetAdminProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized(new { message = "User not found." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound(new { message = "User does not exist." });

            return Ok(new AdminProfileDto
            {
                AdminId = user.Id,
                FullName = user.FullName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                Phone = user.PhoneNumber ?? string.Empty
            });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateAdminProfile([FromBody] UpdateAdminProfileRequestDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized(new { message = "User not found or token is invalid." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound(new { message = "User does not exist." });

            // التحقق من أن الإيميل الجديد غير مستخدم (409 Conflict)
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
            if (result.Succeeded)
            {
                // إرجاع البروفايل المحدث
                return Ok(new AdminProfileDto
                {
                    AdminId = user.Id,
                    FullName = user.FullName ?? string.Empty,
                    Email = user.Email ?? string.Empty,
                    Phone = user.PhoneNumber ?? string.Empty
                });
            }

            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new { errors });
        }
    }
}