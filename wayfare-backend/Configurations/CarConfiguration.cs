using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using wayfare_backend.Models;

namespace wayfare_backend.Configurations
{
    public class CarConfiguration : IEntityTypeConfiguration<Car>
    {
        public void Configure(EntityTypeBuilder<Car> builder)
        {
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Brand).IsRequired().HasMaxLength(50);
            builder.Property(c => c.Model).IsRequired().HasMaxLength(50);
            builder.Property(c => c.Color).IsRequired().HasMaxLength(30);
            builder.Property(c => c.PlateNumber).IsRequired().HasMaxLength(20);
            builder.Property(c => c.Description).HasMaxLength(1000);
            builder.Property(c => c.IncludedFeature).HasMaxLength(500);
            builder.Property(c => c.DailyRate).HasPrecision(10, 2);

            builder.HasIndex(c => c.PlateNumber).IsUnique();

            builder.Property(c => c.CarType).HasConversion<string>().HasMaxLength(30);
            builder.Property(c => c.Fuel).HasConversion<string>().HasMaxLength(30);
            builder.Property(c => c.Transmission).HasConversion<string>().HasMaxLength(30);
            builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(30);

            builder.HasOne(c => c.Branch)
                   .WithMany(b => b.Cars)
                   .HasForeignKey(c => c.BranchId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}