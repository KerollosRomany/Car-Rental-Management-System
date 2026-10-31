using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using wayfare_backend.Models;

namespace wayfare_backend.Configurations
{
    public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
    {
        public void Configure(EntityTypeBuilder<ApplicationUser> builder)
        {
<<<<<<< HEAD
            builder.Property(u => u.FirstName)
               .IsRequired()
               .HasMaxLength(50);

            builder.Property(u => u.LastName)
               .IsRequired()
               .HasMaxLength(50);
        }
    }
}
=======
            builder.Property(u => u.FullName)
               .IsRequired()
               .HasMaxLength(100);
        }
    }
}
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
