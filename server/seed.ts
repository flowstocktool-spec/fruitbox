import { storage } from "./storage";

export async function seedData() {
  // Check if data already exists
  const existingStore = await storage.getStore("demo-store-id");
  if (existingStore) {
    console.log("✅ Seed data already exists, skipping...");
    return;
  }

  // Create a demo store with fixed ID
  const store = await storage.createStoreWithId({
    id: "demo-store-id",
    name: "Demo Retail Store",
    email: "demo@store.com",
    password: "demo123",
  });

  // Create demo campaigns
  const campaign1 = await storage.createCampaign({
    storeId: store.id,
    name: "Summer Rewards Campaign",
    description: "Earn points on every purchase and get your friends 10% off!",
    pointsPerDollar: 5,
    minPurchaseAmount: 25,
    discountPercentage: 10,
    couponColor: "#2563eb",
    couponTextColor: "#ffffff",
    isActive: true,
  });

  const campaign2 = await storage.createCampaign({
    storeId: store.id,
    name: "VIP Loyalty Program",
    description: "Exclusive rewards for our best customers",
    pointsPerDollar: 10,
    minPurchaseAmount: 50,
    discountPercentage: 15,
    couponColor: "#7c3aed",
    couponTextColor: "#ffffff",
    isActive: true,
  });

  // Create demo customers
  const customer1 = await storage.createCustomer({
    campaignId: campaign1.id,
    name: "Sarah Johnson",
    phone: "+1234567890",
    email: "sarah@example.com",
    username: "sarah",
    password: "password123",
    referralCode: "SARAH2024",
    totalPoints: 2750,
    redeemedPoints: 1500,
  });

  const customer2 = await storage.createCustomer({
    campaignId: campaign1.id,
    name: "Mike Chen",
    phone: "+1234567891",
    email: "mike@example.com",
    username: "mike",
    password: "password123",
    referralCode: "MIKE2024",
    totalPoints: 1200,
    redeemedPoints: 0,
  });

  // Create demo shop profiles
  const shop1 = await storage.createShopProfile({
    shopName: "Coffee Haven",
    shopCode: "COFFEE123",
    description: "Premium coffee shop with artisan roasts",
    category: "Food & Beverage",
    address: "123 Main St, Downtown",
    phone: "+1234567892",
    pointsPerDollar: 3,
    discountPercentage: 15,
    isActive: true,
  });

  const shop2 = await storage.createShopProfile({
    shopName: "Fitness Pro Gym",
    shopCode: "FITNESS456",
    description: "Modern gym with personal training",
    category: "Health & Fitness",
    address: "456 Oak Ave, City Center",
    phone: "+1234567893",
    pointsPerDollar: 2,
    discountPercentage: 10,
    isActive: true,
  });

  // Create customer coupons (Sarah is registered at both shops)
  const customerCoupon1 = await storage.createCustomerCoupon({
    customerId: customer1.id,
    shopProfileId: shop1.id,
    referralCode: "SARAH-COFFEE-2024",
    totalPoints: 150,
    redeemedPoints: 0,
  });

  const customerCoupon2 = await storage.createCustomerCoupon({
    customerId: customer1.id,
    shopProfileId: shop2.id,
    referralCode: "SARAH-FITNESS-2024",
    totalPoints: 80,
    redeemedPoints: 0,
  });

  // Create demo transactions
  await storage.createTransaction({
    customerId: customer1.id,
    campaignId: campaign1.id,
    type: "purchase",
    amount: 150,
    points: 750,
    status: "approved",
    billImageUrl: null,
  });

  await storage.createTransaction({
    customerId: customer1.id,
    campaignId: campaign1.id,
    type: "purchase",
    amount: 125,
    points: 625,
    status: "pending",
    billImageUrl: "https://images.unsplash.com/photo-1554224311-beee4f7a1788?w=400&h=300&fit=crop",
  });

  await storage.createTransaction({
    customerId: customer2.id,
    campaignId: campaign1.id,
    type: "purchase",
    amount: 89,
    points: 445,
    status: "pending",
    billImageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
  });

  console.log("✅ Seed data created successfully");
  console.log(`Store ID: ${store.id}`);
  console.log(`Campaign 1 ID: ${campaign1.id}`);
  console.log(`Customer 1 ID: ${customer1.id}, Code: ${customer1.referralCode}`);
  console.log(`Shop 1 ID: ${shop1.id}, Shop 2 ID: ${shop2.id}`);
  console.log(`Demo Login: username=sarah, password=password123`);
}
