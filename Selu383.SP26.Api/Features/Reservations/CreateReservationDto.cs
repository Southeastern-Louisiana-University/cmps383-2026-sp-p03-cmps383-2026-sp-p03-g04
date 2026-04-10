using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Reservations;

public class CreateReservationDto
{
    [Required]
    public int TableId { get; set; }

    [Required]
    public int LocationId { get; set; }

    [Required]
    public DateTime ReservedFor { get; set; }

    [Range(1, 20)]
    public int PartySize { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;
}
