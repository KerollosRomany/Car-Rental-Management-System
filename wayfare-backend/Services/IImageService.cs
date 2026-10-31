using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace wayfare_backend.Services
{
<<<<<<< HEAD
	public interface IImageService
	{
		Task<string> UploadImageAsync(IFormFile file);
	}
=======
    public interface IImageService
    {
        Task<string?> UploadImageAsync(IFormFile? file, string folderName);
        Task DeleteImageAsync(string? imageUrl);
    }
>>>>>>> a27b103 (feat: implement accounts and profiles endpoints)
}