import { type Store, type InsertStore, type Campaign, type InsertCampaign, type Customer, type InsertCustomer, type CustomerCoupon, type InsertCustomerCoupon, type SharedCoupon, type InsertSharedCoupon, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getStore(id: string): Promise<Store | undefined>;
  getStoreByEmail(email: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  createStoreWithId(store: Store): Promise<Store>;

  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignsByStoreId(storeId: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;

  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByReferralCode(code: string): Promise<Customer | undefined>;
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  getCustomersByCampaignId(campaignId: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomerPoints(id: string, totalPoints: number): Promise<Customer | undefined>;

  getCustomerCoupons(customerId: string): Promise<CustomerCoupon[]>;
  getCustomerCouponByCode(code: string): Promise<CustomerCoupon | undefined>;
  createCustomerCoupon(coupon: InsertCustomerCoupon): Promise<CustomerCoupon>;
  updateCustomerCouponPoints(id: string, totalPoints: number, redeemedPoints: number): Promise<CustomerCoupon | undefined>;

  getSharedCoupon(id: string): Promise<SharedCoupon | undefined>;
  getSharedCouponByToken(token: string): Promise<SharedCoupon | undefined>;
  getSharedCouponsByCouponId(couponId: string): Promise<SharedCoupon[]>;
  createSharedCoupon(sharedCoupon: InsertSharedCoupon): Promise<SharedCoupon>;
  claimSharedCoupon(id: string, claimedByCustomerId: string): Promise<SharedCoupon | undefined>;

  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByCustomerId(customerId: string): Promise<Transaction[]>;
  getTransactionsByCampaignId(campaignId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string): Promise<Transaction | undefined>;

  createShopProfile(data: any): Promise<any>;
  getShopProfiles(): Promise<any[]>;
  getShopProfileByCode(shopCode: string): Promise<any | undefined>;
  getShopProfile(id: string): Promise<any | undefined>;
  getShopByUsername(username: string): Promise<any | undefined>;
  updateShopProfile(id: string, data: any): Promise<any | undefined>;
  getCustomersByShopProfileId(shopProfileId: string): Promise<Customer[]>;
}

export class MemStorage implements IStorage {
  private stores: Map<string, Store>;
  private campaigns: Map<string, Campaign>;
  private customers: Map<string, Customer>;
  private customerCoupons: Map<string, CustomerCoupon>;
  private sharedCoupons: Map<string, SharedCoupon>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.stores = new Map();
    this.campaigns = new Map();
    this.customers = new Map();
    this.customerCoupons = new Map();
    this.sharedCoupons = new Map();
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

  async createStoreWithId(store: Store): Promise<Store> {
    this.stores.set(store.id, store);
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

  async getCustomerByUsername(username: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => (c as any).username === username);
  }

  async getCustomersByCampaignId(campaignId: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(c => c.campaignId === campaignId);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      id,
      campaignId: insertCustomer.campaignId ?? null,
      name: insertCustomer.name,
      phone: insertCustomer.phone,
      email: insertCustomer.email ?? null,
      username: (insertCustomer as any).username,
      password: (insertCustomer as any).password,
      referralCode: insertCustomer.referralCode,
      totalPoints: insertCustomer.totalPoints ?? 0,
      redeemedPoints: insertCustomer.redeemedPoints ?? 0,
      deviceId: (insertCustomer as any).deviceId ?? null,
      deviceFingerprint: (insertCustomer as any).deviceFingerprint ?? null,
      lastDeviceVerifiedAt: (insertCustomer as any).deviceId ? new Date() : null,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async updateCustomerPoints(id: string, totalPoints: number): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updated = { ...customer, totalPoints };
    this.customers.set(id, updated);
    return updated;
  }

  async getCustomerByDeviceId(deviceId: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => (c as any).deviceId === deviceId);
  }

  async updateCustomerDevice(id: string, deviceId: string, deviceFingerprint: string): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updated = {
      ...customer,
      deviceId,
      deviceFingerprint,
      lastDeviceVerifiedAt: new Date()
    } as any;
    this.customers.set(id, updated);
    return updated;
  }

  async getCustomerCoupons(customerId: string): Promise<CustomerCoupon[]> {
    return Array.from(this.customerCoupons.values()).filter(c => c.customerId === customerId);
  }

  async getCustomerCouponByCode(code: string): Promise<CustomerCoupon | undefined> {
    return Array.from(this.customerCoupons.values()).find(c => c.referralCode === code);
  }

  async createCustomerCoupon(insertCoupon: InsertCustomerCoupon): Promise<CustomerCoupon> {
    const id = randomUUID();
    const coupon: any = {
      id,
      customerId: insertCoupon.customerId,
      shopProfileId: (insertCoupon as any).shopProfileId,
      shopName: (insertCoupon as any).shopName,
      shopId: (insertCoupon as any).shopId !== undefined ? (insertCoupon as any).shopId : null,
      referralCode: insertCoupon.referralCode,
      totalPoints: insertCoupon.totalPoints ?? 0,
      redeemedPoints: insertCoupon.redeemedPoints ?? 0,
      createdAt: new Date(),
    };
    this.customerCoupons.set(id, coupon);
    return coupon;
  }

  async updateCustomerCouponPoints(id: string, totalPoints: number, redeemedPoints: number): Promise<CustomerCoupon | undefined> {
    const coupon = this.customerCoupons.get(id);
    if (!coupon) return undefined;

    const updated = { ...coupon, totalPoints, redeemedPoints };
    this.customerCoupons.set(id, updated);
    return updated;
  }

  async getSharedCoupon(id: string): Promise<SharedCoupon | undefined> {
    return this.sharedCoupons.get(id);
  }

  async getSharedCouponByToken(token: string): Promise<SharedCoupon | undefined> {
    return Array.from(this.sharedCoupons.values()).find(sc => sc.shareToken === token);
  }

  async getSharedCouponsByCouponId(couponId: string): Promise<SharedCoupon[]> {
    return Array.from(this.sharedCoupons.values()).filter(sc => sc.couponId === couponId);
  }

  async createSharedCoupon(insertSharedCoupon: InsertSharedCoupon): Promise<SharedCoupon> {
    const id = randomUUID();
    const sharedCoupon: SharedCoupon = {
      id,
      couponId: insertSharedCoupon.couponId,
      sharedByCustomerId: insertSharedCoupon.sharedByCustomerId,
      shareToken: insertSharedCoupon.shareToken,
      claimedByCustomerId: insertSharedCoupon.claimedByCustomerId ?? null,
      status: insertSharedCoupon.status ?? "pending",
      createdAt: new Date(),
    };
    this.sharedCoupons.set(id, sharedCoupon);
    return sharedCoupon;
  }

  async claimSharedCoupon(id: string, claimedByCustomerId: string): Promise<SharedCoupon | undefined> {
    const sharedCoupon = this.sharedCoupons.get(id);
    if (!sharedCoupon) return undefined;

    const updated = { ...sharedCoupon, claimedByCustomerId, status: "claimed" };
    this.sharedCoupons.set(id, updated);
    return updated;
  }

  async getTransactionsByCustomerId(customerId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.customerId === customerId);
  }

  async getTransactionsByCampaignId(campaignId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.campaignId === campaignId);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: any = {
      id,
      customerId: insertTransaction.customerId,
      campaignId: insertTransaction.campaignId !== undefined ? insertTransaction.campaignId : null,
      couponId: insertTransaction.couponId !== undefined ? insertTransaction.couponId : null,
      type: insertTransaction.type,
      amount: insertTransaction.amount,
      points: insertTransaction.points,
      status: insertTransaction.status ?? "pending",
      billImageUrl: insertTransaction.billImageUrl !== undefined ? insertTransaction.billImageUrl : null,
      referralCode: (insertTransaction as any).referralCode || null,
      shopName: (insertTransaction as any).shopName || null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updated = { ...transaction, status };
    this.transactions.set(id, updated);
    return updated;
  }

  async createShopProfile(data: any): Promise<any> {
    const id = randomUUID();
    const shopProfile = { ...data, id, type: 'shop', createdAt: new Date() };
    this.stores.set(id, shopProfile as any);
    return shopProfile;
  }

  async getShopProfiles(): Promise<any[]> {
    return Array.from(this.stores.values()).filter(store => (store as any).type === 'shop');
  }

  async getShopProfileByCode(shopCode: string): Promise<any | undefined> {
    return Array.from(this.stores.values()).find(store => (store as any).type === 'shop' && (store as any).shopCode === shopCode);
  }

  async getShopProfile(id: string): Promise<any | undefined> {
    const store = this.stores.get(id);
    if (store && (store as any).type === 'shop') {
      return store;
    }
    return undefined;
  }

  async getShopByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.stores.values()).find(store => (store as any).type === 'shop' && (store as any).username === username);
  }

  async updateShopProfile(id: string, data: any): Promise<any | undefined> {
    const shopProfile = this.stores.get(id);
    if (!shopProfile || (shopProfile as any).type !== 'shop') return undefined;

    const updated = { ...shopProfile, ...data };
    this.stores.set(id, updated);
    return updated;
  }

  async getCustomersByShopProfileId(shopProfileId: string): Promise<Customer[]> {
    const coupons = Array.from(this.customerCoupons.values()).filter(c => (c as any).shopProfileId === shopProfileId);
    const customerIds = Array.from(new Set(coupons.map(c => c.customerId)));
    const customers = await Promise.all(customerIds.map(id => this.getCustomer(id)));
    return customers.filter(c => c !== undefined) as Customer[];
  }
}

export const storage = new MemStorage();