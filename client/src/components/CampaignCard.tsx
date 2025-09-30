import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Settings, TrendingUp } from "lucide-react";
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
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Points per $1</span>
            <span className="font-medium" data-testid={`text-points-rate-${campaign.id}`}>
              {campaign.pointsPerDollar} pts
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Min. Purchase</span>
            <span className="font-medium" data-testid={`text-min-purchase-${campaign.id}`}>
              ${campaign.minPurchaseAmount}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Referral Discount</span>
            <span className="font-medium" data-testid={`text-discount-${campaign.id}`}>
              {campaign.discountPercentage}%
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-between">
        <Button variant="outline" size="sm" onClick={onViewQR} data-testid={`button-view-qr-${campaign.id}`}>
          <QrCode className="h-4 w-4 mr-2" />
          QR Code
        </Button>
        <Button variant="ghost" size="sm" onClick={onSettings} data-testid={`button-settings-${campaign.id}`}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
