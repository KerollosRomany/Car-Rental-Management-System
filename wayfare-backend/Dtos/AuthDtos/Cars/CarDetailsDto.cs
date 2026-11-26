using System.Collections.Generic;

namespace wayfare_backend.DTOs.Cars
{
    public record BookedRangeDto(
        string From,
        string To
    );

    public record CarDetailsDto(
        int Id,
        string Brand,
        string Model,
        short Year,
        string Color,
        short Seats,
        short Bags,
        decimal DailyRate,
        string PlateNumber,
        string Description,
        string Status,
        string Fuel,
        string Transmission,
        string Category,
        int BranchId,
        string BranchName,
        IReadOnlyList<string> Features,
        IReadOnlyList<string> Images,
        IReadOnlyList<BookedRangeDto> BookedRanges
    );
}