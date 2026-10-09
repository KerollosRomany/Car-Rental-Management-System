using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.VisualBasic;
using wayfare_backend.Enums.RentalEnums;

namespace wayfare_backend.Models
{
    public class Rental
    {
        // PK 
        public int Id { get; set; }

        // Rental Properties 
        public DateTime CreatedAtDate  { get; private set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? RejectionReason { get; set; }   
        // transcation normalization 
        public decimal PaidAmount { get; set; }
        public decimal RefundedAmount { get; set; }
        //Rental Status Enum
        public RentalStatus RentalStatus { get; set; }
        
        // FK
        public int CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;
        public int BranchId { get; set; }
        public Branch Branch { get; set; } = null!;
        public int CarId { get; set; }
        public Car Car { get; set; } = null!;

        // Ctor for Request creation 
        public Rental()
        {
            CreatedAtDate = DateTime.UtcNow;
        }

    }
}