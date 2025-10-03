
import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import bcrypt from "bcrypt";
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
  // Warn about SESSION_SECRET in production
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.warn('⚠️  WARNING: SESSION_SECRET environment variable is not set! Using a default value is INSECURE for production.');
    console.warn('   Please set SESSION_SECRET in your deployment secrets/environment variables.');
  }

  // Session middleware
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  // ========== CUSTOMER AUTHENTICATION ==========
  
  // Customer Login
  app.post("/api/customers/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const [customer] = await db.select()
        .from(customers)
        .where(eq(customers.username, username))
        .limit(1);

      if (!customer) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const isValidPassword = await bcrypt.compare(password, customer.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.session.customerId = customer.id;
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
      const { shopName, shopCode, username, password, description, logo } = req.body;
      
      // Check if username already exists
      const [existingByUsername] = await db.select()
        .from(shopProfiles)
        .where(eq(shopProfiles.username, username))
        .limit(1);
      
      if (existingByUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Check if shop code already exists
      const [existingByCode] = await db.select()
        .from(shopProfiles)
        .where(eq(shopProfiles.shopCode, shopCode))
        .limit(1);
      
      if (existingByCode) {
        return res.status(400).json({ error: "Shop code already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [newShop] = await db.insert(shopProfiles).values({
        shopName,
        shopCode,
        username,
        password: hashedPassword,
        description,
        logo,
      }).returning();
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

      if (!shop) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const isValidPassword = await bcrypt.compare(password, shop.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.session.shopProfileId = shop.id;
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
      const coupons = await db.select()
        .from(customerCoupons)
        .where(eq(customerCoupons.shopProfileId, req.params.shopId));
      
      const customerIds = coupons.map(c => c.customerId);
      if (customerIds.length === 0) {
        return res.json([]);
      }
      
      const customersData = await db.select()
        .from(customers)
        .where(eq(customers.id, customerIds[0]));
      
      res.json(customersData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customer registration
  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const [customer] = await db.insert(customers).values({
        ...validatedData,
        password: hashedPassword,
      }).returning();
      req.session.customerId = customer.id;
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get customer by ID
  app.get("/api/customers/:id", async (req, res) => {
    try {
      const [customer] = await db.select()
        .from(customers)
        .where(eq(customers.id, req.params.id))
        .limit(1);
      
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
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
      
      const shopIds = coupons.map(c => c.shopProfileId);
      if (shopIds.length === 0) {
        return res.json([]);
      }
      
      const shops = await db.select()
        .from(shopProfiles)
        .where(eq(shopProfiles.id, shopIds[0]));
      
      res.json(shops);
    } catch (error: any) {
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
        const txs = await db.select()
          .from(transactions)
          .where(eq(transactions.shopName, shopProfileId as string))
          .orderBy(desc(transactions.createdAt));
        return res.json(txs);
      }
      
      return res.status(400).json({ error: "customerId, campaignId, or shopProfileId is required" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions", upload.single("billImage"), async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const [transaction] = await db.insert(transactions).values(validatedData).returning();
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      const allCampaigns = await db.select().from(campaigns);
      res.json(allCampaigns);
    } catch (error: any) {
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
