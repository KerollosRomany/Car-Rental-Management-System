using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using wayfare_backend.Enums.CarEnums;
using wayfare_backend.Enums.RentalEnums;
using wayfare_backend.Models;

namespace wayfare_backend.Services
{
    public class RentalRulesService : IRentalRulesService
    {
        private const decimal LateCancellationFeeRate = 0.10m; // 10% kept, 90% refunded

        private static readonly RentalStatus[] BlockingStatuses =
        {
            RentalStatus.Approved,
            RentalStatus.Active
        };

        private readonly AppDbContext _context;

        public RentalRulesService(AppDbContext context)
        {
            _context = context;
        }

        public int CalculateRentalDays(DateTime startDate, DateTime endDate)
        {
            var start = startDate.Date;
            var end = endDate.Date;

            if (end <= start)
                return 1;

            var days = (int)(end - start).TotalDays;
            return Math.Max(1, days);
        }

        public decimal CalculateTotalAmount(decimal dailyRate, DateTime startDate, DateTime endDate)
        {
            if (dailyRate < 0)
                throw new ArgumentOutOfRangeException(nameof(dailyRate), "Daily rate cannot be negative.");

            var days = CalculateRentalDays(startDate, endDate);
            return Math.Round(dailyRate * days, 2, MidpointRounding.AwayFromZero);
        }

        // Half-open interval overlap [requestedStart, requestedEnd) vs [existingStart, existingEnd):
        // return day is exclusive so a new pickup on the return day is allowed.
        public bool HasDateOverlap(
            DateTime requestedStart,
            DateTime requestedEnd,
            DateTime existingStart,
            DateTime existingEnd)
        {
            var reqStart = requestedStart.Date;
            var reqEnd = requestedEnd.Date;
            var extStart = existingStart.Date;
            var extEnd = existingEnd.Date;

            if (reqEnd <= reqStart)
                reqEnd = reqStart.AddDays(1);

            if (extEnd <= extStart)
                extEnd = extStart.AddDays(1);

            return reqStart < extEnd && extStart < reqEnd;
        }

        public async Task<bool> IsCarAvailableForRangeAsync(
            int carId,
            DateTime startDate,
            DateTime endDate,
            int? excludeRentalId = null)
        {
            var car = await _context.Cars
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == carId);

            if (car == null || car.Status == Status.Maintenance)
                return false;

            var rentals = await _context.Rentals
                .AsNoTracking()
                .Where(r =>
                    r.CarId == carId &&
                    BlockingStatuses.Contains(r.RentalStatus) &&
                    (!excludeRentalId.HasValue || r.Id != excludeRentalId.Value))
                .Select(r => new { r.StartDate, r.EndDate })
                .ToListAsync();

            return !rentals.Any(r => HasDateOverlap(startDate, endDate, r.StartDate, r.EndDate));
        }

        public async Task<IReadOnlyList<(DateTime StartDate, DateTime EndDate)>> GetBookedRangesAsync(int carId)
        {
            var ranges = await _context.Rentals
                .AsNoTracking()
                .Where(r => r.CarId == carId && BlockingStatuses.Contains(r.RentalStatus))
                .OrderBy(r => r.StartDate)
                .Select(r => new { r.StartDate, r.EndDate })
                .ToListAsync();

            return ranges
                .Select(r => (r.StartDate.Date, r.EndDate.Date))
                .ToList();
        }

        public RefundCalculationResult CalculateRefund(Rental rental, bool isCustomerCancellation = true)
        {
            if (rental == null)
                throw new ArgumentNullException(nameof(rental));

            var paid = Math.Max(0m, rental.PaidAmount);

            return rental.RentalStatus switch
            {
                RentalStatus.Pending => new RefundCalculationResult(
                    PaidAmount: paid,
                    FeeAmount: 0m,
                    RefundAmount: paid,
                    ResultingStatus: RentalStatus.Cancelled,
                    IsLateCancellation: false),

                RentalStatus.Approved => isCustomerCancellation
                    ? BuildApprovedCustomerCancellation(paid)
                    : new RefundCalculationResult(
                        PaidAmount: paid,
                        FeeAmount: 0m,
                        RefundAmount: paid,
                        ResultingStatus: RentalStatus.Rejected,
                        IsLateCancellation: false),

                RentalStatus.Rejected => new RefundCalculationResult(
                    PaidAmount: paid,
                    FeeAmount: 0m,
                    RefundAmount: paid,
                    ResultingStatus: RentalStatus.Rejected,
                    IsLateCancellation: false),

                RentalStatus.Cancelled => new RefundCalculationResult(
                    PaidAmount: paid,
                    FeeAmount: 0m,
                    RefundAmount: paid,
                    ResultingStatus: RentalStatus.Cancelled,
                    IsLateCancellation: false),

                RentalStatus.Refused => BuildApprovedCustomerCancellation(paid),

                RentalStatus.Active or RentalStatus.Completed => new RefundCalculationResult(
                    PaidAmount: paid,
                    FeeAmount: paid,
                    RefundAmount: 0m,
                    ResultingStatus: rental.RentalStatus,
                    IsLateCancellation: false),

                _ => throw new InvalidOperationException($"Unsupported rental status: {rental.RentalStatus}")
            };
        }

        private static RefundCalculationResult BuildApprovedCustomerCancellation(decimal paid)
        {
            var fee = Math.Round(paid * LateCancellationFeeRate, 2, MidpointRounding.AwayFromZero);
            var refund = Math.Max(0m, Math.Round(paid - fee, 2, MidpointRounding.AwayFromZero));

            return new RefundCalculationResult(
                PaidAmount: paid,
                FeeAmount: fee,
                RefundAmount: refund,
                ResultingStatus: RentalStatus.Refused,
                IsLateCancellation: true);
        }
    }
}