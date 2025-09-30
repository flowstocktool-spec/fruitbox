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
