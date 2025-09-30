
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutDashboard, Receipt, TrendingUp, Users, Search, Trophy, Star } from "lucide-react";
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
import { format } from "date-fns";

export default function StoreDashboard() {
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [selectedCampaignForSettings, setSelectedCampaignForSettings] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState("");
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

  const { data: allCustomers = [] } = useQuery({
    queryKey: ['/api/customers', 'all'],
    queryFn: async () => {
      if (campaigns.length === 0) return [];
      const customers = await Promise.all(
        campaigns.map(async (campaign) => {
          const response = await fetch(`/api/customers/campaign/${campaign.id}`);
          if (!response.ok) return [];
          return response.json();
        })
      );
      return customers.flat();
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

  // Calculate customer analytics
  const customersWithAnalytics = allCustomers.map(customer => {
    const customerTransactions = allTransactions.filter(t => t.customerId === customer.id);
    const totalSpent = customerTransactions
      .filter(t => t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);
    const referralCount = customerTransactions.filter(t => t.type === 'referral' && t.status === 'approved').length;
    
    return {
      ...customer,
      totalSpent,
      referralCount,
      lastActivity: customerTransactions.length > 0 
        ? new Date(Math.max(...customerTransactions.map(t => new Date(t.createdAt).getTime())))
        : new Date(customer.createdAt)
    };
  });

  // Filter customers based on search
  const filteredCustomers = customersWithAnalytics.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch) ||
    customer.referralCode.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Sort customers by total points for top performers
  const topPerformers = [...customersWithAnalytics]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10);

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
            <TabsTrigger value="customers" data-testid="tab-customers">
              <Users className="h-4 w-4 mr-2" />
              Customers
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {allCustomers.length}
              </span>
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
                title="Total Customers"
                value={allCustomers.length}
                description="Registered users"
                icon={Users}
              />
              <StatsCard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                description="From referrals"
                icon={TrendingUp}
              />
              <StatsCard
                title="Pending Approvals"
                value={pendingBills.length}
                description="Awaiting review"
                icon={Receipt}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Customers with highest points</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.slice(0, 5).map((customer, index) => (
                      <div key={customer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.referralCode}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{customer.totalPoints}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Recent Approvals</CardTitle>
                  <CardDescription>Latest transaction requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingBills.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending approvals</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingBills.slice(0, 3).map((bill) => {
                        const customer = allCustomers.find(c => c.id === bill.customerId);
                        return (
                          <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{customer?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">${bill.amount}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => approveTransactionMutation.mutate(bill.id)}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => rejectTransactionMutation.mutate(bill.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
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
                    onSettings={() => setSelectedCampaignForSettings(campaign)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-heading">Customer Database</h2>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => {
                const campaign = campaigns.find(c => c.id === customer.campaignId);
                return (
                  <Card key={customer.id} className="hover-elevate">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-heading">{customer.name}</CardTitle>
                          <CardDescription>{customer.phone}</CardDescription>
                        </div>
                        {customer.totalPoints > 1000 && (
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Points Earned</p>
                          <p className="font-bold text-primary">{customer.totalPoints}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Points Redeemed</p>
                          <p className="font-bold">{customer.redeemedPoints}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Spent</p>
                          <p className="font-bold">${customer.totalSpent}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Referrals</p>
                          <p className="font-bold">{customer.referralCount}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Referral Code</span>
                          <Badge variant="outline">{customer.referralCode}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-muted-foreground">Campaign</span>
                          <span>{campaign?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-muted-foreground">Last Activity</span>
                          <span>{format(customer.lastActivity, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredCustomers.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                {customerSearch ? 'No customers found matching your search.' : 'No customers yet.'}
              </p>
            )}
          </TabsContent>

          <TabsContent value="approvals" className="space-y-4">
            <h2 className="text-2xl font-bold font-heading">Pending Approvals</h2>
            {pendingBills.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending approvals</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingBills.map((bill) => {
                  const customer = allCustomers.find(c => c.id === bill.customerId);
                  return (
                    <BillApprovalCard
                      key={bill.id}
                      transaction={bill}
                      customerName={customer?.name || 'Unknown Customer'}
                      onApprove={() => approveTransactionMutation.mutate(bill.id)}
                      onReject={() => rejectTransactionMutation.mutate(bill.id)}
                      onView={() => console.log("View", bill.id)}
                    />
                  );
                })}
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
                value={`${window.location.origin}/customer`}
                size={250}
                level="H"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Customers can scan this QR code to install the PWA and create their account
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

      <Dialog open={!!selectedCampaignForSettings} onOpenChange={() => setSelectedCampaignForSettings(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold font-heading mb-4">Campaign Settings</h3>
          {selectedCampaignForSettings && (
            <CampaignBuilder
              defaultValues={{
                name: selectedCampaignForSettings.name,
                description: selectedCampaignForSettings.description || "",
                pointsPerDollar: selectedCampaignForSettings.pointsPerDollar,
                minPurchaseAmount: selectedCampaignForSettings.minPurchaseAmount,
                discountPercentage: selectedCampaignForSettings.discountPercentage,
                couponColor: selectedCampaignForSettings.couponColor,
              }}
              onSubmit={(data) => {
                // TODO: Implement campaign update API
                console.log("Update campaign:", selectedCampaignForSettings.id, data);
                setSelectedCampaignForSettings(null);
                toast({
                  title: "Settings updated!",
                  description: "Campaign settings have been updated.",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
