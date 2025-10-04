
import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { db } from "./db";
import { stores, shopProfiles, campaigns, customers, transactions, customerCoupons, sharedCoupons } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { insertCampaignSchema, insertCustomerSchema, insertCustomerCouponSchema, insertSharedCouponSchema, insertTransactionSchema, insertShopProfileSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const upload = multer({ storage: multer.memoryStorage() });
const PgSession = connectPgSimple(session);

declare module 'express-session' {
  interface SessionData {
    customerId?: string;
    shopProfileId?: string;
    storeId?: string;
  }
}

export function registerRoutes(app: Express): Server {
  // Session middleware - persistent across restarts
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
        pruneSessionInterval: 60, // Prune expired sessions every 60 seconds
      }),
      secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production-' + Math.random().toString(36),
      resave: false,
      saveUninitialized: false,
      rolling: true, // Extend session on each request
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    })
  );

  // ========== CUSTOMER AUTHENTICATION ==========
  
  // Customer Login
  app.post("/api/customers/login", async (req, res) => {
    try {
      const { username, password, deviceId, deviceFingerprint } = req.body;
      
      const [customer] = await db.select()
        .from(customers)
        .where(eq(customers.username, username))
        .limit(1);

      if (!customer || customer.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Update device info if provided
      if (deviceId && deviceFingerprint) {
        await db.update(customers)
          .set({ 
            deviceId, 
            deviceFingerprint,
            lastDeviceVerifiedAt: new Date()
          })
          .where(eq(customers.id, customer.id));
      }

      req.session.customerId = customer.id;
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
      });
      
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customer Logout
  app.post("/api/customers/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get Current Customer
  app.get("/api/customers/me", async (req, res) => {
    try {
      if (!req.session.customerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [customer] = await db.select()
        .from(customers)
        .where(eq(customers.id, req.session.customerId))
        .limit(1);

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== SHOP OWNER AUTHENTICATION ==========
  
  // Shop Owner Registration
  app.post("/api/shops/register", async (req, res) => {
    try {
      const validatedData = insertShopProfileSchema.parse(req.body);
      
      // Check if username already exists
      const [existingByUsername] = await db.select()
        .from(shopProfiles)
        .where(eq(shopProfiles.username, validatedData.username))
        .limit(1);
      
      if (existingByUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Check if shop code already exists
      const [existingByCode] = await db.select()
        .from(shopProfiles)
        .where(eq(shopProfiles.shopCode, validatedData.shopCode))
        .limit(1);
      
      if (existingByCode) {
        return res.status(400).json({ error: "Shop code already exists" });
      }
      
      const [newShop] = await db.insert(shopProfiles).values(validatedData).returning();
      req.session.shopProfileId = newShop.id;
      res.status(201).json(newShop);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Shop Owner Login
  app.post("/api/shops/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const [shop] = await db.select()
        .from(shopProfiles)
        .where(eq(shopProfiles.username, username))
        .limit(1);

      if (!shop || shop.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.session.shopProfileId = shop.id;
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
      });
      
      res.json(shop);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Shop Owner Logout
  app.post("/api/shops/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get Current Shop
  app.get("/api/shops/me", async (req, res) => {
    try {
      if (!req.session.shopProfileId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [shop] = await db.select()
        .from(shopProfiles)
        .where(eq(shopProfiles.id, req.session.shopProfileId))
        .limit(1);

      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      res.json(shop);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Switch Shop Account (for shop owners managing multiple shops)
  app.post("/api/shops/switch/:shopId", async (req, res) => {
    try {
      const { shopId } = req.params;
      
      const [shop] = await db.select()
        .from(shopProfiles)
        .where(eq(shopProfiles.id, shopId))
        .limit(1);

      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }

      req.session.shopProfileId = shop.id;
      res.json(shop);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== EXISTING ROUTES (updated to use database) ==========

  // Get all shop profiles
  app.get("/api/shop-profiles", async (req, res) => {
    try {
      const allShops = await db.select().from(shopProfiles);
      res.json(allShops);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create shop profile
  app.post("/api/shop-profiles", async (req, res) => {
    try {
      const validatedData = insertShopProfileSchema.parse(req.body);
      const [newShop] = await db.insert(shopProfiles).values(validatedData).returning();
      res.status(201).json(newShop);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get shop profile by ID
  app.get("/api/shop-profiles/:id", async (req, res) => {
    try {
      const [shop] = await db.select()
        .from(shopProfiles)
        .where(eq(shopProfiles.id, req.params.id))
        .limit(1);
      
      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }
      res.json(shop);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update shop profile
  app.patch("/api/shop-profiles/:id", async (req, res) => {
    try {
      const [updated] = await db.update(shopProfiles)
        .set(req.body)
        .where(eq(shopProfiles.id, req.params.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Shop not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get customers for a shop
  app.get("/api/shop-profiles/:shopId/customers", async (req, res) => {
    try {
      const { shopId } = req.params;
      
      // Get all coupons for this shop
      const coupons = await db.select()
        .from(customerCoupons)
        .where(eq(customerCoupons.shopProfileId, shopId));
      
      console.log(`Found ${coupons.length} coupons for shop ${shopId}`);
      
      if (coupons.length === 0) {
        return res.json([]);
      }
      
      const customerIds = [...new Set(coupons.map(c => c.customerId))];
      console.log(`Unique customer IDs: ${customerIds.length}`, customerIds);
      
      // Fetch all customers
      const allCustomers = await db.select()
        .from(customers);
      
      console.log(`Total customers in database: ${allCustomers.length}`);
      
      // Filter to only include customers with coupons for this shop
      const filteredCustomers = allCustomers.filter(customer => 
        customerIds.includes(customer.id)
      );
      
      console.log(`Filtered customers for this shop: ${filteredCustomers.length}`);
      
      // Enrich with coupon data
      const customersWithCoupons = filteredCustomers.map(customer => {
        const coupon = coupons.find(c => c.customerId === customer.id);
        return {
          ...customer,
          referralCode: coupon?.referralCode,
          couponPoints: coupon?.totalPoints || 0,
          couponRedeemedPoints: coupon?.redeemedPoints || 0,
        };
      });
      
      res.json(customersWithCoupons);
    } catch (error: any) {
      console.error("Error fetching shop customers:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Customer registration
  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const [customer] = await db.insert(customers).values(validatedData).returning();
      req.session.customerId = customer.id;
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get customer by referral code
  app.get("/api/customers/code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const [customer] = await db.select()
        .from(customers)
        .where(eq(customers.referralCode, code))
        .limit(1);
      
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get customer by ID with aggregated points from all coupons
  app.get("/api/customers/:id", async (req, res) => {
    try {
      const [customer] = await db.select()
        .from(customers)
        .where(eq(customers.id, req.params.id))
        .limit(1);
      
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Get all coupons for this customer to calculate actual points
      const coupons = await db.select()
        .from(customerCoupons)
        .where(eq(customerCoupons.customerId, customer.id));

      // Calculate total points and redeemed points from all coupons
      const totalPoints = coupons.reduce((sum, coupon) => sum + (coupon.totalPoints || 0), 0);
      const redeemedPoints = coupons.reduce((sum, coupon) => sum + (coupon.redeemedPoints || 0), 0);

      res.json({
        ...customer,
        totalPoints,
        redeemedPoints,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get customer shops
  app.get("/api/customers/:customerId/shops", async (req, res) => {
    try {
      const coupons = await db.select()
        .from(customerCoupons)
        .where(eq(customerCoupons.customerId, req.params.customerId));
      
      console.log(`Found ${coupons.length} coupons for customer ${req.params.customerId}`);
      
      const shopIds = [...new Set(coupons.map(c => c.shopProfileId))];
      if (shopIds.length === 0) {
        return res.json([]);
      }
      
      console.log(`Fetching data for ${shopIds.length} shops:`, shopIds);
      
      // Fetch all shops and filter by IDs
      const allShops = await db.select()
        .from(shopProfiles);
      
      const customerShopsData = allShops.filter(shop => 
        shopIds.includes(shop.id)
      );
      
      console.log(`Found ${customerShopsData.length} matching shops`);
      
      // Fetch campaigns for each shop
      const shopsWithCampaigns = await Promise.all(
        customerShopsData.map(async (shop) => {
          const shopCampaigns = await db.select()
            .from(campaigns)
            .where(eq(campaigns.storeId, shop.id));
          
          console.log(`Shop ${shop.shopName} (${shop.id}) has ${shopCampaigns.length} campaigns`);
          if (shopCampaigns.length > 0) {
            console.log(`Campaign data:`, JSON.stringify(shopCampaigns[0], null, 2));
          }
          
          return {
            ...shop,
            campaigns: shopCampaigns,
          };
        })
      );
      
      console.log(`Returning ${shopsWithCampaigns.length} shops with campaign data`);
      res.json(shopsWithCampaigns);
    } catch (error: any) {
      console.error("Error in /api/customers/:customerId/shops:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Customer coupons
  app.get("/api/customer-coupons/:customerId", async (req, res) => {
    try {
      const coupons = await db.select()
        .from(customerCoupons)
        .where(eq(customerCoupons.customerId, req.params.customerId));
      res.json(coupons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customer-coupons/code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const [coupon] = await db.select()
        .from(customerCoupons)
        .where(eq(customerCoupons.referralCode, code))
        .limit(1);
      
      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
      
      res.json(coupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customer-coupons", async (req, res) => {
    try {
      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const dataWithCode = { ...req.body, referralCode };
      const validatedData = insertCustomerCouponSchema.parse(dataWithCode);
      const [coupon] = await db.insert(customerCoupons).values(validatedData).returning();
      res.status(201).json(coupon);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const { customerId, campaignId, shopProfileId } = req.query;
      
      let query = db.select().from(transactions);
      
      if (customerId) {
        const txs = await db.select()
          .from(transactions)
          .where(eq(transactions.customerId, customerId as string))
          .orderBy(desc(transactions.createdAt));
        return res.json(txs);
      }
      
      if (campaignId) {
        const txs = await db.select()
          .from(transactions)
          .where(eq(transactions.campaignId, campaignId as string))
          .orderBy(desc(transactions.createdAt));
        return res.json(txs);
      }
      
      if (shopProfileId) {
        // Get all campaigns for this shop
        const shopCampaigns = await db.select()
          .from(campaigns)
          .where(eq(campaigns.storeId, shopProfileId as string));
        
        console.log(`Shop ${shopProfileId} has ${shopCampaigns.length} campaigns:`, shopCampaigns.map(c => c.id));
        
        const campaignIds = shopCampaigns.map(c => c.id);
        
        if (campaignIds.length === 0) {
          console.log(`No campaigns found for shop ${shopProfileId}`);
          return res.json([]);
        }
        
        // Get all transactions for these campaigns
        const allTxs = await db.select()
          .from(transactions)
          .orderBy(desc(transactions.createdAt));
        
        console.log(`Total transactions in database: ${allTxs.length}`);
        console.log(`Campaign IDs to match:`, campaignIds);
        console.log(`Transaction campaign IDs:`, allTxs.map(tx => tx.campaignId));
        
        // Filter to only include transactions for this shop's campaigns
        const txs = allTxs.filter(tx => campaignIds.includes(tx.campaignId));
        
        console.log(`Filtered ${txs.length} transactions for shop ${shopProfileId}`);
        
        return res.json(txs);
      }
      
      return res.status(400).json({ error: "customerId, campaignId, or shopProfileId is required" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions", upload.single("billImage"), async (req, res) => {
    try {
      console.log("Transaction request body:", req.body);
      const validatedData = insertTransactionSchema.parse(req.body);
      console.log("Validated transaction data:", validatedData);
      const [transaction] = await db.insert(transactions).values(validatedData).returning();
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error("Transaction creation error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Approve transaction and update points
  app.patch("/api/transactions/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the transaction
      const [transaction] = await db.select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ error: "Transaction already processed" });
      }

      // Update transaction status to approved
      const [updatedTransaction] = await db.update(transactions)
        .set({ status: "approved" })
        .where(eq(transactions.id, id))
        .returning();

      // Update points - ONLY in the coupon table, customer table will aggregate from coupons
      if (transaction.type === "purchase" || transaction.type === "referral") {
        // Add points for purchase/referral
        if (transaction.couponId) {
          const [coupon] = await db.select()
            .from(customerCoupons)
            .where(eq(customerCoupons.id, transaction.couponId))
            .limit(1);

          if (coupon) {
            await db.update(customerCoupons)
              .set({ totalPoints: coupon.totalPoints + transaction.points })
              .where(eq(customerCoupons.id, transaction.couponId));
          }
        }
      } else if (transaction.type === "redemption") {
        // Deduct points for redemption
        if (transaction.couponId) {
          const [coupon] = await db.select()
            .from(customerCoupons)
            .where(eq(customerCoupons.id, transaction.couponId))
            .limit(1);

          if (coupon) {
            await db.update(customerCoupons)
              .set({ redeemedPoints: coupon.redeemedPoints + Math.abs(transaction.points) })
              .where(eq(customerCoupons.id, transaction.couponId));
          }
        }
      }

      res.json(updatedTransaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reject transaction
  app.patch("/api/transactions/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      
      const [transaction] = await db.select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ error: "Transaction already processed" });
      }

      const [updatedTransaction] = await db.update(transactions)
        .set({ status: "rejected" })
        .where(eq(transactions.id, id))
        .returning();

      res.json(updatedTransaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      const { storeId } = req.query;
      
      if (storeId) {
        // Filter by storeId if provided
        const storeCampaigns = await db.select()
          .from(campaigns)
          .where(eq(campaigns.storeId, storeId as string));
        res.json(storeCampaigns);
      } else {
        // Return all campaigns if no filter
        const allCampaigns = await db.select().from(campaigns);
        res.json(allCampaigns);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      
      const [campaign] = await db.insert(campaigns)
        .values(validatedData)
        .returning();
      
      res.status(201).json(campaign);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update campaign
  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const [updated] = await db.update(campaigns)
        .set(updateData)
        .where(eq(campaigns.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete campaign
  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db.delete(campaigns)
        .where(eq(campaigns.id, id));

      res.json({ message: "Campaign deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customers/campaign/:campaignId", async (req, res) => {
    try {
      const customersData = await db.select()
        .from(customers)
        .where(eq(customers.campaignId, req.params.campaignId));
      res.json(customersData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate referral code
  app.get("/api/generate-code", (req, res) => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    res.json({ code });
  });

  const httpServer = createServer(app);
  return httpServer;
}
