using System.ComponentModel.DataAnnotations;
using wayfare_backend.Dtos.CarDtos;

namespace wayfare_backend.Dtos.RentalDtos
{
    // POST /api/customer/rentcar/{carId}
    public class RentCarRequestDto
    {
        [Required] public DateTime StartDate { get; set; }
        [Required] public DateTime EndDate { get; set; }
        [Required] public int BranchId { get; set; }
    }

    // PUT /api/admin/reject/{id}
    public class RejectRentalRequestDto
    {
        [MaxLength(500)] public string? Reason { get; set; }
    }

    // PUT /api/admin/return/{id}
    public class ReturnRentalRequestDto
    {
        public DateTime? ReturnedAt { get; set; }
        [MaxLength(1000)] public string? Notes { get; set; }
    }

    public class RentalDto
    {
        public string Id { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string CarId { get; set; } = string.Empty;
        public string PickupDate { get; set; } = string.Empty;
        public string ReturnDate { get; set; } = string.Empty;
        public int Days { get; set; }
        public decimal Total { get; set; }
        public string PickupLocation { get; set; } = string.Empty; // branch id
        public string PickupLocationName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
        public decimal PaidAmount { get; set; }
        public decimal RefundedAmount { get; set; }
        public string PaidAt { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty; // paid | partial | refunded
        public string? PickedUpAt { get; set; }
        public string? ReturnedAt { get; set; }
        public string? Notes { get; set; }
        public string? Reason { get; set; }
        public CarDto? Car { get; set; }
        public CustomerDto? Customer { get; set; }
    }
}
