using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Humanizer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using wayfare_backend.Models;

namespace wayfare_backend.Services
{
    public class JwtTokenService
    {
        private readonly IConfiguration _configuration;
        private readonly UserManager<ApplicationUser> _userManager;

        public JwtTokenService(IConfiguration configuration
<<<<<<< HEAD
            , UserManager<ApplicationUser> userManager)
=======
            ,UserManager<ApplicationUser> userManager)
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
        {
            _configuration = configuration;
            _userManager = userManager;
        }
        public async Task<string> CreateTokenAsync(ApplicationUser user)
        {
            var key = _configuration["Jwt:Key"];
            var roles = await _userManager.GetRolesAsync(user);
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier , user.Id),
<<<<<<< HEAD
                new Claim(ClaimTypes.Name , $"{user.FirstName} {user.LastName}".Trim()),
                new Claim(JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString())
            };

            if (!string.IsNullOrEmpty(user.Email))
                claims.Add(new Claim(ClaimTypes.Email, user.Email));

            if (roles != null)
                claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

            var securitykey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(key!));
            var credentials = new SigningCredentials(
            securitykey, SecurityAlgorithms.HmacSha512);
=======
                new Claim(ClaimTypes.Name , user.FullName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, 
                    Guid.NewGuid().ToString())
            };

            if(!string.IsNullOrEmpty(user.Email))
                claims.Add(new Claim(ClaimTypes.Email , user.Email));
            
            if(roles != null)
                claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role , role)));
            
            var securitykey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(key!));
            var credentials = new SigningCredentials(
            securitykey , SecurityAlgorithms.HmacSha512);
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    double.Parse(
                        _configuration["Jwt:ExpiryMinutes"]!)),
                signingCredentials: credentials);
<<<<<<< HEAD

            return new JwtSecurityTokenHandler().WriteToken(token);

=======
            
            return new JwtSecurityTokenHandler().WriteToken(token);
            
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
        }
    }
}