import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use the test secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

const PRODUCTS = [
  {
    name: 'Essential',
    description: 'Up to 40 thumbnails/month - 400 credits',
    monthlyPrice: 2000, // $20.00 in cents
    annualPrice: 16800, // $168.00 in cents (30% off)
  },
  {
    name: 'Premium',
    description: 'Up to 150 thumbnails/month - 1,500 credits',
    monthlyPrice: 4000, // $40.00 in cents
    annualPrice: 33600, // $336.00 in cents (30% off)
  },
  {
    name: 'Ultimate',
    description: 'Up to 450 thumbnails/month - 4,500 credits',
    monthlyPrice: 8000, // $80.00 in cents
    annualPrice: 67200, // $672.00 in cents (30% off)
  },
];

async function main() {
  console.log('Creating Stripe test products and prices...\n');

  const priceIds: Record<string, { monthly: string; annual: string }> = {};

  for (const productData of PRODUCTS) {
    // Create product
    const product = await stripe.products.create({
      name: `ThumbZap ${productData.name}`,
      description: productData.description,
    });

    console.log(`Created product: ${product.name} (${product.id})`);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: productData.monthlyPrice,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      nickname: `${productData.name} Monthly`,
    });

    console.log(`  Monthly price: ${monthlyPrice.id}`);

    // Create annual price
    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: productData.annualPrice,
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
      nickname: `${productData.name} Annual`,
    });

    console.log(`  Annual price: ${annualPrice.id}`);

    priceIds[productData.name.toLowerCase()] = {
      monthly: monthlyPrice.id,
      annual: annualPrice.id,
    };
  }

  console.log('\n=== Add these to your .env.local ===\n');
  console.log(`STRIPE_PRICE_ESSENTIAL_MONTHLY=${priceIds.essential.monthly}`);
  console.log(`STRIPE_PRICE_ESSENTIAL_ANNUAL=${priceIds.essential.annual}`);
  console.log(`STRIPE_PRICE_PREMIUM_MONTHLY=${priceIds.premium.monthly}`);
  console.log(`STRIPE_PRICE_PREMIUM_ANNUAL=${priceIds.premium.annual}`);
  console.log(`STRIPE_PRICE_ULTIMATE_MONTHLY=${priceIds.ultimate.monthly}`);
  console.log(`STRIPE_PRICE_ULTIMATE_ANNUAL=${priceIds.ultimate.annual}`);
}

main().catch(console.error);
