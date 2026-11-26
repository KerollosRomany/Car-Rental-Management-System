using System;

namespace wayfare_backend.DTOs.Rentals
{
    public class CreateRentalRequestDto
    {
        public int CarId { get; set; }
        public DateTime PickupDate { get; set; }
        public DateTime ReturnDate { get; set; }
        public int? BranchId { get; set; }
        public string? PickupLocation { get; set; }
    }
}