
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Store, MapPin, Phone, Mail, Globe, Clock, Share2, 
  Award, TrendingUp, ExternalLink, ArrowLeft, Star, Users,
  Gift, Tag, Percent
} from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiTiktok, SiYoutube } from "react-icons/si";
import { useLocation } from "wouter";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function PublicShopProfile() {
  const params = useParams();
  const shopCode = params.shopCode;
  const [, navigate] = useLocation();

  const { data: shop, isLoading, isError } = useQuery({
    queryKey: ['/api/shop-profiles', shopCode],
    queryFn: async () => {
      const response = await fetch(`/api/shop-profiles/by-code/${shopCode}`);
      if (!response.ok) throw new Error("Shop not found");
      return response.json();
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/campaigns', { storeId: shop?.id }],
    queryFn: async () => {
      if (!shop?.id) return [];
      const response = await fetch(`/api/campaigns?storeId=${shop.id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!shop?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shop profile...</p>
        </div>
      </div>
    );
  }

  if (isError || !shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6 text-center">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Shop Not Found</h2>
            <p className="text-muted-foreground mb-4">The shop you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/")} data-testid="button-go-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCampaigns = campaigns.filter((c: any) => c.isActive);
  const businessHours = shop.businessHours || {};
  const socialLinks = shop.socialLinks || {};

  const getSocialIcon = (platform: string) => {
    const icons: any = {
      facebook: SiFacebook,
      instagram: SiInstagram,
      twitter: SiX,
      linkedin: SiLinkedin,
      tiktok: SiTiktok,
      youtube: SiYoutube,
    };
    const Icon = icons[platform];
    return Icon ? <Icon className="h-5 w-5" /> : null;
  };

  const getSocialColor = (platform: string) => {
    const colors: any = {
      facebook: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
      instagram: "text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300",
      twitter: "text-gray-900 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white",
      linkedin: "text-blue-700 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400",
      tiktok: "text-gray-900 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white",
      youtube: "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300",
    };
    return colors[platform] || "text-gray-600 hover:text-gray-700";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="bg-card/95 dark:bg-card/95 border-b sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-bold text-lg" data-testid="text-shop-name">{shop.shopName}</h2>
            {shop.category && (
              <p className="text-xs text-muted-foreground" data-testid="badge-category">{shop.category}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-56 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500"></div>
          
          {/* Profile Info Card */}
          <div className="px-4 pb-4">
            <div className="bg-card rounded-2xl shadow-xl -mt-16 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  {shop.logo ? (
                    <img
                      src={shop.logo}
                      alt={shop.shopName}
                      className="h-32 w-32 rounded-full border-4 border-card bg-card object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div className={`h-32 w-32 rounded-full border-4 border-card bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center ${shop.logo ? "hidden" : ""}`}>
                    <Store className="h-16 w-16 text-white" />
                  </div>
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl font-bold mb-1">{shop.shopName}</h1>
                      {shop.businessType && (
                        <Badge variant="outline" className="mb-2" data-testid="badge-business-type">
                          {shop.businessType === "physical" && "📍 In-Store"}
                          {shop.businessType === "online" && "🌐 Online"}
                          {shop.businessType === "both" && "🔄 Hybrid"}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => navigate("/")}
                      data-testid="button-get-started"
                    >
                      Join Rewards
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 mb-3">
                    <div>
                      <span className="font-bold text-lg">{activeCampaigns.length}</span>
                      <span className="text-sm text-muted-foreground ml-1">Rewards</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-lg">4.8</span>
                      <span className="text-sm text-muted-foreground ml-1">Rating</span>
                    </div>
                  </div>

                  {/* Description */}
                  {shop.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid="text-description">
                      {shop.description}
                    </p>
                  )}

                  {/* Social Links */}
                  {Object.keys(socialLinks).some(key => socialLinks[key]) && (
                    <div className="flex items-center gap-2">
                      {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                          <a
                            key={platform}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-full hover:bg-muted transition-colors ${getSocialColor(platform)}`}
                            data-testid={`link-social-${platform}`}
                          >
                            {getSocialIcon(platform)}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="px-4 pb-6 space-y-4">
          {/* Reward Programs */}
          {activeCampaigns.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Active Rewards</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeCampaigns.map((campaign: any) => (
                  <div key={campaign.id} className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800" data-testid={`campaign-${campaign.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground mb-3">{campaign.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Percent className="h-4 w-4 text-green-600" />
                          <p className="text-xs text-muted-foreground">New Customer</p>
                        </div>
                        <p className="font-bold text-green-600">{campaign.referralDiscountPercentage}% OFF</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Tag className="h-4 w-4 text-blue-600" />
                          <p className="text-xs text-muted-foreground">Min. Purchase</p>
                        </div>
                        <p className="font-bold">{shop.currencySymbol}{campaign.minPurchaseAmount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Contact</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {shop.address && (
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid="contact-address">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Address</p>
                      <p className="text-sm text-muted-foreground">{shop.address}</p>
                    </div>
                  </div>
                )}
                
                {shop.phone && (
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid="contact-phone">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Phone</p>
                      <a href={`tel:${shop.phone}`} className="text-sm text-primary hover:underline">
                        {shop.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {shop.email && (
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid="contact-email">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Email</p>
                      <a href={`mailto:${shop.email}`} className="text-sm text-primary hover:underline break-all">
                        {shop.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {shop.website && (
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid="contact-website">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">Website</p>
                      <a 
                        href={shop.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1 break-all"
                      >
                        {shop.website}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Hours</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {Object.keys(businessHours).length > 0 ? (
                  <div className="space-y-1">
                    {DAYS.map((day) => {
                      const hours = businessHours[day];
                      if (!hours) return null;
                      
                      const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                      
                      return (
                        <div 
                          key={day} 
                          className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                            isToday ? 'bg-primary/10 font-semibold' : 'hover:bg-muted/50'
                          }`}
                          data-testid={`hours-${day}`}
                        >
                          <span className="capitalize text-sm">{day}</span>
                          <span className={`text-sm ${hours.closed ? 'text-muted-foreground' : ''}`}>
                            {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hours set</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
