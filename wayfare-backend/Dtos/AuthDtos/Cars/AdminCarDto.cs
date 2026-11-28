using System.Collections.Generic;

namespace wayfare_backend.DTOs.Cars
{
    public record AdminCarImageDto(
        int Id,
        string Url,
        bool IsMain,
        int DisplayOrder
    );

    // A car as staff see it: plate, status, branch and every image with its id.
    public record AdminCarDto(
        int Id,
        string Brand,
        string Model,
        short Year,
        string CarType,
        string Transmission,
        string Fuel,
        short Seats,
        short Luggage,
        decimal DailyRate,
        string Color,
        string PlateNumber,
        string Status,
        int BranchId,
        string BranchName,
        string Description,
        IReadOnlyList<string> Features,
        IReadOnlyList<AdminCarImageDto> Images
    );
}