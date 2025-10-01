import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Copy, Share2, Loader2 } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiX } from "react-icons/si";
import { QRCodeSVG } from "qrcode.react";

interface CouponShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareToken: string | null;
  shopName: string;
  loading?: boolean;
}

export function CouponShareSheet({ open, onOpenChange, shareToken, shopName, loading }: CouponShareSheetProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = shareToken ? `${window.location.origin}/shared-coupon/${shareToken}` : '';
  const shareText = `I'm sharing my ${shopName} coupon with you! Click the link to claim it and start shopping at a discount: ${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(`${shopName} Coupon`)}&body=${encodeURIComponent(shareText)}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${shopName} Coupon`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Creating share link...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-coupon-share-sheet">
        <DialogHeader>
          <DialogTitle className="font-heading">Share Your Coupon</DialogTitle>
          <DialogDescription>
            Share this {shopName} coupon with friends so they can shop at a discount
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG value={shareUrl} size={200} level="H" />
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-full flex-col gap-1"
              onClick={handleWhatsApp}
              data-testid="button-share-whatsapp"
            >
              <SiWhatsapp className="h-5 w-5" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-full flex-col gap-1"
              onClick={handleFacebook}
              data-testid="button-share-facebook"
            >
              <SiFacebook className="h-5 w-5" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-full flex-col gap-1"
              onClick={handleTwitter}
              data-testid="button-share-twitter"
            >
              <SiX className="h-5 w-5" />
              <span className="text-xs">X</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-full flex-col gap-1"
              onClick={handleEmail}
              data-testid="button-share-email"
            >
              <Mail className="h-5 w-5" />
              <span className="text-xs">Email</span>
            </Button>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCopy}
              data-testid="button-copy-link"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            {'share' in navigator && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleNativeShare}
                data-testid="button-share-more"
              >
                <Share2 className="h-4 w-4 mr-2" />
                More Options
              </Button>
            )}
          </div>

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Share this link:</p>
            <p className="text-xs break-all font-mono bg-background p-2 rounded" data-testid="text-share-url">
              {shareUrl}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
