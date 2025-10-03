import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertCampaignSchema, insertCustomerSchema, insertCustomerCouponSchema, insertSharedCouponSchema, insertTransactionSchema, insertShopProfileSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Shop Profile routes
  app.get("/api/shop-profiles", async (req, res) => {
    try {
      const shopProfiles = await storage.getShopProfiles();
      res.json(shopProfiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shop profiles" });
    }
  });

  app.get("/api/shop-profiles/:id", async (req, res) => {
    try {
      const shopProfile = await storage.getShopProfile(req.params.id);
      if (!shopProfile) {
        return res.status(404).json({ error: "Shop profile not found" });
      }
      res.json(shopProfile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shop profile" });
    }
  });

  app.get("/api/shop-profiles/code/:code", async (req, res) => {
    try {
      const shopProfile = await storage.getShopProfileByCode(req.params.code);
      if (!shopProfile) {
        return res.status(404).json({ error: "Shop not found" });
      }
      res.json(shopProfile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shop profile" });
    }
  });

  app.post("/api/shop-profiles", async (req, res) => {
    try {
      const data = insertShopProfileSchema.parse(req.body);
      const shopProfile = await storage.createShopProfile(data);
      res.status(201).json(shopProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create shop profile" });
    }
  });

  app.patch("/api/shop-profiles/:id", async (req, res) => {
    try {
      const shopProfile = await storage.updateShopProfile(req.params.id, req.body);
      if (!shopProfile) {
        return res.status(404).json({ error: "Shop profile not found" });
      }
      res.json(shopProfile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update shop profile" });
    }
  });

  // Get customers who have coupons for a specific shop
  app.get("/api/shop-profiles/:id/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomersByShopProfileId(req.params.id);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shop customers" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns", async (req, res) => {
    try {
      const storeId = req.query.storeId as string;
      if (!storeId) {
        return res.status(400).json({ error: "storeId is required" });
      }
      const campaigns = await storage.getCampaignsByStoreId(storeId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const data = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(data);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Customer routes
  app.post("/api/customers/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const customer = await storage.getCustomerByUsername(username);
      
      if (!customer || (customer as any).password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.get("/api/customers/code/:code", async (req, res) => {
    try {
      const customer = await storage.getCustomerByReferralCode(req.params.code);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const data = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(data);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const campaignId = req.query.campaignId as string;

      if (customerId) {
        const transactions = await storage.getTransactionsByCustomerId(customerId);
        return res.json(transactions);
      }

      if (campaignId) {
        const transactions = await storage.getTransactionsByCampaignId(campaignId);
        return res.json(transactions);
      }

      res.status(400).json({ error: "customerId or campaignId is required" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Create transaction
  app.post("/api/transactions", upload.single("billImage"), async (req, res) => {
    try {
      const data = insertTransactionSchema.parse(req.body);

      let billImageUrl = null;
      if (req.file) {
        // Assuming saveFile is a function that saves the file and returns a URL or identifier
        // If storage is in memory, this might be different. For now, assuming it stores and returns a path/URL.
        // For simplicity and matching the original `storage` usage, let's assume `storage.saveFile` exists or we adapt.
        // The original code used `multer.memoryStorage()` and `req.file.buffer.toString('base64')`.
        // Let's stick to that pattern if `saveFile` isn't defined elsewhere.
        billImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }

      const transaction = await storage.createTransaction({
        ...data,
        billImageUrl,
      });

      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // Update transaction status
  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Fetch existing transaction to check current status and referral code
      const existingTransaction = await storage.getTransaction(id);
      if (!existingTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Prevent re-approval or invalid transitions (idempotency check)
      if (existingTransaction.status === status) {
        return res.json(existingTransaction); // Already in this state, return as-is
      }
      if (existingTransaction.status === 'approved' && status === 'approved') {
        return res.status(409).json({ error: "Transaction already approved" });
      }


      const transaction = await storage.updateTransactionStatus(id, status);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // If approved, award points
      if (status === "approved" && existingTransaction.status !== 'approved') {
        // If referral code was used, award points to the affiliate's shop-specific coupon
        if (transaction.referralCode) {
          const affiliateCoupon = await storage.getCustomerCouponByCode(transaction.referralCode);

          if (affiliateCoupon) {
            // Award affiliate points (e.g., 10% of transaction points)
            const affiliatePoints = Math.floor(transaction.points * 0.1);

            await storage.updateCustomerCouponPoints(
              affiliateCoupon.id,
              affiliateCoupon.totalPoints + affiliatePoints,
              affiliateCoupon.redeemedPoints
            );

            // Also update the affiliate customer's total points
            const affiliate = await storage.getCustomer(affiliateCoupon.customerId);
            if (affiliate) {
              await storage.updateCustomerPoints(
                affiliate.id,
                affiliate.totalPoints + affiliatePoints
              );
            }

            // Create a transaction record for the affiliate earning
            await storage.createTransaction({
              customerId: affiliateCoupon.customerId,
              campaignId: transaction.campaignId,
              couponId: affiliateCoupon.id,
              type: 'referral_bonus',
              amount: transaction.amount,
              points: affiliatePoints,
              status: 'approved',
              shopName: transaction.shopName,
              referralCode: null,
              billImageUrl: null,
            });
          }
        }

        // Award points to the purchasing customer's coupon if they have one
        if (transaction.couponId) {
          const customerCoupon = await storage.getCustomerCoupons(transaction.customerId)
            .then(coupons => coupons.find(c => c.id === transaction.couponId));
          
          if (customerCoupon) {
            await storage.updateCustomerCouponPoints(
              customerCoupon.id,
              customerCoupon.totalPoints + transaction.points,
              customerCoupon.redeemedPoints
            );
          }
        }

        // Also update purchasing customer's main account points
        const customer = await storage.getCustomer(transaction.customerId);
        if (customer) {
          await storage.updateCustomerPoints(
            customer.id,
            customer.totalPoints + transaction.points
          );
        }
      }

      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  // Stats routes
  app.get("/api/stats/campaign/:campaignId", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByCampaignId(req.params.campaignId);
      const customers = await storage.getCustomersByCampaignId(req.params.campaignId);

      const totalCustomers = customers.length;
      const totalRevenue = transactions
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalPoints = transactions
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + t.points, 0);
      const pendingApprovals = transactions.filter(t => t.status === 'pending').length;

      res.json({
        totalCustomers,
        totalRevenue,
        totalPoints,
        pendingApprovals,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get customers by campaign
  app.get("/api/customers/campaign/:campaignId", async (req, res) => {
    try {
      const customers = await storage.getCustomersByCampaignId(req.params.campaignId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // Customer coupon routes
  app.get("/api/customer-coupons/:customerId", async (req, res) => {
    try {
      const coupons = await storage.getCustomerCoupons(req.params.customerId);
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer coupons" });
    }
  });

  // Get shops where customer has coupons
  app.get("/api/customers/:customerId/shops", async (req, res) => {
    try {
      const coupons = await storage.getCustomerCoupons(req.params.customerId);
      const shopIds = [...new Set(coupons.map((c: any) => c.shopProfileId).filter(Boolean))];
      const shops = await Promise.all(shopIds.map(id => storage.getShopProfile(id)));
      res.json(shops.filter(shop => shop !== undefined));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer shops" });
    }
  });

  app.get("/api/customer-coupons/code/:code", async (req, res) => {
    try {
      const coupon = await storage.getCustomerCouponByCode(req.params.code);
      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer coupon" });
    }
  });

  app.post("/api/customer-coupons", async (req, res) => {
    try {
      const { customerId, shopProfileId } = req.body;
      
      // Check if customer already has a coupon for this shop
      const existingCoupons = await storage.getCustomerCoupons(customerId);
      const hasCoupon = existingCoupons.some(c => c.shopProfileId === shopProfileId);
      
      if (hasCoupon) {
        return res.status(409).json({ error: "Customer already has a coupon for this shop" });
      }

      // Generate unique referral code for this coupon
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let referralCode = generateCode();
      let exists = await storage.getCustomerCouponByCode(referralCode);

      while (exists) {
        referralCode = generateCode();
        exists = await storage.getCustomerCouponByCode(referralCode);
      }

      const data = insertCustomerCouponSchema.parse({
        customerId,
        shopProfileId,
        referralCode,
        totalPoints: 0,
        redeemedPoints: 0,
      });

      const coupon = await storage.createCustomerCoupon(data);
      res.status(201).json(coupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer coupon" });
    }
  });

  // Generate unique referral code
  app.get("/api/generate-code", async (req, res) => {
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let code = generateCode();
    let exists = await storage.getCustomerByReferralCode(code);

    while (exists) {
      code = generateCode();
      exists = await storage.getCustomerByReferralCode(code);
    }

    res.json({ code });
  });

  // Device verification endpoints
  app.get("/api/customers/device/:deviceId", async (req, res) => {
    try {
      const customer = await storage.getCustomerByDeviceId(req.params.deviceId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found for this device" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer by device" });
    }
  });

  app.patch("/api/customers/:id/device", async (req, res) => {
    try {
      const { deviceId, deviceFingerprint } = req.body;
      const customer = await storage.updateCustomerDevice(req.params.id, deviceId, deviceFingerprint);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update device verification" });
    }
  });

  // Shared coupon routes
  app.post("/api/shared-coupons", async (req, res) => {
    try {
      // Generate unique share token
      const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 16; i++) {
          token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
      };

      let shareToken = generateToken();
      let exists = await storage.getSharedCouponByToken(shareToken);

      while (exists) {
        shareToken = generateToken();
        exists = await storage.getSharedCouponByToken(shareToken);
      }

      const data = insertSharedCouponSchema.parse({
        ...req.body,
        shareToken,
        status: "pending",
      });

      const sharedCoupon = await storage.createSharedCoupon(data);
      res.status(201).json(sharedCoupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create shared coupon" });
    }
  });

  app.get("/api/shared-coupons/token/:token", async (req, res) => {
    try {
      const sharedCoupon = await storage.getSharedCouponByToken(req.params.token);
      if (!sharedCoupon) {
        return res.status(404).json({ error: "Shared coupon not found" });
      }

      // Get the original coupon details
      const coupon = await storage.getCustomerCouponByCode(
        (await storage.getCustomerCoupons(sharedCoupon.sharedByCustomerId))
          .find(c => c.id === sharedCoupon.couponId)?.referralCode || ""
      );

      if (!coupon) {
        return res.status(404).json({ error: "Original coupon not found" });
      }

      res.json({ sharedCoupon, coupon });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared coupon" });
    }
  });

  app.post("/api/shared-coupons/:id/claim", async (req, res) => {
    try {
      const { customerId } = req.body;
      if (!customerId) {
        return res.status(400).json({ error: "customerId is required" });
      }

      const sharedCoupon = await storage.getSharedCoupon(req.params.id);
      if (!sharedCoupon) {
        return res.status(404).json({ error: "Shared coupon not found" });
      }

      if (sharedCoupon.status === "claimed") {
        return res.status(409).json({ error: "Coupon already claimed" });
      }

      // Get the original coupon
      const originalCoupon = await storage.getCustomerCoupons(sharedCoupon.sharedByCustomerId)
        .then(coupons => coupons.find(c => c.id === sharedCoupon.couponId));

      if (!originalCoupon) {
        return res.status(404).json({ error: "Original coupon not found" });
      }

      // Create a new coupon for the claiming customer
      const newCoupon = await storage.createCustomerCoupon({
        customerId,
        shopProfileId: (originalCoupon as any).shopProfileId,
        shopName: (originalCoupon as any).shopName,
        shopId: (originalCoupon as any).shopId,
        referralCode: originalCoupon.referralCode + '-' + customerId.substring(0, 4),
        totalPoints: 0,
        redeemedPoints: 0,
      } as any);

      // Mark the shared coupon as claimed
      await storage.claimSharedCoupon(req.params.id, customerId);

      res.status(200).json({ sharedCoupon, newCoupon });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to claim shared coupon" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}