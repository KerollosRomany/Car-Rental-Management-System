using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using wayfare_backend.DTOs.Rentals;
using wayfare_backend.Enums.CarEnums;
using wayfare_backend.Enums.RentalEnums;
using wayfare_backend.Models;
using wayfare_backend.Services;

namespace wayfare_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RentalRequestController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IRentalRulesService _rentalRulesService;

        public RentalRequestController(AppDbContext context, IRentalRulesService rentalRulesService)
        {
            _context = context;
            _rentalRulesService = rentalRulesService;
        }

        [HttpPost]
        public async Task<ActionResult<RentalRequestResponseDto>> CreateRentalRequest(
            [FromBody] CreateRentalRequestDto dto)
        {
            if (dto.ReturnDate.Date <= dto.PickupDate.Date)
            {
                return BadRequest(new { message = "Return date must be after pick-up date." });
            }

            var car = await _context.Cars
                .Include(c => c.Branch)
                .FirstOrDefaultAsync(c => c.Id == dto.CarId);

            if (car == null)
            {
                return NotFound(new { message = "Car not found." });
            }

            if (car.Status == Status.Maintenance)
            {
                return BadRequest(new { message = "This car is currently in maintenance." });
            }

            if (dto.BranchId.HasValue && dto.BranchId.Value != car.BranchId)
            {
                return BadRequest(new { message = "Branch cannot be changed from the car's assigned branch." });
            }

            var isAvailable = await _rentalRulesService.IsCarAvailableForRangeAsync(
                car.Id,
                dto.PickupDate,
                dto.ReturnDate);

            if (!isAvailable)
            {
                return Conflict(new { message = "This car is already booked for the selected dates." });
            }

            var branch = car.Branch ?? await _context.Branches.FirstOrDefaultAsync(b => b.Id == car.BranchId);
            if (branch == null)
            {
                return BadRequest(new { message = "Assigned branch for this car was not found." });
            }

            var customerId = await ResolveCustomerIdAsync();
            if (customerId == null)
            {
                return BadRequest(new { message = "No customer profile found for this request." });
            }

            var totalAmount = _rentalRulesService.CalculateTotalAmount(
                car.DailyRate,
                dto.PickupDate,
                dto.ReturnDate);

            var rental = new Rental
            {
                CarId = car.Id,
                CustomerId = customerId.Value,
                BranchId = car.BranchId,
                StartDate = dto.PickupDate.Date,
                EndDate = dto.ReturnDate.Date,
                TotalAmount = totalAmount,
                PaidAmount = totalAmount,
                RefundedAmount = 0m,
                RentalStatus = RentalStatus.Pending
            };

            _context.Rentals.Add(rental);
            await _context.SaveChangesAsync();

            rental.Car = car;
            rental.Branch = branch;

            return CreatedAtAction(
                nameof(GetRentalRequestById),
                new { id = rental.Id },
                rental.ToRequestResponseDto(_rentalRulesService));
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<RentalRequestResponseDto>> GetRentalRequestById(int id)
        {
            var rental = await _context.Rentals
                .AsNoTracking()
                .Include(r => r.Car)
                .Include(r => r.Branch)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (rental == null)
                return NotFound();

            return Ok(rental.ToRequestResponseDto(_rentalRulesService));
        }

        private async Task<int?> ResolveCustomerIdAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                var customer = await _context.Customers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.UserId == userId);
                if (customer != null)
                    return customer.Id;
            }

            var firstCustomer = await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync();

            return firstCustomer?.Id;
        }
    }
}