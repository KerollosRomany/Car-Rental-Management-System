using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace wayfare_backend.Services
{
    public class CloudflareImageService : IImageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _publicUrl;

        public CloudflareImageService(IConfiguration configuration)
        {
            var r2Config = configuration.GetSection("CloudflareR2");
            
            // معالجة التحذير CS8618 بإعطاء قيمة افتراضية في حال كان الإعداد فارغاً
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

            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var objectKey = string.IsNullOrWhiteSpace(folderName)
                ? uniqueFileName
                : $"{folderName.Trim('/')}/{uniqueFileName}";

            var putRequest = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = objectKey,
                InputStream = file.OpenReadStream(),
                ContentType = file.ContentType,
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
    }
}