using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using wayfare_backend.DTOs.Cars;
using wayfare_backend.Enums.CarEnums;
using wayfare_backend.Models;
using wayfare_backend.Services;

namespace wayfare_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IRentalRulesService _rentalRulesService;

        public CarsController(AppDbContext context, IRentalRulesService rentalRulesService)
        {
            _context = context;
            _rentalRulesService = rentalRulesService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CarListItemDto>>> GetCars([FromQuery] CarFilterQueryDto query)
        {
            var carsQuery = _context.Cars
                .AsNoTracking()
                .Include(c => c.Branch)
                .Include(c => c.Images)
                .AsQueryable();

            if (!query.IncludeMaintenance)
            {
                carsQuery = carsQuery.Where(c => c.Status != Status.Maintenance);
            }

            if (query.BranchId.HasValue)
            {
                carsQuery = carsQuery.Where(c => c.BranchId == query.BranchId.Value);
            }

            if (query.Category is { Count: > 0 })
            {
                carsQuery = carsQuery.Where(c => query.Category.Contains(c.CarType));
            }

            if (query.Fuel is { Count: > 0 })
            {
                carsQuery = carsQuery.Where(c => query.Fuel.Contains(c.Fuel));
            }

            if (query.Transmission.HasValue)
            {
                carsQuery = carsQuery.Where(c => c.Transmission == query.Transmission.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Seats) && query.Seats != "Any")
            {
                carsQuery = query.Seats switch
                {
                    "2-4" => carsQuery.Where(c => c.Seat <= 4),
                    "5" => carsQuery.Where(c => c.Seat == 5),
                    "7+" => carsQuery.Where(c => c.Seat >= 7),
                    _ => carsQuery
                };
            }

            if (query.MaxPrice.HasValue && query.MaxPrice.Value > 0)
            {
                carsQuery = carsQuery.Where(c => c.DailyRate <= query.MaxPrice.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Q))
            {
                var term = query.Q.Trim().ToLower();
                carsQuery = carsQuery.Where(c =>
                    c.Brand.ToLower().Contains(term) ||
                    c.Model.ToLower().Contains(term) ||
                    c.Description.ToLower().Contains(term));
            }

            var cars = await carsQuery.ToListAsync();

            bool hasDateRange = query.From.HasValue && query.To.HasValue;
            if (!hasDateRange && !query.IncludeMaintenance)
            {
                cars = cars.Where(c => c.Status == Status.Available).ToList();
            }

            var filteredCars = new List<Car>();
            foreach (var car in cars)
            {
                if (hasDateRange)
                {
                    var isAvailable = await _rentalRulesService.IsCarAvailableForRangeAsync(
                        car.Id,
                        query.From!.Value,
                        query.To!.Value);

                    if (isAvailable)
                        filteredCars.Add(car);
                }
                else
                {
                    filteredCars.Add(car);
                }
            }

            IEnumerable<Car> sorted = query.Sort switch
            {
                "price-asc" => filteredCars.OrderBy(c => c.DailyRate).ThenBy(c => c.Id),
                "price-desc" => filteredCars.OrderByDescending(c => c.DailyRate).ThenBy(c => c.Id),
                _ => filteredCars.OrderBy(c => c.Id)
            };

            var result = sorted.Select(c => c.ToListItemDto(availableForDates: true)).ToList();
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CarDetailsDto>> GetCarById(int id)
        {
            var car = await _context.Cars
                .AsNoTracking()
                .Include(c => c.Branch)
                .Include(c => c.Images)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (car == null)
                return NotFound();

            var bookedRanges = await _rentalRulesService.GetBookedRangesAsync(car.Id);
            var dto = car.ToDetailsDto(bookedRanges);

            return Ok(dto);
        }
    }
}