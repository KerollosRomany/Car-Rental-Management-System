using System.Collections.Generic;

namespace wayfare_backend.DTOs.Cars
{
    public record CarListItemDto(
        int Id,
        string Brand,
        string Model,
        short Year,
        string Color,
        short Seats,
        short Bags,
        decimal DailyRate,
        string Description,
        string IncludedFeature,
        string Status,
        string Fuel,
        string Transmission,
        string Category,
        int BranchId,
        string BranchName,
        IReadOnlyList<string> Images,
        bool AvailableForDates
    );
}