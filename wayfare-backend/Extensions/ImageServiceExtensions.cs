using Microsoft.Extensions.DependencyInjection;
using wayfare_backend.Services;

namespace wayfare_backend.Extensions
{
    public static class ImageServiceExtensions
    {
        public static IServiceCollection AddImageServices(this IServiceCollection services)
        {
            services.AddScoped<IImageService, CloudflareImageService>();
            return services;
        }
    }
}