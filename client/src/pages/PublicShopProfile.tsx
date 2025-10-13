
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Store, MapPin, Phone, Mail, Globe, Clock, Share2, 
  Award, TrendingUp, ExternalLink, ArrowLeft, Star, Users
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header with back button */}
      <div className="bg-white/80 dark:bg-gray-950/80 border-b sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Hero Section - Instagram/Facebook style */}
        <Card className="overflow-hidden border-0 shadow-2xl">
          {/* Cover Image */}
          <div className="h-48 sm:h-64 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 relative">
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          {/* Profile Section */}
          <CardContent className="relative pt-0 pb-6 px-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-16 sm:-mt-20">
              {/* Profile Picture */}
              {shop.logo ? (
                <img
                  src={shop.logo}
                  alt={shop.shopName}
                  className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border-4 border-white dark:border-gray-950 bg-white object-cover shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className={`h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border-4 border-white dark:border-gray-950 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl ${shop.logo ? "hidden" : ""}`}>
                <Store className="h-14 w-14 sm:h-20 sm:w-20 text-white" />
              </div>
              
              {/* Shop Info */}
              <div className="flex-1 mt-4 sm:mt-0 sm:pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-1" data-testid="text-shop-name">
                      {shop.shopName}
                    </h1>
                    {shop.category && (
                      <p className="text-muted-foreground text-sm" data-testid="badge-category">
                        {shop.category}
                      </p>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg w-full sm:w-auto"
                    onClick={() => navigate("/")}
                    data-testid="button-get-started"
                  >
                    Join Rewards
                  </Button>
                </div>
                
                {/* Stats Row */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">{activeCampaigns.length}</div>
                    <div className="text-xs text-muted-foreground">Programs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      4.8
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  {shop.businessType && (
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs" data-testid="badge-business-type">
                        {shop.businessType === "physical" && "In-Store"}
                        {shop.businessType === "online" && "Online"}
                        {shop.businessType === "both" && "Hybrid"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Description */}
                {shop.description && (
                  <p className="text-muted-foreground mt-4 text-sm leading-relaxed" data-testid="text-description">
                    {shop.description}
                  </p>
                )}

                {/* Social Links */}
                {Object.keys(socialLinks).some(key => socialLinks[key]) && (
                  <div className="flex items-center gap-2 mt-4">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                      if (!url) return null;
                      return (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 rounded-full hover:bg-muted transition-all ${getSocialColor(platform)}`}
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
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Active Campaigns */}
            {activeCampaigns.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-primary" />
                    Reward Programs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeCampaigns.map((campaign: any) => (
                    <div key={campaign.id} className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border border-green-200 dark:border-green-800" data-testid={`campaign-${campaign.id}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-base">{campaign.name}</h4>
                        <Badge className="bg-green-600">Active</Badge>
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground mb-3">{campaign.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">New customer</p>
                          <p className="font-bold text-green-600">{(campaign as any).referralDiscountPercentage}% OFF</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Min. purchase</p>
                          <p className="font-bold">{shop.currencySymbol}{campaign.minPurchaseAmount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Contact & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shop.address && (
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid="contact-address">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Address</p>
                      <p className="text-muted-foreground text-sm">{shop.address}</p>
                    </div>
                  </div>
                )}
                
                {shop.phone && (
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid="contact-phone">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Phone</p>
                      <a href={`tel:${shop.phone}`} className="text-primary hover:underline text-sm">
                        {shop.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {shop.email && (
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid="contact-email">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Email</p>
                      <a href={`mailto:${shop.email}`} className="text-primary hover:underline text-sm">
                        {shop.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {shop.website && (
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid="contact-website">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Website</p>
                      <a 
                        href={shop.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        {shop.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Business Hours */}
          <div>
            <Card className="shadow-lg sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  Business Hours
                </CardTitle>
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
                          className={`flex justify-between items-center py-2 px-3 rounded-lg transition-colors ${
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
                  <p className="text-muted-foreground text-sm text-center py-4">No business hours set</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
