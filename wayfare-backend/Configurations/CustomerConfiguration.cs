using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using wayfare_backend.Models;

namespace wayfare_backend.Configurations
{
    public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
    {
        public void Configure(EntityTypeBuilder<Customer> builder)
        {
            builder.HasKey(k => k.Id);

            builder.Property(c => c.LicenseImageUrl)
                .IsRequired()
                .HasMaxLength(500);
            builder.Property(c => c.LicenseState).HasConversion<string>().HasMaxLength(30);

            builder.HasOne(c => c.User)
                .WithOne(u => u.Customer)
                .HasForeignKey<Customer>(c => c.UserId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
