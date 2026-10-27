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

namespace wayfare_backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthenticationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly JwtTokenService _tokenService;
        public AuthenticationController(AppDbContext context
                ,UserManager<ApplicationUser> userManager
                ,JwtTokenService tokenService)
        {
            _context = context;
            _userManager = userManager;
            _tokenService = tokenService;
        }

        [HttpPost("admin")]
        public async Task<IActionResult> AdminLogin(LoginRequestDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email))
            {
                return BadRequest(new
                {
                    message = "email is required"
                });
            }
            if (string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new
                {
                    message = "password is required"
                });
            }
            var admin = await _userManager.FindByEmailAsync(dto.Email);
            if(admin is null
                || !await _userManager.CheckPasswordAsync(admin , dto.Password)
                || !await _userManager.IsInRoleAsync(admin , "Admin"))
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password"
                });
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
                return BadRequest(new
                {
                    message = "email is required"
                });
            }
            if (string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new
                {
                    message = "password is required"
                });
            }
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if(user is null
                ||  !await _userManager.CheckPasswordAsync(user , dto.Password)
                ||  !await _userManager.IsInRoleAsync(user , "User"))
            {
                return Unauthorized(new
                {
                   message = "Invalid email or password" 
                });
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
    }
}