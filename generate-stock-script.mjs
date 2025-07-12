import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateStockInsertScript() {
    let sqlScript = '-- SQL script to insert initial stock data\n\n';

    // Fetch ingredient IDs
    const { data: ingredients, error: ingredientError } = await supabase
        .from('ingredients')
        .select('id');

    if (ingredientError) {
        console.error('Error fetching ingredients:', ingredientError);
        return;
    }

    // Generate INSERT statements for ingredient_stock
    if (ingredients) {
        sqlScript += '-- Insert initial ingredient stock (10 units each)\n';
        ingredients.forEach(ingredient => {
            sqlScript += `INSERT INTO ingredient_stock (ingredient_id, quantity, unit_of_measure) VALUES ('${ingredient.id}', 10, 'units');\n`;
        });
        sqlScript += '\n';
    }

    // Fetch product IDs
    const { data: products, error: productError } = await supabase
        .from('products')
        .select('id');

    if (productError) {
        console.error('Error fetching products:', productError);
        return;
    }

    // Generate INSERT statements for product_stock
    if (products) {
        sqlScript += '-- Insert initial product stock (10 units each)\n';
        products.forEach(product => {
            sqlScript += `INSERT INTO product_stock (product_id, quantity) VALUES ('${product.id}', 10);\n`;
        });
        sqlScript += '\n';
    }

    console.log(sqlScript);
}

generateStockInsertScript();