namespace Selu383.SP26.Api.Features.Tables;

public class CafeTable
{
    public int Id { get; set; }

    public int LocationId { get; set; }

    public string Label { get; set; } = string.Empty;

    public int Seats { get; set; }

    public bool IsActive { get; set; } = true;
}