import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCampaign, createCustomer, generateReferralCode } from "@/lib/api";
import { Gift, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JoinCampaign() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['/api/campaigns', campaignId],
    queryFn: () => getCampaign(campaignId!),
    enabled: !!campaignId,
  });

  const joinCampaignMutation = useMutation({
    mutationFn: async () => {
      const code = await generateReferralCode();
      return createCustomer({
        campaignId: campaignId!,
        name,
        phone,
        referralCode: code,
        totalPoints: 0,
        redeemedPoints: 0,
      });
    },
    onSuccess: (customer) => {
      toast({
        title: "Welcome!",
        description: "You've successfully joined the campaign!",
      });
      setLocation(`/customer/${customer.referralCode}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="font-heading">Campaign Not Found</CardTitle>
            <CardDescription>This campaign doesn't exist or is no longer active.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-2/20 to-chart-4/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-chart-2/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-chart-2" />
          </div>
          <CardTitle className="text-2xl font-heading" data-testid="text-campaign-name">
            {campaign.name}
          </CardTitle>
          <CardDescription>{campaign.description || "Join our referral program!"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">What you get:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-1.5" />
                <span>Earn {campaign.pointsPerDollar} points for every $1 your referrals spend</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-1.5" />
                <span>Your friends get {campaign.discountPercentage}% off their first purchase</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-1.5" />
                <span>Redeem points for exclusive rewards</span>
              </li>
            </ul>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name && phone) {
                joinCampaignMutation.mutate();
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                data-testid="input-phone"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={joinCampaignMutation.isPending || !name || !phone}
              data-testid="button-join"
            >
              {joinCampaignMutation.isPending ? "Joining..." : "Join Campaign"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            By joining, you'll receive a unique referral code to share with friends and family
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
