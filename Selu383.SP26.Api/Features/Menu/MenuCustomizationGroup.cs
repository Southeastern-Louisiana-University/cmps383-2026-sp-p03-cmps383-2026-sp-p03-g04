namespace Selu383.SP26.Api.Features.Menu;

public class MenuCustomizationGroup
{
    public int Id { get; set; }

    public int MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }

    public string Name { get; set; } = string.Empty;
    public bool IsRequired { get; set; }

    public ICollection<MenuCustomizationOption> Options { get; set; } = new List<MenuCustomizationOption>();
}