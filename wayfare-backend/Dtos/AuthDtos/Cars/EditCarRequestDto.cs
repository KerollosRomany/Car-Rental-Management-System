using System.Collections.Generic;

namespace wayfare_backend.DTOs.Cars
{
    // Same fields and checks as AddCarRequestDto, plus the ids of the photos to keep.
    public class EditCarRequestDto : AddCarRequestDto
    {
        // Ids of existing images to keep, in the order they should show.
        // Images not listed are deleted.
        public List<int> KeepImageIds { get; set; } = new();
    }
}