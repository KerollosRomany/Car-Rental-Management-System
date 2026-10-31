using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using wayfare_backend;
using wayfare_backend.Models;
using wayfare_backend.Services;

<<<<<<< HEAD
namespace YourProjectNamespace.Extensions;
=======
namespace wayfare_backend.Extensions;
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)

public static class AuthenticationExtensions
{
    public static IServiceCollection AddAuthServices(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        // 1. Identity configuration
        services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.User.RequireUniqueEmail = true;

            options.Password.RequiredLength = 8;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
        })
        .AddRoles<IdentityRole>()
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        // 2. JWT configuration
        var jwtKey = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt Key is missing");
        var jwtIssuer = configuration["Jwt:Issuer"];
        var jwtAudience = configuration["Jwt:Audience"];

        services.AddScoped<JwtTokenService>();

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtIssuer,

                    ValidateAudience = true,
                    ValidAudience = jwtAudience,

                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)),

                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,

                    RoleClaimType = System.Security.Claims.ClaimTypes.Role
                };
            });

        return services;
    }
}