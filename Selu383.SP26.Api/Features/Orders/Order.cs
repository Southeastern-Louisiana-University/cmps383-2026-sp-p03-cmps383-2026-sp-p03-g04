using Selu383.SP26.Api.Features.Auth;

namespace Selu383.SP26.Api.Features.Orders;

public class Order

{
    public int Id { get; set; }

    public int? UserId { get; set; }
    public User? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }

    public int BytesRedeemed { get; set; }
    public int BytesEarned { get; set; }

    public string Status { get; set; } = "Completed";

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}