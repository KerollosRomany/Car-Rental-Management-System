using System.ComponentModel.DataAnnotations;

namespace wayfare_backend.Dtos.AuthDtos
{
    public class UpdateAdminProfileRequestDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Phone { get; set; } = string.Empty;
    }
}