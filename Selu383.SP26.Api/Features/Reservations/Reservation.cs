namespace Selu383.SP26.Api.Features.Reservations;

public class Reservation
{
    public int Id { get; set; }

    public int TableId { get; set; }

    public int LocationId { get; set; }

    public DateTime ReservedFor { get; set; }

    public int PartySize { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Status { get; set; } = "Active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}