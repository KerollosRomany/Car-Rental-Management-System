using System.Collections.Generic;
using System.Threading.Tasks;
using wayfare_backend.DTOs.Cars;

namespace wayfare_backend.Services
{
    public interface IAdminCarService
    {
        Task<IReadOnlyList<AdminCarDto>> GetAllAsync();

        Task<ServiceResult<AdminCarDto>> AddAsync(AddCarRequestDto request);

        Task<ServiceResult<AdminCarDto>> EditAsync(int id, EditCarRequestDto request);

        Task<ServiceResult> DeleteAsync(int id);
    }
}
