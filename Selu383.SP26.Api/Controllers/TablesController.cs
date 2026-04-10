using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Tables;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/tables")]
public class TablesController(DataContext dataContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CafeTableDto>>> GetAll([FromQuery] int? locationId, [FromQuery] DateTime? reservedFor)
    {
        var tablesQuery = dataContext.CafeTables
            .AsNoTracking()
            .Where(x => x.IsActive);

        if (locationId.HasValue)
        {
            tablesQuery = tablesQuery.Where(x => x.LocationId == locationId.Value);
        }

        var tables = await tablesQuery
            .OrderBy(x => x.LocationId)
            .ThenBy(x => x.Label)
            .ToListAsync();

        DateTime? startWindow = null;
        DateTime? endWindow = null;

        if (reservedFor.HasValue)
        {
            startWindow = reservedFor.Value.AddMinutes(-90);
            endWindow = reservedFor.Value.AddMinutes(90);
        }

        var reservedTableIds = new HashSet<int>();

        if (startWindow.HasValue && endWindow.HasValue)
        {
            var reservationQuery = dataContext.Reservations
                .AsNoTracking()
                .Where(x => x.Status == "Active");

            if (locationId.HasValue)
            {
                reservationQuery = reservationQuery.Where(x => x.LocationId == locationId.Value);
            }

            var reservedIds = await reservationQuery
                .Where(x => x.ReservedFor >= startWindow.Value && x.ReservedFor <= endWindow.Value)
                .Select(x => x.TableId)
                .Distinct()
                .ToListAsync();

            reservedTableIds = reservedIds.ToHashSet();
        }

        var results = tables
            .Select(x => new CafeTableDto
            {
                Id = x.Id,
                LocationId = x.LocationId,
                Label = x.Label,
                Seats = x.Seats,
                Status = reservedTableIds.Contains(x.Id) ? "occupied" : "available"
            })
            .ToList();

        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CafeTableDto>> GetById(int id, [FromQuery] DateTime? reservedFor)
    {
        var table = await dataContext.CafeTables
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.IsActive && x.Id == id);

        if (table == null)
        {
            return NotFound();
        }

        var status = "available";

        if (reservedFor.HasValue)
        {
            var startWindow = reservedFor.Value.AddMinutes(-90);
            var endWindow = reservedFor.Value.AddMinutes(90);

            var isReserved = await dataContext.Reservations
                .AsNoTracking()
                .AnyAsync(x =>
                    x.TableId == table.Id &&
                    x.Status == "Active" &&
                    x.ReservedFor >= startWindow &&
                    x.ReservedFor <= endWindow);

            if (isReserved)
            {
                status = "occupied";
            }
        }

        var result = new CafeTableDto
        {
            Id = table.Id,
            LocationId = table.LocationId,
            Label = table.Label,
            Seats = table.Seats,
            Status = status
        };

        return Ok(result);
    }
}