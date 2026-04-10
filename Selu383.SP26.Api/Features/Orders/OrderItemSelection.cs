namespace Selu383.SP26.Api.Features.Orders;

public class OrderItemSelection
{
    public int Id { get; set; }

    public int OrderItemId { get; set; }
    public OrderItem? OrderItem { get; set; }

    public string GroupName { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;

    public decimal PriceModifier { get; set; }
}