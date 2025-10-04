import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, TrendingUp } from "lucide-react";
import type { Campaign } from "@shared/schema";

interface CampaignCardProps {
  campaign: Campaign;
  onViewQR?: () => void;
  onSettings?: () => void;
}

export function CampaignCard({ campaign, onViewQR, onSettings }: CampaignCardProps) {
  return (
    <Card data-testid={`card-campaign-${campaign.id}`} className="hover-elevate">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="font-heading truncate" data-testid={`text-campaign-name-${campaign.id}`}>
              {campaign.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {campaign.description || "No description"}
            </CardDescription>
          </div>
          <Badge variant={campaign.isActive ? "default" : "secondary"} data-testid={`badge-campaign-status-${campaign.id}`}>
            {campaign.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Earn {(campaign as any).pointsPercentage || 5}% points on purchases</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Min Purchase</p>
              <p className="font-bold">${campaign.minPurchaseAmount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Referral Discount</p>
              <p className="font-bold text-blue-600">{(campaign as any).referralDiscountPercentage || 10}%</p>
            </div>
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Redeem: {(campaign as any).pointsRedemptionValue || 100} pts = {(campaign as any).pointsRedemptionDiscount || 10}% off</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onSettings} data-testid={`button-settings-${campaign.id}`}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </CardFooter>
    </Card>
  );
}