namespace wayfare_backend.Dtos.AuthDtos
{
    public class UserProfileDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? LicenseUrl { get; set; }
    }
}