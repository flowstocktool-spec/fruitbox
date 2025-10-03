import type { Campaign, Customer, Transaction } from "@shared/schema";

export async function getCampaigns(storeId: string): Promise<Campaign[]> {
  const res = await fetch(`/api/campaigns?storeId=${storeId}`);
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
}

export async function getCampaign(id: string): Promise<Campaign> {
  const res = await fetch(`/api/campaigns/${id}`);
  if (!res.ok) throw new Error("Failed to fetch campaign");
  return res.json();
}

export async function createCampaign(data: any): Promise<Campaign> {
  const res = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create campaign");
  return res.json();
}

export async function getCustomer(id: string): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`);
  if (!res.ok) throw new Error("Failed to fetch customer");
  return res.json();
}

export async function getCustomerByCode(code: string): Promise<Customer> {
  const res = await fetch(`/api/customers/code/${code}`);
  if (!res.ok) throw new Error("Failed to fetch customer");
  return res.json();
}

export async function createCustomer(data: any): Promise<Customer> {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create customer");
  return res.json();
}

export async function getTransactions(customerId?: string, campaignId?: string): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (customerId) params.append("customerId", customerId);
  if (campaignId) params.append("campaignId", campaignId);

  const res = await fetch(`/api/transactions?${params}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function createTransaction(data: any, billFile?: File): Promise<Transaction> {
  if (billFile) {
    const formData = new FormData();
    formData.append("billImage", billFile);
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    const res = await fetch("/api/transactions", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to create transaction");
    return res.json();
  }

  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create transaction");
  return res.json();
}

export async function updateTransactionStatus(id: string, status: string): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update transaction");
  return res.json();
}

export async function getCampaignStats(campaignId: string) {
  const res = await fetch(`/api/stats/campaign/${campaignId}`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function generateReferralCode(): Promise<string> {
  const res = await fetch("/api/generate-code");
  if (!res.ok) throw new Error("Failed to generate code");
  const data = await res.json();
  return data.code;
}

export async function getCustomerCoupons(customerId: string) {
  const res = await fetch(`/api/customer-coupons/${customerId}`);
  if (!res.ok) throw new Error("Failed to fetch customer coupons");
  return res.json();
}

export async function getCustomerCouponByCode(code: string) {
  const res = await fetch(`/api/customer-coupons/code/${code}`);
  if (!res.ok) throw new Error("Failed to fetch customer coupon");
  return res.json();
}

export async function createCustomerCoupon(data: any) {
  const res = await fetch("/api/customer-coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create customer coupon");
  return res.json();
}

export async function createSharedCoupon(data: any) {
  const res = await fetch("/api/shared-coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create shared coupon");
  return res.json();
}

export async function getSharedCouponByToken(token: string) {
  const res = await fetch(`/api/shared-coupons/token/${token}`);
  if (!res.ok) throw new Error("Failed to fetch shared coupon");
  return res.json();
}

export async function claimSharedCoupon(id: string, customerId: string) {
  const res = await fetch(`/api/shared-coupons/${id}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to claim coupon");
  }
  return res.json();
}

export async function getShopProfiles() {
  const res = await fetch("/api/shop-profiles");
  if (!res.ok) throw new Error("Failed to fetch shop profiles");
  return res.json();
}

export async function getCustomerShops(customerId: string) {
  const res = await fetch(`/api/customers/${customerId}/shops`);
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch customer shops:", errorText);
    throw new Error(`Failed to fetch customer shops: ${res.statusText}`);
  }
  const data = await res.json();
  // Ensure we always return an array
  return Array.isArray(data) ? data : [];
}

export async function getShopProfile(id: string) {
  const res = await fetch(`/api/shop-profiles/${id}`);
  if (!res.ok) throw new Error("Failed to fetch shop profile");
  return res.json();
}

export async function createShopProfile(data: any) {
  const res = await fetch("/api/shop-profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create shop profile");
  return res.json();
}

export async function updateShopProfile(id: string, data: any) {
  const res = await fetch(`/api/shop-profiles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update shop profile");
  return res.json();
}

export async function getShopCustomers(shopProfileId: string) {
  const response = await fetch(`/api/shop-profiles/${shopProfileId}/customers`);
  if (!response.ok) {
    throw new Error('Failed to fetch shop customers');
  }
  return response.json();
}

export async function loginCustomer(username: string, password: string): Promise<Customer> {
  const res = await fetch("/api/customers/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Login failed");
  }
  return res.json();
}

export async function getCustomerByDeviceId(deviceId: string) {
  const response = await fetch(`/api/customers/device/${deviceId}`);
  if (!response.ok) {
    throw new Error('Customer not found for this device');
  }
  return response.json();
}

export async function updateCustomerDevice(customerId: string, deviceId: string, deviceFingerprint: string) {
  const response = await fetch(`/api/customers/${customerId}/device`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceFingerprint }),
  });
  if (!response.ok) {
    throw new Error('Failed to update device verification');
  }
  return response.json();
}

export async function loginShopOwner(username: string, password: string) {
  const res = await fetch("/api/shop-owners/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Login failed");
  }
  return res.json();
}