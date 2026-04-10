namespace Selu383.SP26.Api.Features.Menu;

public class MenuItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public int? Calories { get; set; }
    public int? SugarGrams { get; set; }

    public ICollection<MenuCustomizationGroup> CustomizationGroups { get; set; } = new List<MenuCustomizationGroup>();
}