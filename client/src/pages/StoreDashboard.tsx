import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Receipt, TrendingUp, Settings as SettingsIcon } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { CampaignCard } from "@/components/CampaignCard";
import { BillApprovalCard } from "@/components/BillApprovalCard";
import { CampaignBuilder } from "@/components/CampaignBuilder";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

export default function StoreDashboard() {
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  const campaigns = [
    {
      id: "1",
      storeId: "store-1",
      name: "Summer Rewards Campaign",
      description: "Earn points on every purchase and get your friends 10% off!",
      pointsPerDollar: 5,
      minPurchaseAmount: 25,
      discountPercentage: 10,
      couponColor: "#2563eb",
      couponTextColor: "#ffffff",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "2",
      storeId: "store-1",
      name: "VIP Loyalty Program",
      description: "Exclusive rewards for our best customers",
      pointsPerDollar: 10,
      minPurchaseAmount: 50,
      discountPercentage: 15,
      couponColor: "#7c3aed",
      couponTextColor: "#ffffff",
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const pendingBills = [
    {
      id: "txn-1",
      customerId: "cust-1",
      campaignId: "1",
      type: "purchase",
      amount: 125,
      points: 625,
      status: "pending",
      billImageUrl: "https://images.unsplash.com/photo-1554224311-beee4f7a1788?w=400&h=300&fit=crop",
      createdAt: new Date("2024-01-15T10:30:00"),
    },
    {
      id: "txn-2",
      customerId: "cust-2",
      campaignId: "1",
      type: "purchase",
      amount: 89,
      points: 445,
      status: "pending",
      billImageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop",
      createdAt: new Date("2024-01-15T14:20:00"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading" data-testid="text-dashboard-title">
                ReferralHub
              </h1>
              <p className="text-sm text-muted-foreground">Campaign Management</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList data-testid="tabs-navigation">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              <TrendingUp className="h-4 w-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="approvals" data-testid="tab-approvals">
              <Receipt className="h-4 w-4 mr-2" />
              Approvals
              {pendingBills.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {pendingBills.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Customers"
                value="1,234"
                description="Active referrers"
                icon={LayoutDashboard}
                trend={{ value: 12, isPositive: true }}
              />
              <StatsCard
                title="Total Revenue"
                value="$45,678"
                description="From referrals"
                icon={TrendingUp}
                trend={{ value: 8, isPositive: true }}
              />
              <StatsCard
                title="Active Campaigns"
                value={campaigns.filter(c => c.isActive).length}
                description="Running now"
                icon={TrendingUp}
              />
              <StatsCard
                title="Pending Approvals"
                value={pendingBills.length}
                description="Awaiting review"
                icon={Receipt}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold font-heading mb-4">Recent Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingBills.slice(0, 2).map((bill) => (
                  <BillApprovalCard
                    key={bill.id}
                    transaction={bill}
                    customerName="Customer"
                    onApprove={() => console.log("Approved", bill.id)}
                    onReject={() => console.log("Rejected", bill.id)}
                    onView={() => console.log("View", bill.id)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-heading">Your Campaigns</h2>
              <Button onClick={() => setShowCampaignBuilder(true)} data-testid="button-create-campaign">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onViewQR={() => setSelectedQR(campaign.id)}
                  onSettings={() => console.log("Settings", campaign.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            <h2 className="text-2xl font-bold font-heading">Pending Approvals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBills.map((bill) => (
                <BillApprovalCard
                  key={bill.id}
                  transaction={bill}
                  customerName="Customer Name"
                  onApprove={() => console.log("Approved", bill.id)}
                  onReject={() => console.log("Rejected", bill.id)}
                  onView={() => console.log("View", bill.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showCampaignBuilder} onOpenChange={setShowCampaignBuilder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <CampaignBuilder
            onSubmit={(data) => {
              console.log("New campaign:", data);
              setShowCampaignBuilder(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Campaign QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={`${window.location.origin}/join/${selectedQR}`}
                size={250}
                level="H"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Customers can scan this QR code to join your campaign
            </p>
            <Button
              variant="outline"
              onClick={() => {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                  const url = canvas.toDataURL();
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `campaign-${selectedQR}-qr.png`;
                  a.click();
                }
              }}
              data-testid="button-download-qr"
            >
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
