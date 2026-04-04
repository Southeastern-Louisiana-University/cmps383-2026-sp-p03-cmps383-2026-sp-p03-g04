export interface CustomizationOption {
    name: string;
    priceModifier: number;
}

export interface CustomizationGroup {
    name: string;
    isRequired: boolean;
    options: CustomizationOption[];
}

export interface MenuItem {
    id: string;
    category: 'Drinks' | 'Sweet Crepes' | 'Savory Crepes' | 'Bagels';
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    customizations?: CustomizationGroup[];
}

// Reusable customizations for the coffee/milk drinks
const drinkCustomizations: CustomizationGroup[] = [
    {
        name: 'Milk Choice',
        isRequired: true,
        options: [
            { name: 'Whole Milk', priceModifier: 0 },
            { name: 'Oat Milk', priceModifier: 0.75 },
            { name: 'Almond Milk', priceModifier: 0.75 }
        ]
    },
    {
        name: 'Sweetness',
        isRequired: false,
        options: [
            { name: 'No Sugar', priceModifier: 0 },
            { name: '1 Sugar', priceModifier: 0 },
            { name: '2 Sugars', priceModifier: 0 }
        ]
    }
];

export const menuData: MenuItem[] = [
    // --- DRINKS ---
    {
        id: 'd1',
        category: 'Drinks',
        name: 'Iced Latte',
        description: 'Espresso and milk served over ice for a refreshing coffee drink.',
        price: 5.50,
        customizations: drinkCustomizations
    },
    {
        id: 'd2',
        category: 'Drinks',
        name: 'Supernova',
        description: 'A unique coffee blend with a complex, balanced profile and subtle sweetness. Delicious as espresso or paired with milk.',
        price: 7.95,
        customizations: drinkCustomizations
    },
    {
        id: 'd3',
        category: 'Drinks',
        name: 'Roaring Frappe',
        description: 'Cold brew, milk, and ice blended together with a signature syrup or flavor, topped with whipped cream.',
        price: 6.20,
        customizations: drinkCustomizations
    },
    {
        id: 'd4',
        category: 'Drinks',
        name: 'Black & White Cold Brew',
        description: 'Cold brew made with both dark and light roast beans, finished with a drizzle of condensed milk.',
        price: 5.15,
        customizations: drinkCustomizations
    },
    {
        id: 'd5',
        category: 'Drinks',
        name: 'Strawberry Limeade',
        description: 'Fresh lime juice blended with strawberry purée for a refreshing, tangy drink.',
        price: 5.00
    },
    {
        id: 'd6',
        category: 'Drinks',
        name: 'Shaken Lemonade',
        description: 'Fresh lemon juice and simple syrup vigorously shaken for a bright, refreshing lemonade.',
        price: 5.00
    },

    // --- SWEET CREPES ---
    {
        id: 'sw1',
        category: 'Sweet Crepes',
        name: 'Mannino Honey Crepe',
        description: 'A sweet crepe drizzled with Mannino honey and topped with mixed berries.',
        price: 10.00
    },
    {
        id: 'sw2',
        category: 'Sweet Crepes',
        name: 'Downtowner',
        description: 'Strawberries and bananas wrapped in a crepe, finished with Nutella and Hershey\'s chocolate sauce.',
        price: 10.75
    },
    {
        id: 'sw3',
        category: 'Sweet Crepes',
        name: 'Funky Monkey',
        description: 'Nutella and bananas wrapped in a crepe, served with whipped cream.',
        price: 10.00
    },
    {
        id: 'sw4',
        category: 'Sweet Crepes',
        name: 'Le S\'mores',
        description: 'Marshmallow cream and chocolate sauce inside a crepe, topped with graham cracker crumbs.',
        price: 9.50
    },
    {
        id: 'sw5',
        category: 'Sweet Crepes',
        name: 'Strawberry Fields',
        description: 'Fresh strawberries with Hershey\'s chocolate drizzle and a dusting of powdered sugar.',
        price: 10.00
    },
    {
        id: 'sw6',
        category: 'Sweet Crepes',
        name: 'Bonjour',
        description: 'A sweet crepe filled with syrup and cinnamon, finished with powdered sugar.',
        price: 8.50
    },
    {
        id: 'sw7',
        category: 'Sweet Crepes',
        name: 'Banana Foster',
        description: 'Bananas with cinnamon in a crepe, topped with a generous drizzle of caramel sauce.',
        price: 8.95
    },

    // --- SAVORY CREPES ---
    {
        id: 'sc1',
        category: 'Savory Crepes',
        name: 'Matt\'s Scrambled Eggs',
        description: 'Scrambled eggs and melted mozzarella cheese wrapped in a crepe.',
        price: 5.00
    },
    {
        id: 'sc2',
        category: 'Savory Crepes',
        name: 'Meanie Mushroom',
        description: 'Sautéed mushrooms, mozzarella, tomato, and bacon inside a delicate crepe.',
        price: 10.50
    },
    {
        id: 'sc3',
        category: 'Savory Crepes',
        name: 'Turkey Club',
        description: 'Sliced turkey, bacon, spinach, and tomato wrapped in a savory crepe.',
        price: 10.50
    },
    {
        id: 'sc4',
        category: 'Savory Crepes',
        name: 'Green Machine',
        description: 'Spinach, artichokes, and mozzarella cheese inside a fresh crepe.',
        price: 10.00
    },
    {
        id: 'sc5',
        category: 'Savory Crepes',
        name: 'Perfect Pair',
        description: 'A unique combination of bacon and Nutella wrapped in a crepe.',
        price: 10.00
    },
    {
        id: 'sc6',
        category: 'Savory Crepes',
        name: 'Crepe Fromage',
        description: 'A savory crepe filled with a blend of cheeses.',
        price: 8.00
    },
    {
        id: 'sc7',
        category: 'Savory Crepes',
        name: 'Farmers Market Crepe',
        description: 'Turkey, spinach, and mozzarella wrapped in a savory crepe.',
        price: 10.50
    },

    // --- BAGELS ---
    {
        id: 'b1',
        category: 'Bagels',
        name: 'Travis Special',
        description: 'Cream cheese, salmon, spinach, and a fried egg served on a freshly toasted bagel.',
        price: 14.00
    },
    {
        id: 'b2',
        category: 'Bagels',
        name: 'Crème Brulagel',
        description: 'A toasted bagel with a caramelized sugar crust inspired by crème brûlée, served with cream cheese.',
        price: 8.00
    },
    {
        id: 'b3',
        category: 'Bagels',
        name: 'The Fancy One',
        description: 'Smoked salmon, cream cheese, and fresh dill on a toasted bagel.',
        price: 13.00
    },
    {
        id: 'b4',
        category: 'Bagels',
        name: 'Breakfast Bagel',
        description: 'A toasted bagel with your choice of ham, bacon, or sausage, a fried egg, and cheddar cheese.',
        price: 9.50,
        customizations: [
            {
                name: 'Meat Choice',
                isRequired: true,
                options: [
                    { name: 'Ham', priceModifier: 0 },
                    { name: 'Bacon', priceModifier: 0 },
                    { name: 'Sausage', priceModifier: 0 }
                ]
            }
        ]
    },
    {
        id: 'b5',
        category: 'Bagels',
        name: 'The Classic',
        description: 'A toasted bagel with cream cheese.',
        price: 5.25
    }
];