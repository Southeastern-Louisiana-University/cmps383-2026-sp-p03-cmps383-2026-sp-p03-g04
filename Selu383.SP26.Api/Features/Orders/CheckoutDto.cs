using System.ComponentModel.DataAnnotations;

namespace Selu383.SP26.Api.Features.Orders;

public class CheckoutDto
{
    [Required, MinLength(1)]
    public CheckoutItemDto[] Items { get; set; } = Array.Empty<CheckoutItemDto>();

    [Required]
    public string RedemptionChoice { get; set; } = "none";
}

public class CheckoutItemDto
{
    [Required]
    public int MenuItemId { get; set; }

    public CheckoutSelectionDto[] SelectedOptions { get; set; } = Array.Empty<CheckoutSelectionDto>();
}

public class CheckoutSelectionDto
{
    [Required]
    public string GroupName { get; set; } = string.Empty;

    [Required]
    public string OptionName { get; set; } = string.Empty;
}