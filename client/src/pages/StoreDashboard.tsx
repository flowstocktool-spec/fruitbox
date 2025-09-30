import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Receipt, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { CampaignCard } from "@/components/CampaignCard";
import { BillApprovalCard } from "@/components/BillApprovalCard";
import { CampaignBuilder } from "@/components/CampaignBuilder";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { getCampaigns, getTransactions, createCampaign, updateTransactionStatus, getCampaignStats } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function StoreDashboard() {
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const { toast } = useToast();

  // For demo, use the first store ID from seed data
  const storeId = "demo-store-id"; // In production, get from auth context

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns', storeId],
    queryFn: () => getCampaigns(storeId),
  });

  const { data: allTransactions = [] } = useQuery({
    queryKey: ['/api/transactions', 'all'],
    queryFn: async () => {
      if (campaigns.length === 0) return [];
      const txns = await Promise.all(
        campaigns.map(c => getTransactions(undefined, c.id))
      );
      return txns.flat();
    },
    enabled: campaigns.length > 0,
  });

  const pendingBills = allTransactions.filter(t => t.status === 'pending');

  const createCampaignMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      setShowCampaignBuilder(false);
      toast({
        title: "Campaign created!",
        description: "Your referral campaign is now active.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveTransactionMutation = useMutation({
    mutationFn: (id: string) => updateTransactionStatus(id, 'approved'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Bill approved!",
        description: "Points have been awarded to the customer.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve bill. It may already be approved.",
        variant: "destructive",
      });
    },
  });

  const rejectTransactionMutation = useMutation({
    mutationFn: (id: string) => updateTransactionStatus(id, 'rejected'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Bill rejected",
        description: "The transaction has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject bill. Please try again.",
        variant: "destructive",
      });
    },
  });

  const totalRevenue = allTransactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);

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
                title="Active Campaigns"
                value={campaigns.filter(c => c.isActive).length}
                description="Running now"
                icon={TrendingUp}
              />
              <StatsCard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                description="From referrals"
                icon={TrendingUp}
              />
              <StatsCard
                title="Total Transactions"
                value={allTransactions.length}
                description="All time"
                icon={LayoutDashboard}
              />
              <StatsCard
                title="Pending Approvals"
                value={pendingBills.length}
                description="Awaiting review"
                icon={Receipt}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold font-heading mb-4">Recent Approvals</h2>
              {pendingBills.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending approvals</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingBills.slice(0, 4).map((bill) => (
                    <BillApprovalCard
                      key={bill.id}
                      transaction={bill}
                      customerName="Customer"
                      onApprove={() => approveTransactionMutation.mutate(bill.id)}
                      onReject={() => rejectTransactionMutation.mutate(bill.id)}
                      onView={() => console.log("View", bill.id)}
                    />
                  ))}
                </div>
              )}
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

            {campaignsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading campaigns...</p>
            ) : campaigns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No campaigns yet. Create your first one!</p>
            ) : (
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
            )}
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            <h2 className="text-2xl font-bold font-heading">Pending Approvals</h2>
            {pendingBills.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending approvals</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingBills.map((bill) => (
                  <BillApprovalCard
                    key={bill.id}
                    transaction={bill}
                    customerName="Customer Name"
                    onApprove={() => approveTransactionMutation.mutate(bill.id)}
                    onReject={() => rejectTransactionMutation.mutate(bill.id)}
                    onView={() => console.log("View", bill.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showCampaignBuilder} onOpenChange={setShowCampaignBuilder}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <CampaignBuilder
            onSubmit={(data) => {
              createCampaignMutation.mutate({
                ...data,
                storeId,
                couponTextColor: "#ffffff",
                isActive: true,
              });
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-semibold font-heading">Campaign QR Code</h3>
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
                const svg = document.querySelector('svg');
                if (svg) {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                  const url = URL.createObjectURL(svgBlob);
                  
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    
                    canvas.toBlob((blob) => {
                      if (blob) {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `campaign-${selectedQR}-qr.png`;
                        a.click();
                      }
                    });
                  };
                  img.src = url;
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
