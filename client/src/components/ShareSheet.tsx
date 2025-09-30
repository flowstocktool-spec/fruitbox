import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Mail, Copy, Share2 } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiX } from "react-icons/si";

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode: string;
  campaignName: string;
  discountPercentage: number;
}

export function ShareSheet({ open, onOpenChange, referralCode, campaignName, discountPercentage }: ShareSheetProps) {
  const shareUrl = `${window.location.origin}/join/${referralCode}`;
  const shareText = `Check out ${campaignName}! Use my referral code ${referralCode} when you visit and get ${discountPercentage}% off! Download the app: ${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    console.log("Copied to clipboard");
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, '_blank');
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(campaignName)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaignName,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-share-sheet">
        <DialogHeader>
          <DialogTitle className="font-heading">Share Your Referral</DialogTitle>
          <DialogDescription>
            Invite friends and earn rewards when they make a purchase
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
              Copy Link
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
            <p className="text-sm text-muted-foreground mb-1">Share this message:</p>
            <p className="text-sm font-medium" data-testid="text-share-message">
              {shareText}
            </p>
            <p className="text-xs text-muted-foreground mt-2 break-all">
              {shareUrl}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}