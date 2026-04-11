using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Selu383.SP26.Api.Features.Auth;
using Selu383.SP26.Api.Features.Locations;
using Selu383.SP26.Api.Features.Menu;
using Selu383.SP26.Api.Features.Reservations;
using Selu383.SP26.Api.Features.Tables;

namespace Selu383.SP26.Api.Data;

public static class SeedHelper
{
    public static async Task MigrateAndSeed(IServiceProvider serviceProvider)
    {
        var dataContext = serviceProvider.GetRequiredService<DataContext>();

        await dataContext.Database.MigrateAsync();

        await AddRoles(serviceProvider);
        await AddUsers(serviceProvider);
        await AddLocations(dataContext);
        await AddMenuItems(dataContext);
        await AddTables(dataContext);
        await UpdateNutritionEstimates(dataContext);
    }

    private static async Task AddUsers(IServiceProvider serviceProvider)
    {
        const string defaultPassword = "Password123!";
        var userManager = serviceProvider.GetRequiredService<UserManager<User>>();

        if (userManager.Users.Any())
        {
            return;
        }

        var adminUser = new User
        {
            UserName = "galkadi"
        };
        await userManager.CreateAsync(adminUser, defaultPassword);
        await userManager.AddToRoleAsync(adminUser, RoleNames.Admin);

        var bob = new User
        {
            UserName = "bob"
        };
        await userManager.CreateAsync(bob, defaultPassword);
        await userManager.AddToRoleAsync(bob, RoleNames.User);

        var sue = new User
        {
            UserName = "sue"
        };
        await userManager.CreateAsync(sue, defaultPassword);
        await userManager.AddToRoleAsync(sue, RoleNames.User);
    }

    private static async Task AddRoles(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<Role>>();
        if (roleManager.Roles.Any())
        {
            return;
        }

        await roleManager.CreateAsync(new Role
        {
            Name = RoleNames.Admin
        });

        await roleManager.CreateAsync(new Role
        {
            Name = RoleNames.User
        });
    }

    private static async Task AddLocations(DataContext dataContext)
    {
        if (dataContext.Locations.Any())
        {
            return;
        }

        dataContext.Locations.AddRange(
            new Location { Name = "Location 1", Address = "123 Main St", TableCount = 10 },
            new Location { Name = "Location 2", Address = "456 Oak Ave", TableCount = 20 },
            new Location { Name = "Location 3", Address = "789 Pine Ln", TableCount = 15 }
        );

        await dataContext.SaveChangesAsync();
    }

    private static async Task AddMenuItems(DataContext dataContext)
    {
        if (dataContext.MenuItems.Any())
        {
            return;
        }

        var menuItems = new List<MenuItem>
        {
            new MenuItem
            {
                Name = "Iced Latte",
                Description = "Espresso and milk served over ice for a refreshing coffee drink.",
                Category = "Drinks",
                Price = 5.50m,
                Calories = 130,
                SugarGrams = 11,
                CustomizationGroups =
                {
                    new MenuCustomizationGroup
                    {
                        Name = "Milk",
                        IsRequired = true,
                        Options =
                        {
                            new MenuCustomizationOption { Name = "Whole Milk", PriceModifier = 0.00m },
                            new MenuCustomizationOption { Name = "Oat Milk", PriceModifier = 0.75m },
                            new MenuCustomizationOption { Name = "Almond Milk", PriceModifier = 0.75m }
                        }
                    },
                    new MenuCustomizationGroup
                    {
                        Name = "Sweetener",
                        IsRequired = false,
                        Options =
                        {
                            new MenuCustomizationOption { Name = "No Sweetener", PriceModifier = 0.00m },
                            new MenuCustomizationOption { Name = "1 Sugar", PriceModifier = 0.00m },
                            new MenuCustomizationOption { Name = "2 Sugars", PriceModifier = 0.00m },
                            new MenuCustomizationOption { Name = "Vanilla Syrup", PriceModifier = 0.50m },
                            new MenuCustomizationOption { Name = "Caramel Syrup", PriceModifier = 0.50m }
                        }
                    }
                }
            },
            new MenuItem { Name = "Supernova", Description = "A unique coffee blend with a complex, balanced profile and subtle sweetness. Delicious as espresso or paired with milk.", Category = "Drinks", Price = 7.95m },
            new MenuItem { Name = "Roaring Frappe", Description = "Cold brew, milk, and ice blended together with a signature syrup or flavor, topped with whipped cream.", Category = "Drinks", Price = 6.20m },
            new MenuItem { Name = "Black & White Cold Brew", Description = "Cold brew made with both dark and light roast beans, finished with a drizzle of condensed milk.", Category = "Drinks", Price = 5.15m },
            new MenuItem { Name = "Strawberry Limeade", Description = "Fresh lime juice blended with strawberry purée for a refreshing, tangy drink.", Category = "Drinks", Price = 5.00m },
            new MenuItem { Name = "Shaken Lemonade", Description = "Fresh lemon juice and simple syrup vigorously shaken for a bright, refreshing lemonade.", Category = "Drinks", Price = 5.00m },
            new MenuItem { Name = "Mannino Honey Crepe", Description = "A sweet crepe drizzled with Mannino honey and topped with mixed berries.", Category = "Sweet Crepes", Price = 10.00m },
            new MenuItem { Name = "Downtowner", Description = "Strawberries and bananas wrapped in a crepe, finished with Nutella and Hershey's chocolate sauce.", Category = "Sweet Crepes", Price = 10.75m },
            new MenuItem { Name = "Funky Monkey", Description = "Nutella and bananas wrapped in a crepe, served with whipped cream.", Category = "Sweet Crepes", Price = 10.00m },
            new MenuItem { Name = "Le S'mores", Description = "Marshmallow cream and chocolate sauce inside a crepe, topped with graham cracker crumbs.", Category = "Sweet Crepes", Price = 9.50m },
            new MenuItem { Name = "Strawberry Fields", Description = "Fresh strawberries with Hershey's chocolate drizzle and a dusting of powdered sugar.", Category = "Sweet Crepes", Price = 10.00m },
            new MenuItem { Name = "Bonjour", Description = "A sweet crepe filled with syrup and cinnamon, finished with powdered sugar.", Category = "Sweet Crepes", Price = 8.50m },
            new MenuItem { Name = "Banana Foster", Description = "Bananas with cinnamon in a crepe, topped with a generous drizzle of caramel sauce.", Category = "Sweet Crepes", Price = 8.95m },
            new MenuItem { Name = "Matt's Scrambled Eggs", Description = "Scrambled eggs and melted mozzarella cheese wrapped in a crepe.", Category = "Savory Crepes", Price = 5.00m },
            new MenuItem { Name = "Meanie Mushroom", Description = "Sautéed mushrooms, mozzarella, tomato, and bacon inside a delicate crepe.", Category = "Savory Crepes", Price = 10.50m },
            new MenuItem { Name = "Turkey Club", Description = "Sliced turkey, bacon, spinach, and tomato wrapped in a savory crepe.", Category = "Savory Crepes", Price = 10.50m },
            new MenuItem { Name = "Green Machine", Description = "Spinach, artichokes, and mozzarella cheese inside a fresh crepe.", Category = "Savory Crepes", Price = 10.00m },
            new MenuItem { Name = "Perfect Pair", Description = "A unique combination of bacon and Nutella wrapped in a crepe.", Category = "Savory Crepes", Price = 10.00m },
            new MenuItem { Name = "Crepe Fromage", Description = "A savory crepe filled with a blend of cheeses.", Category = "Savory Crepes", Price = 8.00m },
            new MenuItem { Name = "Farmers Market Crepe", Description = "Turkey, spinach, and mozzarella wrapped in a savory crepe.", Category = "Savory Crepes", Price = 10.50m },
            new MenuItem { Name = "Travis Special", Description = "Cream cheese, salmon, spinach, and a fried egg served on a freshly toasted bagel.", Category = "Bagels", Price = 14.00m },
            new MenuItem { Name = "Crème Brulagel", Description = "A toasted bagel with a caramelized sugar crust inspired by crème brûlée, served with cream cheese.", Category = "Bagels", Price = 8.00m },
            new MenuItem { Name = "The Fancy One", Description = "Smoked salmon, cream cheese, and fresh dill on a toasted bagel.", Category = "Bagels", Price = 13.00m },
            new MenuItem { Name = "Breakfast Bagel", Description = "A toasted bagel with your choice of ham, bacon, or sausage, a fried egg, and cheddar cheese.", Category = "Bagels", Price = 9.50m },
            new MenuItem { Name = "The Classic", Description = "A toasted bagel with cream cheese.", Category = "Bagels", Price = 5.25m }
        };

        dataContext.MenuItems.AddRange(menuItems);
        await dataContext.SaveChangesAsync();
    }
    private static async Task UpdateNutritionEstimates(DataContext dataContext)
    {
        var nutritionByName = new Dictionary<string, (int Calories, int SugarGrams)>(StringComparer.OrdinalIgnoreCase)
        {
            // Drinks
            ["Iced Latte"] = (130, 11),
            ["Supernova"] = (15, 1),
            ["Roaring Frappe"] = (420, 48),
            ["Black & White Cold Brew"] = (110, 18),
            ["Strawberry Limeade"] = (160, 36),
            ["Shaken Lemonade"] = (120, 27),

            // Sweet Crepes
            ["Mannino Honey Crepe"] = (420, 26),
            ["Downtowner"] = (590, 39),
            ["Funky Monkey"] = (540, 33),
            ["Le S'mores"] = (510, 36),
            ["Strawberry Fields"] = (430, 28),
            ["Bonjour"] = (340, 18),
            ["Banana Foster"] = (470, 31),

            // Savory Crepes
            ["Matt's Scrambled Eggs"] = (260, 2),
            ["Meanie Mushroom"] = (480, 4),
            ["Turkey Club"] = (520, 5),
            ["Green Machine"] = (410, 4),
            ["Perfect Pair"] = (560, 18),
            ["Crepe Fromage"] = (390, 3),
            ["Farmers Market Crepe"] = (470, 5),

            // Bagels
            ["Travis Special"] = (620, 6),
            ["Crème Brulagel"] = (430, 17),
            ["The Fancy One"] = (510, 6),
            ["Breakfast Bagel"] = (450, 4),
            ["The Classic"] = (320, 6)
        };

        var menuItems = await dataContext.MenuItems.ToListAsync();
        var changed = false;

        foreach (var item in menuItems)
        {
            if (nutritionByName.TryGetValue(item.Name, out var nutrition))
            {
                if (item.Calories != nutrition.Calories || item.SugarGrams != nutrition.SugarGrams)
                {
                    item.Calories = nutrition.Calories;
                    item.SugarGrams = nutrition.SugarGrams;
                    changed = true;
                }
            }
        }

        if (changed)
        {
            await dataContext.SaveChangesAsync();
        }
    }
    private static async Task AddTables(DataContext dataContext)
    {
        if (dataContext.CafeTables.Any())
        {
            return;
        }

        var locations = await dataContext.Locations.OrderBy(x => x.Id).ToListAsync();

        if (locations.Count < 3)
        {
            return;
        }

        var location1 = locations[0];
        var location2 = locations[1];
        var location3 = locations[2];

        dataContext.CafeTables.AddRange(
            new CafeTable { LocationId = location1.Id, Label = "T1", Seats = 2 },
            new CafeTable { LocationId = location1.Id, Label = "T2", Seats = 2 },
            new CafeTable { LocationId = location1.Id, Label = "T3", Seats = 4 },
            new CafeTable { LocationId = location1.Id, Label = "T4", Seats = 4 },
            new CafeTable { LocationId = location1.Id, Label = "T5", Seats = 6 },
            new CafeTable { LocationId = location1.Id, Label = "T6", Seats = 2 },

            new CafeTable { LocationId = location2.Id, Label = "T1", Seats = 2 },
            new CafeTable { LocationId = location2.Id, Label = "T2", Seats = 4 },
            new CafeTable { LocationId = location2.Id, Label = "T3", Seats = 4 },
            new CafeTable { LocationId = location2.Id, Label = "T4", Seats = 6 },

            new CafeTable { LocationId = location3.Id, Label = "T1", Seats = 2 },
            new CafeTable { LocationId = location3.Id, Label = "T2", Seats = 2 },
            new CafeTable { LocationId = location3.Id, Label = "T3", Seats = 4 },
            new CafeTable { LocationId = location3.Id, Label = "T4", Seats = 6 }
        );

        await dataContext.SaveChangesAsync();
    }
}