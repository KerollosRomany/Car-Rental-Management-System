using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace wayfare_backend.Models
{
    public class CarImage
    {
        // PK
        public int Id { get; set; }
        // Image Properites
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsMainImage { get; set; }
        public int DisplayOrder { get; set; }
        // FK    
        public int CarId { get; set; }
        public Car Car { get; set; } = null!;
    }
}