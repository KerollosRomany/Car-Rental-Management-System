<<<<<<< HEAD
﻿using System.Text;
=======
using System.Text;
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
<<<<<<< HEAD
using Microsoft.OpenApi.Models;
=======
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
using wayfare_backend;
using wayfare_backend.Extensions;
using wayfare_backend.Models;
using wayfare_backend.Services;
<<<<<<< HEAD
using YourProjectNamespace.Extensions;
=======
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

<<<<<<< HEAD
//Jwt and Identity Authentications 
=======
// Jwt and Identity Authentications 
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
builder.Services.AddAuthServices(builder.Configuration);

builder.Services.AddAuthorization();

<<<<<<< HEAD
//Allow Communication with Frontend
=======
// Allow Communication with Frontend
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://127.0.0.1:5500", "http://localhost:5500")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add services to the container.
<<<<<<< HEAD
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\""
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// تعريف الـ app الذي كان مفقوداً
var app = builder.Build();

//data seeders 
=======
builder.Services.AddOpenApi();

// Register Cloudflare R2 image services
builder.Services.AddImageServices();

var app = builder.Build();


// data seeders 
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
await app.SeedDatabaseAsync();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
<<<<<<< HEAD
    app.UseSwagger();
    app.UseSwaggerUI();
=======
    app.MapOpenApi();
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
<<<<<<< HEAD
app.UseStaticFiles();
=======
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
app.UseAuthorization();

app.MapControllers();
app.Run();