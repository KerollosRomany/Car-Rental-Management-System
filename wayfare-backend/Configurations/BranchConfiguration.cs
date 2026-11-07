using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using wayfare_backend.Enums.BranchEnums;
using wayfare_backend.Models;

namespace wayfare_backend.Configurations
{
    public class BranchConfiguration : IEntityTypeConfiguration<Branch>
    {
        public void Configure(EntityTypeBuilder<Branch> builder)
        {
            builder.HasKey(b => b.Id);

            builder.Property(b => b.Name).HasConversion<string>().HasMaxLength(30);
            builder.HasIndex(b => b.Name).IsUnique();

            builder.HasData(
                new Branch { Id = 1, Name = BranchName.AirportBranch },
                new Branch { Id = 2, Name = BranchName.DownTownBranch },
                new Branch { Id = 3, Name = BranchName.CentralStationBranch },
                new Branch { Id = 4, Name = BranchName.HarborBranch });
        }
    }
}
