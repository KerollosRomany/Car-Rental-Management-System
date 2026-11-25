namespace wayfare_backend.Dtos.AuthDtos
{
    public class AdminProfileDto
    {
        public string AdminId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }
}