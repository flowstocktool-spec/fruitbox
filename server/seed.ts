import { db } from "./db";
import { stores, campaigns, customers, shopProfiles, customerCoupons, transactions } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedData() {
  // Check if data already exists
  const existingShops = await db.select().from(shopProfiles).limit(1);
  if (existingShops.length > 0) {
    console.log("✅ Seed data already exists, skipping...");
    return;
  }

  // Create demo shop profiles
  const [shop1] = await db.insert(shopProfiles).values({
    shopName: "Coffee Haven",
    shopCode: "COFFEE123",
    username: "coffeehaven",
    password: "password123",
    description: "Premium coffee shop with artisan roasts",
    currencySymbol: "$",
  }).returning();

  const [shop2] = await db.insert(shopProfiles).values({
    shopName: "Fitness Pro Gym",
    shopCode: "FITNESS456",
    username: "fitnesspro",
    password: "password123",
    description: "Modern gym with personal training",
    currencySymbol: "$",
  }).returning();

  // Create a demo store
  const [store] = await db.insert(stores).values({
    name: "Demo Retail Store",
    email: "demo@store.com",
    password: "demo123",
  }).returning();

  // Create demo campaigns
  const [campaign1] = await db.insert(campaigns).values({
    storeId: store.id,
    name: "Summer Rewards Campaign",
    description: "Earn points on every purchase and get your friends 10% off!",
    pointsPerDollar: 5,
    minPurchaseAmount: 25,
    discountPercentage: 10,
    couponColor: "#2563eb",
    couponTextColor: "#ffffff",
    isActive: true,
  }).returning();

  const [campaign2] = await db.insert(campaigns).values({
    storeId: store.id,
    name: "VIP Loyalty Program",
    description: "Exclusive rewards for our best customers",
    pointsPerDollar: 10,
    minPurchaseAmount: 50,
    discountPercentage: 15,
    couponColor: "#7c3aed",
    couponTextColor: "#ffffff",
    isActive: true,
  }).returning();

  // Create demo customers
  const [customer1] = await db.insert(customers).values({
    campaignId: campaign1.id,
    name: "Sarah Johnson",
    phone: "+1234567890",
    email: "sarah@example.com",
    username: "sarah",
    password: "password123",
    referralCode: "SARAH2024",
    totalPoints: 2750,
    redeemedPoints: 1500,
  }).returning();

  const [customer2] = await db.insert(customers).values({
    campaignId: campaign1.id,
    name: "Mike Chen",
    phone: "+1234567891",
    email: "mike@example.com",
    username: "mike",
    password: "password123",
    referralCode: "MIKE2024",
    totalPoints: 1200,
    redeemedPoints: 0,
  }).returning();

  // Create customer coupons (Sarah and Mike are registered at both shops)
  await db.insert(customerCoupons).values({
    customerId: customer1.id,
    shopProfileId: shop1.id,
    referralCode: "SARAH-COFFEE-2024",
    totalPoints: 150,
    redeemedPoints: 0,
  });

  await db.insert(customerCoupons).values({
    customerId: customer1.id,
    shopProfileId: shop2.id,
    referralCode: "SARAH-FITNESS-2024",
    totalPoints: 80,
    redeemedPoints: 0,
  });

  await db.insert(customerCoupons).values({
    customerId: customer2.id,
    shopProfileId: shop1.id,
    referralCode: "MIKE-COFFEE-2024",
    totalPoints: 200,
    redeemedPoints: 50,
  });

  // Create demo transactions
  await db.insert(transactions).values({
    customerId: customer1.id,
    campaignId: campaign1.id,
    type: "purchase",
    amount: 150,
    points: 750,
    status: "approved",
  });

  await db.insert(transactions).values({
    customerId: customer1.id,
    campaignId: campaign1.id,
    type: "purchase",
    amount: 125,
    points: 625,
    status: "pending",
    billImageUrl: "https://images.unsplash.com/photo-1554224311-beee4f7a1788?w=400&h=300&fit=crop",
  });

  await db.insert(transactions).values({
    customerId: customer2.id,
    campaignId: campaign1.id,
    type: "purchase",
    amount: 89,
    points: 445,
    status: "pending",
    billImageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
  });

  console.log("✅ Seed data created successfully");
  console.log("Store ID:", store.id);
  console.log("Campaign 1 ID:", campaign1.id);
  console.log(`Customer 1 ID: ${customer1.id}, Code: ${customer1.referralCode}`);
  console.log(`Customer 2 ID: ${customer2.id}, Code: ${customer2.referralCode}`);
  console.log(`Shop 1 ID: ${shop1.id}, Shop 2 ID: ${shop2.id}`);
  console.log("Customer Login: username=sarah, password=password123");
  console.log("Shop Owner Login: username=coffeehaven, password=password123");
}