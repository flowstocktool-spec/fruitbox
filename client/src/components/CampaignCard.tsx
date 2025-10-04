import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, TrendingUp, Trash2 } from "lucide-react";
import type { Campaign } from "@shared/schema";

interface CampaignCardProps {
  campaign: Campaign;
  onViewQR?: () => void;
  onSettings?: () => void;
  onDelete?: () => void;
}

export function CampaignCard({ campaign, onViewQR, onSettings, onDelete }: CampaignCardProps) {
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
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Points Earning Rules
            </h4>
            <div className="space-y-1">
              {((campaign as any).pointRules || [{ minAmount: 0, maxAmount: 999999, points: 10 }]).map((rule: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-xs bg-white dark:bg-green-900/20 rounded px-2 py-1">
                  <span className="font-medium">Spend ${rule.minAmount} - ${rule.maxAmount}</span>
                  <span className="font-bold text-green-600 dark:text-green-400">Earn {rule.points} points</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Min Purchase</p>
              <p className="font-bold text-lg">${campaign.minPurchaseAmount}</p>
            </div>
            <div className="space-y-1 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">New Customer Gets</p>
              <p className="font-bold text-lg text-purple-600 dark:text-purple-400">{(campaign as any).referralDiscountPercentage || 10}% OFF</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <h4 className="font-semibold text-sm mb-2">Points Redemption</h4>
            <div className="flex items-center justify-between text-xs bg-white dark:bg-orange-900/20 rounded px-2 py-1">
              <span className="font-medium">{(campaign as any).pointsRedemptionValue || 100} points</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">= {(campaign as any).pointsRedemptionDiscount || 10}% discount</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onSettings} data-testid={`button-settings-${campaign.id}`}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) {
              onDelete?.();
            }
          }} 
          data-testid={`button-delete-${campaign.id}`}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}