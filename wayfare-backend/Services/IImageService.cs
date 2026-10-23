using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace wayfare_backend.Services
{
	public interface IImageService
	{
		Task<string> UploadImageAsync(IFormFile file);
	}
}