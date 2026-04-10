namespace Selu383.SP26.Api.Features.Orders;

public class OrderDto
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; }

    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }

    public int BytesRedeemed { get; set; }
    public int BytesEarned { get; set; }

    public string Status { get; set; } = string.Empty;

    public OrderItemDto[] Items { get; set; } = Array.Empty<OrderItemDto>();
}

public class OrderItemDto
{
    public int MenuItemId { get; set; }

    public string Name { get; set; } = string.Empty;

    public decimal BasePrice { get; set; }
    public decimal FinalPrice { get; set; }

    public OrderItemSelectionDto[] Selections { get; set; } = Array.Empty<OrderItemSelectionDto>();
}

public class OrderItemSelectionDto
{
    public string GroupName { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public decimal PriceModifier { get; set; }
}

public class CheckoutResultDto
{
    public OrderDto Order { get; set; } = new();
    public int NewByteBalance { get; set; }
    public decimal ByteDollarValue { get; set; }
}