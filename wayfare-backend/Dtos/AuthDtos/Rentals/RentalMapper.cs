using wayfare_backend.Models;
using wayfare_backend.Services;

namespace wayfare_backend.DTOs.Rentals
{
    public static class RentalMapper
    {
        public static RentalRequestResponseDto ToRequestResponseDto(
            this Rental rental,
            IRentalRulesService rulesService)
        {
            var days = rulesService.CalculateRentalDays(rental.StartDate, rental.EndDate);

            return new RentalRequestResponseDto(
                Id: rental.Id,
                Reference: $"RNT-{rental.Id:D5}",
                CarId: rental.CarId,
                CarBrand: rental.Car?.Brand ?? string.Empty,
                CarModel: rental.Car?.Model ?? string.Empty,
                BranchId: rental.BranchId,
                BranchName: rental.Branch?.Name.ToString() ?? string.Empty,
                StartDate: rental.StartDate.ToString("yyyy-MM-dd"),
                EndDate: rental.EndDate.ToString("yyyy-MM-dd"),
                Days: days,
                TotalAmount: rental.TotalAmount,
                PaidAmount: rental.PaidAmount,
                RefundedAmount: rental.RefundedAmount,
                Status: rental.RentalStatus.ToString().ToLowerInvariant()
            );
        }
    }
}