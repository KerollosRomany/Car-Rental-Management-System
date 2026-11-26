using System;

namespace wayfare_backend.DTOs.Rentals
{
    public record RentalRequestResponseDto(
        int Id,
        string Reference,
        int CarId,
        string CarBrand,
        string CarModel,
        int BranchId,
        string BranchName,
        string StartDate,
        string EndDate,
        int Days,
        decimal TotalAmount,
        decimal PaidAmount,
        decimal RefundedAmount,
        string Status
    );
}