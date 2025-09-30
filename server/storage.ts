import { type Store, type InsertStore, type Campaign, type InsertCampaign, type Customer, type InsertCustomer, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getStore(id: string): Promise<Store | undefined>;
  getStoreByEmail(email: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignsByStoreId(storeId: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByReferralCode(code: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByCustomerId(customerId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private stores: Map<string, Store>;
  private campaigns: Map<string, Campaign>;
  private customers: Map<string, Customer>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.stores = new Map();
    this.campaigns = new Map();
    this.customers = new Map();
    this.transactions = new Map();
  }

  async getStore(id: string): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStoreByEmail(email: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(store => store.email === email);
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = randomUUID();
    const store: Store = { ...insertStore, id };
    this.stores.set(id, store);
    return store;
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByStoreId(storeId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.storeId === storeId);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const campaign: Campaign = {
      id,
      storeId: insertCampaign.storeId,
      name: insertCampaign.name,
      description: insertCampaign.description ?? null,
      pointsPerDollar: insertCampaign.pointsPerDollar ?? 1,
      minPurchaseAmount: insertCampaign.minPurchaseAmount ?? 0,
      discountPercentage: insertCampaign.discountPercentage ?? 10,
      couponColor: insertCampaign.couponColor ?? "#2563eb",
      couponTextColor: insertCampaign.couponTextColor ?? "#ffffff",
      isActive: insertCampaign.isActive ?? true,
      createdAt: new Date(),
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByReferralCode(code: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => c.referralCode === code);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      id,
      campaignId: insertCustomer.campaignId,
      name: insertCustomer.name,
      phone: insertCustomer.phone,
      referralCode: insertCustomer.referralCode,
      totalPoints: insertCustomer.totalPoints ?? 0,
      redeemedPoints: insertCustomer.redeemedPoints ?? 0,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByCustomerId(customerId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.customerId === customerId);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      id,
      customerId: insertTransaction.customerId,
      campaignId: insertTransaction.campaignId,
      type: insertTransaction.type,
      amount: insertTransaction.amount,
      points: insertTransaction.points,
      status: insertTransaction.status ?? "pending",
      billImageUrl: insertTransaction.billImageUrl ?? null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
}

export const storage = new MemStorage();
