using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Extensions;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Menu;
using Selu383.SP26.Api.Features.Orders;
using Selu383.SP26.Api.Features.Rewards;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(DataContext dataContext) : ControllerBase
{
    [HttpPost("checkout")]
    public async Task<ActionResult<CheckoutResultDto>> Checkout(CheckoutDto dto)
    {
        if (dto.Items.Length == 0)
        {
            return BadRequest("Order must contain at least one item.");
        }

        User? currentUser = null;

        if (User.Identity?.IsAuthenticated == true)
        {
            var userId = User.GetCurrentUserId();
            currentUser = await dataContext.Users.SingleOrDefaultAsync(x => x.Id == userId);

            if (currentUser == null)
            {
                return Unauthorized();
            }
        }

        var requestedMenuItemIds = dto.Items
            .Select(x => x.MenuItemId)
            .Distinct()
            .ToList();

        var menuItems = await dataContext.MenuItems
            .AsNoTracking()
            .Where(x => x.IsActive && requestedMenuItemIds.Contains(x.Id))
            .Include(x => x.CustomizationGroups)
            .ThenInclude(x => x.Options)
            .ToListAsync();

        if (menuItems.Count != requestedMenuItemIds.Count)
        {
            return BadRequest("One or more menu items are invalid.");
        }

        var orderItems = new List<OrderItem>();
        decimal subtotal = 0m;

        foreach (var checkoutItem in dto.Items)
        {
            var menuItem = menuItems.Single(x => x.Id == checkoutItem.MenuItemId);

            var selectedByGroup = checkoutItem.SelectedOptions
                .GroupBy(x => x.GroupName, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(x => x.Key, x => x.Last(), StringComparer.OrdinalIgnoreCase);

            foreach (var selectedGroupName in selectedByGroup.Keys)
            {
                var isValidGroup = menuItem.CustomizationGroups.Any(g =>
                    string.Equals(g.Name, selectedGroupName, StringComparison.OrdinalIgnoreCase));

                if (!isValidGroup)
                {
                    return BadRequest($"Invalid customization group '{selectedGroupName}' for {menuItem.Name}.");
                }
            }

            decimal finalPrice = menuItem.Price;
            var selections = new List<OrderItemSelection>();

            foreach (var group in menuItem.CustomizationGroups)
            {
                selectedByGroup.TryGetValue(group.Name, out var selectedOptionDto);

                if (group.IsRequired && selectedOptionDto == null)
                {
                    return BadRequest($"Missing selection for {menuItem.Name}: {group.Name}.");
                }

                if (selectedOptionDto != null)
                {
                    var option = group.Options.SingleOrDefault(o =>
                        string.Equals(o.Name, selectedOptionDto.OptionName, StringComparison.OrdinalIgnoreCase));

                    if (option == null)
                    {
                        return BadRequest($"Invalid option '{selectedOptionDto.OptionName}' for {menuItem.Name} / {group.Name}.");
                    }

                    selections.Add(new OrderItemSelection
                    {
                        GroupName = group.Name,
                        OptionName = option.Name,
                        PriceModifier = option.PriceModifier
                    });

                    finalPrice += option.PriceModifier;
                }
            }

            var orderItem = new OrderItem
            {
                MenuItemId = menuItem.Id,
                NameSnapshot = menuItem.Name,
                BasePrice = menuItem.Price,
                FinalPrice = finalPrice,
                Selections = selections
            };

            orderItems.Add(orderItem);
            subtotal += finalPrice;
        }

        if (!TryGetRequestedBytes(dto.RedemptionChoice, subtotal, out var requestedBytes))
        {
            return BadRequest("Invalid redemption choice. Use none, ten, twentyfive, fifty, or full.");
        }

        if (requestedBytes > 0 && currentUser == null)
        {
            return BadRequest("You must be logged in to redeem Bytes.");
        }

        if (currentUser != null && requestedBytes > currentUser.ByteBalance)
        {
            return BadRequest("Not enough Bytes for that redemption option.");
        }

        var bytesRedeemed = currentUser == null ? 0 : requestedBytes;
        var discountAmount = bytesRedeemed / 100m;
        var total = subtotal - discountAmount;

        if (total < 0)
        {
            total = 0;
        }

        var bytesEarned = currentUser == null
            ? 0
            : (int)Math.Round(subtotal * RewardsConstants.BytesPerDollarSpent, MidpointRounding.AwayFromZero);

        if (currentUser != null)
        {
            currentUser.ByteBalance = currentUser.ByteBalance - bytesRedeemed + bytesEarned;
        }

        var order = new Order
        {
            UserId = currentUser?.Id,
            CreatedAt = DateTime.UtcNow,
            Subtotal = subtotal,
            DiscountAmount = discountAmount,
            Total = total,
            BytesRedeemed = bytesRedeemed,
            BytesEarned = bytesEarned,
            Status = "Completed",
            Items = orderItems
        };

        dataContext.Orders.Add(order);
        await dataContext.SaveChangesAsync();

        return Ok(new CheckoutResultDto
        {
            Order = MapOrder(order),
            NewByteBalance = currentUser?.ByteBalance ?? 0,
            ByteDollarValue = (currentUser?.ByteBalance ?? 0) / 100m
        });
    }

    [Authorize]
    [HttpGet("my")]
    public async Task<ActionResult<List<OrderDto>>> GetMyOrders()
    {
        var userId = User.GetCurrentUserId();

        var orders = await dataContext.Orders
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Include(x => x.Items)
            .ThenInclude(x => x.Selections)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(MapOrder).ToList());
    }

    [Authorize]
    [HttpGet("my/{id}")]
    public async Task<ActionResult<OrderDto>> GetMyOrderById(int id)
    {
        var userId = User.GetCurrentUserId();

        var order = await dataContext.Orders
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.Id == id)
            .Include(x => x.Items)
            .ThenInclude(x => x.Selections)
            .SingleOrDefaultAsync();

        if (order == null)
        {
            return NotFound();
        }

        return Ok(MapOrder(order));
    }

    private static bool TryGetRequestedBytes(string? redemptionChoice, decimal subtotal, out int requestedBytes)
    {
        var subtotalInCents = (int)Math.Round(subtotal * 100m, MidpointRounding.AwayFromZero);

        switch ((redemptionChoice ?? "none").Trim().ToLowerInvariant())
        {
            case "none":
                requestedBytes = 0;
                return true;

            case "ten":
                requestedBytes = (int)Math.Ceiling(subtotalInCents * 0.10m);
                return true;

            case "twentyfive":
                requestedBytes = (int)Math.Ceiling(subtotalInCents * 0.25m);
                return true;

            case "fifty":
                requestedBytes = (int)Math.Ceiling(subtotalInCents * 0.50m);
                return true;

            case "full":
                requestedBytes = subtotalInCents;
                return true;

            default:
                requestedBytes = 0;
                return false;
        }
    }

    private static OrderDto MapOrder(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            CreatedAt = order.CreatedAt,
            Subtotal = order.Subtotal,
            DiscountAmount = order.DiscountAmount,
            Total = order.Total,
            BytesRedeemed = order.BytesRedeemed,
            BytesEarned = order.BytesEarned,
            Status = order.Status,
            Items = order.Items
                .Select(x => new OrderItemDto
                {
                    MenuItemId = x.MenuItemId,
                    Name = x.NameSnapshot,
                    BasePrice = x.BasePrice,
                    FinalPrice = x.FinalPrice,
                    Selections = x.Selections
                        .Select(y => new OrderItemSelectionDto
                        {
                            GroupName = y.GroupName,
                            OptionName = y.OptionName,
                            PriceModifier = y.PriceModifier
                        })
                        .ToArray()
                })
                .ToArray()
        };
    }
}
//add
