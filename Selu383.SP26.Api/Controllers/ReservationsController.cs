using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Reservations;
using Selu383.SP26.Api.Features.Tables;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/reservations")]
public class ReservationsController(DataContext dataContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ReservationDto>>> GetAll([FromQuery] int? locationId, [FromQuery] DateTime? date)
    {
        var query = dataContext.Reservations
            .AsNoTracking()
            .Where(x => x.Status == "Active");

        if (locationId.HasValue)
        {
            query = query.Where(x => x.LocationId == locationId.Value);
        }

        if (date.HasValue)
        {
            var start = date.Value.Date;
            var end = start.AddDays(1);
            query = query.Where(x => x.ReservedFor >= start && x.ReservedFor < end);
        }

        var results = await query
            .OrderBy(x => x.ReservedFor)
            .Select(x => new ReservationDto
            {
                Id = x.Id,
                TableId = x.TableId,
                LocationId = x.LocationId,
                ReservedFor = x.ReservedFor,
                PartySize = x.PartySize,
                Name = x.Name,
                Status = x.Status
            })
            .ToListAsync();

        return Ok(results);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReservationDto>> GetById(int id)
    {
        var result = await dataContext.Reservations
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new ReservationDto
            {
                Id = x.Id,
                TableId = x.TableId,
                LocationId = x.LocationId,
                ReservedFor = x.ReservedFor,
                PartySize = x.PartySize,
                Name = x.Name,
                Status = x.Status
            })
            .SingleOrDefaultAsync();

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ReservationDto>> Create(CreateReservationDto dto)
    {
        var table = await dataContext.CafeTables
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == dto.TableId && x.LocationId == dto.LocationId && x.IsActive);

        if (table == null)
        {
            return BadRequest("Invalid table.");
        }

        if (dto.PartySize > table.Seats)
        {
            return BadRequest("Party size exceeds table capacity.");
        }

        var minimumReservationTime = DateTime.Now.AddHours(2);
        if (dto.ReservedFor < minimumReservationTime)
        {
            return BadRequest("Reservations must be made at least 2 hours in advance.");
        }

        var startWindow = dto.ReservedFor.AddMinutes(-90);
        var endWindow = dto.ReservedFor.AddMinutes(90);

        var tableAlreadyReserved = await dataContext.Reservations.AnyAsync(x =>
            x.TableId == dto.TableId &&
            x.Status == "Active" &&
            x.ReservedFor >= startWindow &&
            x.ReservedFor <= endWindow);

        if (tableAlreadyReserved)
        {
            return BadRequest("That table is already reserved near that time.");
        }

        var reservation = new Reservation
        {
            TableId = dto.TableId,
            LocationId = dto.LocationId,
            ReservedFor = dto.ReservedFor,
            PartySize = dto.PartySize,
            Name = dto.Name,
            Status = "Active"
        };

        dataContext.Reservations.Add(reservation);
        await dataContext.SaveChangesAsync();

        var result = new ReservationDto
        {
            Id = reservation.Id,
            TableId = reservation.TableId,
            LocationId = reservation.LocationId,
            ReservedFor = reservation.ReservedFor,
            PartySize = reservation.PartySize,
            Name = reservation.Name,
            Status = reservation.Status
        };

        return CreatedAtAction(nameof(GetById), new { id = reservation.Id }, result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Cancel(int id)
    {
        var reservation = await dataContext.Reservations.SingleOrDefaultAsync(x => x.Id == id);

        if (reservation == null)
        {
            return NotFound();
        }

        reservation.Status = "Cancelled";
        await dataContext.SaveChangesAsync();

        return Ok();
    }
}