using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using wayfare_backend.Enums.RentalEnums;
using wayfare_backend.Models;

namespace wayfare_backend.Services
{
    public record RefundCalculationResult(
        decimal PaidAmount,
        decimal FeeAmount,
        decimal RefundAmount,
        RentalStatus ResultingStatus,
        bool IsLateCancellation
    );

    public interface IRentalRulesService
    {
        int CalculateRentalDays(DateTime startDate, DateTime endDate);

        decimal CalculateTotalAmount(decimal dailyRate, DateTime startDate, DateTime endDate);

        bool HasDateOverlap(
            DateTime requestedStart,
            DateTime requestedEnd,
            DateTime existingStart,
            DateTime existingEnd);

        Task<bool> IsCarAvailableForRangeAsync(
            int carId,
            DateTime startDate,
            DateTime endDate,
            int? excludeRentalId = null);

        Task<IReadOnlyList<(DateTime StartDate, DateTime EndDate)>> GetBookedRangesAsync(int carId);

        RefundCalculationResult CalculateRefund(Rental rental, bool isCustomerCancellation = true);
    }
}