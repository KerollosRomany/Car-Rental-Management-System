using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace wayfare_backend.Services
{
    public class CloudflareImageService : IImageService
    {
        private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB maximum file size limit
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _publicUrl;

        public CloudflareImageService(IConfiguration configuration)
        {
            var r2Config = configuration.GetSection("CloudflareR2");
            
            // Fallback to empty string if configuration values are not present
            _bucketName = r2Config["BucketName"] ?? string.Empty;
            _publicUrl = r2Config["PublicUrl"] ?? string.Empty;

            var s3Config = new AmazonS3Config
            {
                ServiceURL = r2Config["ServiceUrl"],
                ForcePathStyle = true
            };

            _s3Client = new AmazonS3Client(r2Config["AccessKey"], r2Config["SecretKey"], s3Config);
        }

        public async Task<string?> UploadImageAsync(IFormFile? file, string folderName)
        {
            if (file == null || file.Length == 0)
                return null;

            // 1. Validate file size (must be <= 5MB)
            if (file.Length > MaxFileSize)
                throw new BadHttpRequestException("Image size must not exceed 5MB.");

            // 2. Validate declared file extension
            var rawExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(rawExtension))
                throw new BadHttpRequestException("Invalid image format. Allowed formats: jpg, jpeg, png, webp.");

            // 3. Inspect magic bytes to verify actual file format
            using var stream = file.OpenReadStream();
            var detectedFormat = DetectImageFormat(stream);

            if (detectedFormat == null)
                throw new BadHttpRequestException("The uploaded file is not a valid image or the content is corrupted.");

            // 4. Ensure detected magic byte signature matches declared file extension
            if (!IsFormatMatchingExtension(detectedFormat.Value.Extension, rawExtension))
                throw new BadHttpRequestException("Image content does not match its file extension.");

            // 5. Use server-trusted extension and content-type instead of client input
            var safeExtension = detectedFormat.Value.Extension;
            var safeContentType = detectedFormat.Value.ContentType;

            var uniqueFileName = $"{Guid.NewGuid()}{safeExtension}";
            var objectKey = string.IsNullOrWhiteSpace(folderName)
                ? uniqueFileName
                : $"{folderName.Trim('/')}/{uniqueFileName}";

            // Reset stream position to beginning before streaming upload to S3/R2
            stream.Position = 0;

            var putRequest = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = objectKey,
                InputStream = stream,
                ContentType = safeContentType,
                DisablePayloadSigning = true
            };

            await _s3Client.PutObjectAsync(putRequest);

            return $"{_publicUrl.TrimEnd('/')}/{objectKey}";
        }

        public async Task DeleteImageAsync(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return;

            var uri = new Uri(imageUrl);
            var objectKey = uri.AbsolutePath.TrimStart('/');

            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = objectKey
            };

            await _s3Client.DeleteObjectAsync(deleteRequest);
        }

        /// <summary>
        /// Reads the file header magic bytes to detect file format and assign trusted Content-Type.
        /// </summary>
        private (string Extension, string ContentType)? DetectImageFormat(Stream stream)
        {
            if (stream.Length < 12)
                return null;

            byte[] header = new byte[12];
            stream.Position = 0;
            stream.ReadExactly(header, 0, 12);
            stream.Position = 0;

            // JPEG header signature: FF D8 FF
            if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
                return (".jpg", "image/jpeg");

            // PNG header signature: 89 50 4E 47 0D 0A 1A 0A
            if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 &&
                header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
                return (".png", "image/png");

            // WEBP header signature: "RIFF" (bytes 0-3) and "WEBP" (bytes 8-11)
            if (header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
                header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50)
                return (".webp", "image/webp");

            return null;
        }

        /// <summary>
        /// Verifies compatibility between detected format and file extension.
        /// </summary>
        private bool IsFormatMatchingExtension(string detectedExt, string rawExt)
        {
            if (detectedExt == ".jpg" && (rawExt == ".jpg" || rawExt == ".jpeg"))
                return true;

            return detectedExt == rawExt;
        }
    }
}