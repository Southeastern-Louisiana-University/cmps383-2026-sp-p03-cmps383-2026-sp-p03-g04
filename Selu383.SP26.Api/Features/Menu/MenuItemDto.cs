namespace Selu383.SP26.Api.Features.Menu;

public class MenuItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public int? Calories { get; set; }
    public int? SugarGrams { get; set; }
    public MenuCustomizationGroupDto[] Customizations { get; set; } = Array.Empty<MenuCustomizationGroupDto>();
}

public class MenuCustomizationGroupDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public MenuCustomizationOptionDto[] Options { get; set; } = Array.Empty<MenuCustomizationOptionDto>();
}

public class MenuCustomizationOptionDto
{
    public string Name { get; set; } = string.Empty;
    public decimal PriceModifier { get; set; }
}