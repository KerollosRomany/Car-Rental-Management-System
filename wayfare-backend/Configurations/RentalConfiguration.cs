using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using wayfare_backend.Models;

namespace wayfare_backend.Configurations
{
    public class RentalConfiguration : IEntityTypeConfiguration<Rental>
    {
        public void Configure(EntityTypeBuilder<Rental> builder)
        {
            builder.HasKey(r => r.Id);

            builder.Property(r => r.TotalAmount).HasPrecision(10, 2);
            builder.Property(r => r.PaidAmount).HasPrecision(10, 2);
            builder.Property(r => r.RefundedAmount).HasPrecision(10, 2);
            builder.Property(r => r.RejectionReason).HasMaxLength(500);
            builder.Property(r => r.RentalStatus).HasConversion<string>().HasMaxLength(30);

            builder.HasOne(r => r.Customer)
                   .WithMany(c => c.Rentals)
                   .HasForeignKey(r => r.CustomerId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(r => r.Car)
                   .WithMany(c => c.Rentals)
                   .HasForeignKey(r => r.CarId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(r => r.Branch)
                   .WithMany(b => b.Rentals)
                   .HasForeignKey(r => r.BranchId)
                   .IsRequired()
                   .OnDelete(DeleteBehavior.Restrict);

        }
    }
}
