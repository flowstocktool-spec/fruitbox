import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertCampaignSchema, insertCustomerSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/transactions", upload.single('billImage'), async (req, res) => {
    try {
      const data = insertTransactionSchema.parse(req.body);
      
      // Convert bill image to base64 if uploaded
      let billImageUrl = data.billImageUrl;
      if (req.file) {
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

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const existingTransaction = await storage.getTransaction(req.params.id);
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
      
      const transaction = await storage.updateTransactionStatus(req.params.id, status);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Only award points on transition to approved (not if already approved)
      if (status === 'approved' && existingTransaction.status !== 'approved') {
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

  const httpServer = createServer(app);
  return httpServer;
}
