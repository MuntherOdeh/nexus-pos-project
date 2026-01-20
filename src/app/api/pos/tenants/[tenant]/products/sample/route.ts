import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePosAuth } from "@/lib/pos/require-pos-auth";

export const dynamic = "force-dynamic";

// Sample product data by industry
const SAMPLE_PRODUCTS = {
  RESTAURANT: {
    categories: [
      { name: "Food", color: "#ec4899", sortOrder: 1 },
      { name: "Drinks", color: "#22c55e", sortOrder: 2 },
    ],
    products: [
      // Food
      { name: "Bacon Burger", price: 4500, category: "Food", color: "#ec4899" },
      { name: "Cheese Burger", price: 4000, category: "Food", color: "#ec4899" },
      { name: "Pizza Margherita", price: 5500, category: "Food", color: "#f97316" },
      { name: "Pizza Vegetarian", price: 5000, category: "Food", color: "#f97316" },
      { name: "Pasta 4 Formaggi", price: 4800, category: "Food", color: "#eab308" },
      { name: "Funghi", price: 4200, category: "Food", color: "#eab308" },
      { name: "Pasta Bolognese", price: 4500, category: "Food", color: "#f97316" },
      { name: "Chicken Curry Sandwich", price: 3800, category: "Food", color: "#22c55e" },
      { name: "Spicy Tuna Sandwich", price: 4200, category: "Food", color: "#3b82f6" },
      { name: "Mozzarella Sandwich", price: 3500, category: "Food", color: "#ec4899" },
      { name: "Club Sandwich", price: 4000, category: "Food", color: "#8b5cf6" },
      { name: "Lunch Maki 18pc", price: 6500, category: "Food", color: "#ef4444" },
      { name: "Lunch Salmon 20pc", price: 7000, category: "Food", color: "#f97316" },
      { name: "Lunch Temaki mix 3pc", price: 5500, category: "Food", color: "#ef4444" },
      { name: "Salmon and Avocado", price: 4800, category: "Food", color: "#f97316" },
      // Drinks
      { name: "Coca-Cola", price: 1200, category: "Drinks", color: "#ef4444" },
      { name: "Water", price: 800, category: "Drinks", color: "#3b82f6" },
      { name: "Minute Maid", price: 1500, category: "Drinks", color: "#f97316" },
      { name: "Espresso", price: 1000, category: "Drinks", color: "#78350f" },
      { name: "Green Tea", price: 1200, category: "Drinks", color: "#22c55e" },
      { name: "Milkshake Banana", price: 2000, category: "Drinks", color: "#eab308" },
      { name: "Ice Tea", price: 1400, category: "Drinks", color: "#84cc16" },
      { name: "Schweppes", price: 1200, category: "Drinks", color: "#22c55e" },
      { name: "Fanta", price: 1200, category: "Drinks", color: "#f97316" },
      // Combos
      { name: "Burger Menu Combo", price: 6500, category: "Food", color: "#8b5cf6" },
      { name: "Sushi Lunch Combo", price: 8500, category: "Food", color: "#ef4444" },
    ],
  },
  CAFE: {
    categories: [
      { name: "Coffee", color: "#78350f", sortOrder: 1 },
      { name: "Tea", color: "#22c55e", sortOrder: 2 },
      { name: "Pastries", color: "#f97316", sortOrder: 3 },
      { name: "Cold Drinks", color: "#3b82f6", sortOrder: 4 },
    ],
    products: [
      // Coffee
      { name: "Espresso", price: 1200, category: "Coffee", color: "#78350f" },
      { name: "Double Espresso", price: 1600, category: "Coffee", color: "#78350f" },
      { name: "Americano", price: 1400, category: "Coffee", color: "#78350f" },
      { name: "Cappuccino", price: 1800, category: "Coffee", color: "#78350f" },
      { name: "Latte", price: 2000, category: "Coffee", color: "#d97706" },
      { name: "Mocha", price: 2200, category: "Coffee", color: "#78350f" },
      { name: "Flat White", price: 1900, category: "Coffee", color: "#d97706" },
      { name: "Macchiato", price: 1500, category: "Coffee", color: "#78350f" },
      // Tea
      { name: "Green Tea", price: 1200, category: "Tea", color: "#22c55e" },
      { name: "Earl Grey", price: 1200, category: "Tea", color: "#6b7280" },
      { name: "Chamomile", price: 1200, category: "Tea", color: "#eab308" },
      { name: "Mint Tea", price: 1200, category: "Tea", color: "#22c55e" },
      { name: "Chai Latte", price: 1800, category: "Tea", color: "#f97316" },
      // Pastries
      { name: "Croissant", price: 1500, category: "Pastries", color: "#f97316" },
      { name: "Chocolate Croissant", price: 1800, category: "Pastries", color: "#78350f" },
      { name: "Blueberry Muffin", price: 1600, category: "Pastries", color: "#8b5cf6" },
      { name: "Chocolate Muffin", price: 1600, category: "Pastries", color: "#78350f" },
      { name: "Cinnamon Roll", price: 1800, category: "Pastries", color: "#d97706" },
      { name: "Cheesecake Slice", price: 2500, category: "Pastries", color: "#eab308" },
      // Cold Drinks
      { name: "Iced Americano", price: 1600, category: "Cold Drinks", color: "#78350f" },
      { name: "Iced Latte", price: 2200, category: "Cold Drinks", color: "#d97706" },
      { name: "Iced Mocha", price: 2400, category: "Cold Drinks", color: "#78350f" },
      { name: "Lemonade", price: 1400, category: "Cold Drinks", color: "#eab308" },
      { name: "Orange Juice", price: 1600, category: "Cold Drinks", color: "#f97316" },
    ],
  },
  BAKERY: {
    categories: [
      { name: "Breads", color: "#d97706", sortOrder: 1 },
      { name: "Pastries", color: "#f97316", sortOrder: 2 },
      { name: "Cakes", color: "#ec4899", sortOrder: 3 },
      { name: "Drinks", color: "#3b82f6", sortOrder: 4 },
    ],
    products: [
      // Breads
      { name: "Baguette", price: 800, category: "Breads", color: "#d97706" },
      { name: "Sourdough Loaf", price: 1500, category: "Breads", color: "#d97706" },
      { name: "Whole Wheat Bread", price: 1200, category: "Breads", color: "#78350f" },
      { name: "Ciabatta", price: 1000, category: "Breads", color: "#d97706" },
      { name: "Focaccia", price: 1400, category: "Breads", color: "#22c55e" },
      // Pastries
      { name: "Croissant", price: 1200, category: "Pastries", color: "#f97316" },
      { name: "Pain au Chocolat", price: 1500, category: "Pastries", color: "#78350f" },
      { name: "Danish Pastry", price: 1400, category: "Pastries", color: "#f97316" },
      { name: "Éclair", price: 1600, category: "Pastries", color: "#78350f" },
      { name: "Apple Turnover", price: 1400, category: "Pastries", color: "#22c55e" },
      { name: "Cinnamon Roll", price: 1300, category: "Pastries", color: "#d97706" },
      // Cakes
      { name: "Chocolate Cake Slice", price: 2200, category: "Cakes", color: "#78350f" },
      { name: "Carrot Cake Slice", price: 2000, category: "Cakes", color: "#f97316" },
      { name: "Red Velvet Slice", price: 2400, category: "Cakes", color: "#ef4444" },
      { name: "Cheesecake Slice", price: 2500, category: "Cakes", color: "#eab308" },
      { name: "Tiramisu", price: 2800, category: "Cakes", color: "#78350f" },
      { name: "Birthday Cake (Whole)", price: 15000, category: "Cakes", color: "#ec4899" },
      // Drinks
      { name: "Coffee", price: 1000, category: "Drinks", color: "#78350f" },
      { name: "Tea", price: 800, category: "Drinks", color: "#22c55e" },
      { name: "Hot Chocolate", price: 1400, category: "Drinks", color: "#78350f" },
      { name: "Juice", price: 1200, category: "Drinks", color: "#f97316" },
    ],
  },
  RETAIL: {
    categories: [
      { name: "Electronics", color: "#3b82f6", sortOrder: 1 },
      { name: "Accessories", color: "#8b5cf6", sortOrder: 2 },
      { name: "Home", color: "#22c55e", sortOrder: 3 },
      { name: "Personal Care", color: "#ec4899", sortOrder: 4 },
    ],
    products: [
      // Electronics
      { name: "Phone Charger", price: 2500, category: "Electronics", color: "#3b82f6" },
      { name: "USB Cable", price: 1500, category: "Electronics", color: "#3b82f6" },
      { name: "Earphones", price: 3500, category: "Electronics", color: "#6b7280" },
      { name: "Power Bank", price: 8000, category: "Electronics", color: "#3b82f6" },
      { name: "Phone Case", price: 2000, category: "Electronics", color: "#8b5cf6" },
      // Accessories
      { name: "Sunglasses", price: 5000, category: "Accessories", color: "#6b7280" },
      { name: "Watch", price: 15000, category: "Accessories", color: "#eab308" },
      { name: "Wallet", price: 6000, category: "Accessories", color: "#78350f" },
      { name: "Belt", price: 4500, category: "Accessories", color: "#78350f" },
      { name: "Scarf", price: 3500, category: "Accessories", color: "#ec4899" },
      // Home
      { name: "Candle", price: 2500, category: "Home", color: "#f97316" },
      { name: "Picture Frame", price: 3000, category: "Home", color: "#78350f" },
      { name: "Plant Pot", price: 2000, category: "Home", color: "#22c55e" },
      { name: "Cushion", price: 4000, category: "Home", color: "#8b5cf6" },
      { name: "Throw Blanket", price: 6500, category: "Home", color: "#6b7280" },
      // Personal Care
      { name: "Hand Cream", price: 1800, category: "Personal Care", color: "#ec4899" },
      { name: "Lip Balm", price: 800, category: "Personal Care", color: "#f97316" },
      { name: "Face Mask", price: 2500, category: "Personal Care", color: "#22c55e" },
      { name: "Perfume Sample", price: 4000, category: "Personal Care", color: "#8b5cf6" },
    ],
  },
};

export async function POST(request: NextRequest, context: { params: { tenant: string } }) {
  const auth = await requirePosAuth(request, context.params.tenant);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  // Only allow managers to load sample products
  if (!["OWNER", "ADMIN", "MANAGER"].includes(auth.ctx.user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  // Get tenant industry
  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.ctx.tenantId },
    select: { id: true, industry: true, currency: true },
  });

  if (!tenant) {
    return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
  }

  const industry = tenant.industry as keyof typeof SAMPLE_PRODUCTS;
  const sampleData = SAMPLE_PRODUCTS[industry] || SAMPLE_PRODUCTS.RESTAURANT;

  try {
    // Create categories and products in a transaction
    await prisma.$transaction(async (tx) => {
      // Create categories
      const categoryMap: Record<string, string> = {};

      for (const cat of sampleData.categories) {
        const existingCat = await tx.productCategory.findFirst({
          where: { tenantId: tenant.id, name: cat.name },
        });

        if (existingCat) {
          categoryMap[cat.name] = existingCat.id;
        } else {
          const newCat = await tx.productCategory.create({
            data: {
              tenantId: tenant.id,
              name: cat.name,
              sortOrder: cat.sortOrder,
            },
          });
          categoryMap[cat.name] = newCat.id;
        }
      }

      // Create products
      for (const prod of sampleData.products) {
        const existingProd = await tx.product.findFirst({
          where: { tenantId: tenant.id, name: prod.name },
        });

        if (!existingProd) {
          await tx.product.create({
            data: {
              tenantId: tenant.id,
              categoryId: categoryMap[prod.category],
              name: prod.name,
              priceCents: prod.price,
              currency: tenant.currency,
              isActive: true,
            },
          });
        }
      }
    });

    // Get all products after loading
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });

    const categories = await prisma.productCategory.findMany({
      where: { tenantId: tenant.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      message: `Loaded ${sampleData.products.length} sample products`,
      productsCount: products.length,
      categoriesCount: categories.length,
    });
  } catch (error) {
    console.error("Failed to load sample products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load sample products" },
      { status: 500 }
    );
  }
}
