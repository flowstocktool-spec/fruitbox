import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy } from "lucide-react";
import type { Campaign, Customer } from "@shared/schema";

interface CouponDisplayProps {
  campaign: Campaign;
  customer: Customer;
  onShare?: () => void;
}

export function CouponDisplay({ campaign, customer, onShare }: CouponDisplayProps) {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(customer.referralCode);
    console.log("Copied referral code");
  };

  // Provide default values for campaign properties
  const couponColor = campaign.couponColor || "#2563eb";
  const couponTextColor = campaign.couponTextColor || "#ffffff";
  const pointsPerDollar = campaign.pointsPerDollar || 1;
  const discountPercentage = campaign.discountPercentage || 10;

  return (
    <Card 
      className="overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${couponColor} 0%, ${couponColor}ee 100%)`,
      }}
      data-testid="card-coupon"
    >
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div>
            <h3 
              className="text-2xl font-bold font-heading mb-2"
              style={{ color: couponTextColor }}
            >
              {campaign.name}
            </h3>
            <p 
              className="text-sm opacity-90"
              style={{ color: couponTextColor }}
            >
              Share and earn {pointsPerDollar} points per $1 spent
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg inline-block" data-testid="qr-code-container">
            <QRCodeSVG
              value={`${window.location.origin}/shared/${customer.referralCode}`}
              size={180}
              level="M"
              includeMargin={false}
            />
          </div>

          <div>
            <p 
              className="text-xs mb-2 opacity-75"
              style={{ color: couponTextColor }}
            >
              Your Referral Code
            </p>
            <div className="flex items-center justify-center gap-2">
              <code 
                className="text-2xl font-bold font-mono px-4 py-2 rounded-md bg-white/20"
                style={{ color: couponTextColor }}
                data-testid="text-referral-code"
              >
                {customer.referralCode}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCode}
                className="text-white hover:bg-white/20"
                data-testid="button-copy-code"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={onShare}
            className="w-full bg-white/20 hover:bg-white/30 border-white/30"
            style={{ color: couponTextColor }}
            data-testid="button-share-coupon"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share with Friends
          </Button>

          <p 
            className="text-xs opacity-75 mt-4"
            style={{ color: couponTextColor }}
          >
            Friends get {discountPercentage}% off their first purchase
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
