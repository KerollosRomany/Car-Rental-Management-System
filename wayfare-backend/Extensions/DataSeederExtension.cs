using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using wayfare_backend.DataSeeders;

namespace wayfare_backend.Extensions
{
    public static class DataSeederExtension
    {
        public static async Task<IHost> SeedDatabaseAsync(this IHost app)
        {
            using var scope = app.Services.CreateScope();
            var services = scope.ServiceProvider;

            try
            {
                //apply any pending EF Core migrations first
                var context = services.GetRequiredService<AppDbContext>();
                await context.Database.MigrateAsync();

                // Run seeders in order of dependency
                await AdminDataSeeder.SeedAdminAndRoles(services);
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILoggerFactory>()
                                     .CreateLogger("DatabaseSeeder");
                logger.LogError(ex, "An error occurred while seeding the database.");
                throw; 
            }

            return app;
        }
    }
}