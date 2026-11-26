using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace wayfare_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BranchesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BranchesController(AppDbContext context)
        {
            _context = context;
        }

        public record BranchDto(int Id, string Name);

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BranchDto>>> GetBranches()
        {
            var branches = await _context.Branches
                .AsNoTracking()
                .OrderBy(b => b.Id)
                .ToListAsync();

            var result = branches
                .Select(b => new BranchDto(b.Id, b.Name.ToString()))
                .ToList();

            return Ok(result);
        }
    }
}