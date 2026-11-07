using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using wayfare_backend.Enums.BranchEnums;

namespace wayfare_backend.Models
{
    public class Branch
    {
        public int Id { get; set; }
        public BranchName Name { get; set; }
        public ICollection<Car> Cars { get; set; } 
            = new List<Car>();
        public ICollection<Rental> Rentals { get; set; } 
            = new List<Rental>();
    }
}