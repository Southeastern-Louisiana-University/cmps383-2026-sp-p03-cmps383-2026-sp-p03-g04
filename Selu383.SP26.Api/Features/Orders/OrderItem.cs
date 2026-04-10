namespace Selu383.SP26.Api.Features.Orders;

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int MenuItemId { get; set; }

    public string NameSnapshot { get; set; } = string.Empty;

    public decimal BasePrice { get; set; }
    public decimal FinalPrice { get; set; }

    public ICollection<OrderItemSelection> Selections { get; set; } = new List<OrderItemSelection>();
}