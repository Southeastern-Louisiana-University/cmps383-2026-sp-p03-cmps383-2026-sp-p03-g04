namespace Selu383.SP26.Api.Features.Menu;

public class MenuCustomizationOption
{
    public int Id { get; set; }

    public int MenuCustomizationGroupId { get; set; }
    public MenuCustomizationGroup? MenuCustomizationGroup { get; set; }

    public string Name { get; set; } = string.Empty;
    public decimal PriceModifier { get; set; }
}