using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Data;
using Selu383.SP26.Api.Features.Menu;

namespace Selu383.SP26.Api.Controllers;

[ApiController]
[Route("api/menu")]
public class MenuController(DataContext dataContext) : ControllerBase
{
    [HttpGet("items")]
    public async Task<ActionResult<List<MenuItemDto>>> GetItems([FromQuery] string? category)
    {
        var query = dataContext.MenuItems
            .AsNoTracking()
            .Where(x => x.IsActive);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(x => x.Category == category);
        }

        var items = await query
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Name)
            .Select(x => new MenuItemDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                Category = x.Category,
                Price = x.Price,
                ImageUrl = x.ImageUrl,
                Calories = x.Calories,
                SugarGrams = x.SugarGrams,
                Customizations = x.CustomizationGroups
                    .OrderBy(g => g.Name)
                    .Select(g => new MenuCustomizationGroupDto
                    {
                        Name = g.Name,
                        IsRequired = g.IsRequired,
                        Options = g.Options
                            .OrderBy(o => o.Name)
                            .Select(o => new MenuCustomizationOptionDto
                            {
                                Name = o.Name,
                                PriceModifier = o.PriceModifier
                            })
                            .ToArray()
                    })
                    .ToArray()
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("items/{id}")]
    public async Task<ActionResult<MenuItemDto>> GetItemById(int id)
    {
        var item = await dataContext.MenuItems
            .AsNoTracking()
            .Where(x => x.IsActive && x.Id == id)
            .Select(x => new MenuItemDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                Category = x.Category,
                Price = x.Price,
                ImageUrl = x.ImageUrl,
                Calories = x.Calories,
                SugarGrams = x.SugarGrams,
                Customizations = x.CustomizationGroups
                    .OrderBy(g => g.Name)
                    .Select(g => new MenuCustomizationGroupDto
                    {
                        Name = g.Name,
                        IsRequired = g.IsRequired,
                        Options = g.Options
                            .OrderBy(o => o.Name)
                            .Select(o => new MenuCustomizationOptionDto
                            {
                                Name = o.Name,
                                PriceModifier = o.PriceModifier
                            })
                            .ToArray()
                    })
                    .ToArray()
            })
            .SingleOrDefaultAsync();

        if (item == null)
        {
            return NotFound();
        }

        return Ok(item);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        var categories = await dataContext.MenuItems
            .AsNoTracking()
            .Where(x => x.IsActive)
            .Select(x => x.Category)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("nutrition")]
    public async Task<ActionResult<List<NutritionDto>>> GetNutrition()
    {
        var nutrition = await dataContext.MenuItems
            .AsNoTracking()
            .Where(x => x.IsActive && (x.Calories != null || x.SugarGrams != null))
            .OrderBy(x => x.Name)
            .Select(x => new NutritionDto
            {
                Name = x.Name,
                Calories = x.Calories,
                SugarGrams = x.SugarGrams
            })
            .ToListAsync();

        return Ok(nutrition);
    }
}