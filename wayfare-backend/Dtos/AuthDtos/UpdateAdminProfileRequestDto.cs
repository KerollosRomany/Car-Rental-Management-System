using System.ComponentModel.DataAnnotations;

namespace wayfare_backend.Dtos.AuthDtos
{
    public class UpdateAdminProfileRequestDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;
    }
}