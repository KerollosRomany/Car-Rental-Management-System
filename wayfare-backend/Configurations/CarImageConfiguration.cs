using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using wayfare_backend.Models;

namespace wayfare_backend.Configurations
{
    public class CarImageConfiguration : IEntityTypeConfiguration<CarImage>
    {
        public void Configure(EntityTypeBuilder<CarImage> builder)
        {
            builder.HasKey(i => i.Id);

            builder.Property(i => i.ImageUrl).IsRequired().HasMaxLength(500);

            builder.HasOne(i => i.Car)
                   .WithMany(c => c.Images)
                   .HasForeignKey(i => i.CarId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
