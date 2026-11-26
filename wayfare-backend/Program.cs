using System.Text;
using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using wayfare_backend;
using wayfare_backend.Extensions;
using wayfare_backend.Models;
using wayfare_backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

// Jwt and Identity Authentications 
builder.Services.AddAuthServices(builder.Configuration);

builder.Services.AddAuthorization();

// Allow Communication with Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5500",
            "http://127.0.0.1:5500",
             "http://localhost:5290"
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

// Add services to the container.
builder.Services.AddOpenApi();

// Register Cloudflare R2 image services
builder.Services.AddImageServices();
// Bind R2 Configuration
var r2Settings = builder.Configuration.GetSection("CloudflareR2");
string accountId = r2Settings["AccountId"]!;
string accessKey = r2Settings["AccessKeyId"]!;
string secretKey = r2Settings["SecretAccessKey"]!;

// Register IAmazonS3 configured for Cloudflare R2
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var config = new AmazonS3Config
    {
        ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
        AuthenticationRegion = "us-east-1",
        ForcePathStyle = true
    };

    return new AmazonS3Client(accessKey, secretKey, config);
});

builder.Services.AddScoped<IRentalRulesService, RentalRulesService>();

builder.Services.AddScoped<IRentalRulesService, RentalRulesService>();

var app = builder.Build();


// data seeders 
await app.SeedDatabaseAsync();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
// Global middleware to handle BadHttpRequestException as 400 Bad Request
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (BadHttpRequestException ex)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = ex.Message });
    }
});

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();