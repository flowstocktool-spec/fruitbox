import { db } from "./db";
import { stores, shopProfiles, campaigns, customers, customerCoupons, transactions } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedData() {
  try {
    // Check if data already exists
    const existingShops = await db.select().from(shopProfiles).limit(1);
    if (existingShops.length > 0) {
      console.log("✅ Seed data already exists, skipping...");
      return;
    }

    // Hash passwords for seed data
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create demo shop profiles
    const [shop1] = await db.insert(shopProfiles).values({
      shopName: "Coffee Haven",
      shopCode: "COFFEE123",
      username: "coffeehaven",
      password: hashedPassword,
      description: "Premium coffee shop with artisan roasts",
    }).returning();

    const [shop2] = await db.insert(shopProfiles).values({
      shopName: "Fitness Pro Gym",
      shopCode: "FITNESS456",
      username: "fitnesspro",
      password: hashedPassword,
      description: "Modern gym with personal training",
    }).returning();

    // Create demo customers
    const [customer1] = await db.insert(customers).values({
      name: "Sarah Johnson",
      phone: "+1234567890",
      email: "sarah@example.com",
      username: "sarah",
      password: hashedPassword,
      referralCode: "SARAH2024",
      totalPoints: 2750,
      redeemedPoints: 1500,
    }).returning();

    const [customer2] = await db.insert(customers).values({
      name: "Mike Chen",
      phone: "+1234567891",
      email: "mike@example.com",
      username: "mike",
      password: hashedPassword,
      referralCode: "MIKE2024",
      totalPoints: 1200,
      redeemedPoints: 0,
    }).returning();

    // Create customer coupons (Sarah is registered at both shops)
    const [customerCoupon1] = await db.insert(customerCoupons).values({
      customerId: customer1.id,
      shopProfileId: shop1.id,
      referralCode: "SARAH-COFFEE-2024",
      totalPoints: 150,
      redeemedPoints: 0,
    }).returning();

    const [customerCoupon2] = await db.insert(customerCoupons).values({
      customerId: customer1.id,
      shopProfileId: shop2.id,
      referralCode: "SARAH-FITNESS-2024",
      totalPoints: 80,
      redeemedPoints: 0,
    }).returning();

    // Create demo transactions
    await db.insert(transactions).values({
      customerId: customer1.id,
      couponId: customerCoupon1.id,
      type: "purchase",
      amount: 150,
      points: 750,
      status: "approved",
      shopName: shop1.shopName,
      referralCode: customerCoupon1.referralCode,
    });

    await db.insert(transactions).values({
      customerId: customer1.id,
      couponId: customerCoupon1.id,
      type: "purchase",
      amount: 125,
      points: 625,
      status: "pending",
      billImageUrl: "https://images.unsplash.com/photo-1554224311-beee4f7a1788?w=400&h=300&fit=crop",
      shopName: shop1.shopName,
      referralCode: customerCoupon1.referralCode,
    });

    await db.insert(transactions).values({
      customerId: customer2.id,
      type: "purchase",
      amount: 89,
      points: 445,
      status: "pending",
      billImageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
    });

    console.log("✅ Seed data created successfully");
    console.log(`Shop 1 ID: ${shop1.id}, Shop 2 ID: ${shop2.id}`);
    console.log(`Customer 1 ID: ${customer1.id}, Code: ${customer1.referralCode}`);
    console.log("Customer Login: username=sarah, password=password123");
    console.log("Shop Owner Login: username=coffeehaven, password=password123");
  } catch (error: any) {
    console.error("❌ Error seeding data:", error.message);
    // Don't throw - allow app to start even if seeding fails
  }
}
