using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using wayfare_backend.DTOs.Cars;
using wayfare_backend.Services;

namespace wayfare_backend.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminCarController : ControllerBase
    {
        private const long MaxRequestSize = 45 * 1024 * 1024; 

        private readonly IAdminCarService _carService;

        public AdminCarController(IAdminCarService carService)
        {
            _carService = carService;
        }

        // GET /api/admin/cars
        [HttpGet("cars")]
        public async Task<ActionResult<IEnumerable<AdminCarDto>>> ListCars()
        {
            var cars = await _carService.GetAllAsync();
            return Ok(cars);
        }


        // POST /api/admin/newcar   (multipart/form-data)
        [HttpPost("newcar")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(MaxRequestSize)]
        public async Task<ActionResult<AdminCarDto>> AddCar([FromForm] AddCarRequestDto request)
        {
            var result = await _carService.AddAsync(request);
            if (!result.Succeeded)
                return ToErrorResponse(result);

            return CreatedAtAction(
                actionName: nameof(CarController.GetCarById),
                controllerName: "Car",
                routeValues: new { id = result.Data!.Id },
                value: result.Data);
        }

        // PUT /api/admin/editcar/{id}   (multipart/form-data)
        [HttpPut("editcar/{id:int}")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(MaxRequestSize)]
        public async Task<ActionResult<AdminCarDto>> EditCar(int id, [FromForm] EditCarRequestDto request)
        {
            var result = await _carService.EditAsync(id, request);
            if (!result.Succeeded)
                return ToErrorResponse(result);

            return Ok(result.Data);
        }

        // DELETE /api/admin/deletecar/{id}
        [HttpDelete("deletecar/{id:int}")]
        public async Task<IActionResult> DeleteCar(int id)
        {
            var result = await _carService.DeleteAsync(id);
            if (!result.Succeeded)
                return ToErrorResponse(result);

            return NoContent();
        }

        // Turns a failed ServiceResult into 400 / 404 / 409.
        private ActionResult ToErrorResponse(ServiceResult result)
        {
            switch (result.ErrorType)
            {
                case ServiceErrorType.NotFound:
                    return NotFound(new { message = result.Message });

                case ServiceErrorType.Conflict:
                    return Conflict(new { message = result.Message });

                case ServiceErrorType.Validation when result.ValidationErrors.Count > 0:
                    foreach (var (field, messages) in result.ValidationErrors)
                        foreach (var message in messages)
                            ModelState.AddModelError(field, message);
                    return ValidationProblem(ModelState);

                default:
                    return BadRequest(new { message = result.Message });
            }
        }
    }
}