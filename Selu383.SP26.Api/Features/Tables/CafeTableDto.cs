namespace Selu383.SP26.Api.Features.Tables;

public class CafeTableDto
{
    public int Id { get; set; }

    public int LocationId { get; set; }

    public string Label { get; set; } = string.Empty;

    public int Seats { get; set; }

    public string Status { get; set; } = "available";
}