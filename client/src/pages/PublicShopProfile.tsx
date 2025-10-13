import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Store, MapPin, Phone, Mail, Globe, Clock, Share2, 
  Award, TrendingUp, ExternalLink, ArrowLeft 
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading shop profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
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
      facebook: "text-blue-600 hover:text-blue-700",
      instagram: "text-pink-600 hover:text-pink-700",
      twitter: "text-gray-900 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white",
      linkedin: "text-blue-700 hover:text-blue-800",
      tiktok: "text-gray-900 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white",
      youtube: "text-red-600 hover:text-red-700",
    };
    return colors[platform] || "text-gray-600 hover:text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="mb-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Shop Header Card */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16">
              {shop.logo ? (
                <img
                  src={shop.logo}
                  alt={shop.shopName}
                  className="h-32 w-32 rounded-xl border-4 border-white dark:border-gray-950 bg-white object-cover shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = "";
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="h-32 w-32 rounded-xl border-4 border-white dark:border-gray-950 bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                  <Store className="h-16 w-16 text-white" />
                </div>
              )}
              
              <div className="flex-1 space-y-2 pb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold font-heading" data-testid="text-shop-name">
                    {shop.shopName}
                  </h1>
                  {shop.category && (
                    <Badge variant="secondary" className="text-sm" data-testid="badge-category">
                      {shop.category}
                    </Badge>
                  )}
                </div>
                {shop.description && (
                  <p className="text-muted-foreground max-w-2xl" data-testid="text-description">
                    {shop.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {shop.businessType && (
                    <Badge variant="outline" data-testid="badge-business-type">
                      {shop.businessType === "physical" && "Physical Store"}
                      {shop.businessType === "online" && "Online Store"}
                      {shop.businessType === "both" && "Physical & Online"}
                    </Badge>
                  )}
                  {shop.taxId && (
                    <Badge variant="outline" className="gap-1" data-testid="badge-verified">
                      <Award className="h-3 w-3" />
                      Verified Business
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info & Hours Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shop.address && (
                <div className="flex items-start gap-3" data-testid="contact-address">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{shop.address}</p>
                  </div>
                </div>
              )}
              
              {shop.phone && (
                <div className="flex items-start gap-3" data-testid="contact-phone">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <a href={`tel:${shop.phone}`} className="text-primary hover:underline">
                      {shop.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {shop.email && (
                <div className="flex items-start gap-3" data-testid="contact-email">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a href={`mailto:${shop.email}`} className="text-primary hover:underline">
                      {shop.email}
                    </a>
                  </div>
                </div>
              )}
              
              {shop.website && (
                <div className="flex items-start gap-3" data-testid="contact-website">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Website</p>
                    <a 
                      href={shop.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {shop.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Social Media Links */}
              {Object.keys(socialLinks).some(key => socialLinks[key]) && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium mb-3 flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Follow Us
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                          <a
                            key={platform}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-lg border hover:bg-muted transition-colors ${getSocialColor(platform)}`}
                            data-testid={`link-social-${platform}`}
                          >
                            {getSocialIcon(platform)}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(businessHours).length > 0 ? (
                <div className="space-y-2">
                  {DAYS.map((day) => {
                    const hours = businessHours[day];
                    if (!hours) return null;
                    
                    const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                    
                    return (
                      <div 
                        key={day} 
                        className={`flex justify-between items-center py-2 px-3 rounded ${
                          isToday ? 'bg-primary/10 font-medium' : ''
                        }`}
                        data-testid={`hours-${day}`}
                      >
                        <span className="capitalize">{day}</span>
                        <span className={hours.closed ? 'text-muted-foreground' : ''}>
                          {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No business hours set</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Campaigns */}
        {activeCampaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Active Reward Programs
              </CardTitle>
              <CardDescription>Join our loyalty programs and start earning rewards!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCampaigns.map((campaign: any) => (
                  <Card key={campaign.id} className="border-2 hover:border-primary/50 transition-colors" data-testid={`campaign-${campaign.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                      <CardDescription>{campaign.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Earn Points
                        </h4>
                        <div className="space-y-1">
                          {((campaign as any).pointRules || [{ minAmount: 0, maxAmount: 999999, points: 10 }]).map((rule: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-white dark:bg-green-900/20 rounded px-2 py-1">
                              <span>Spend {shop.currencySymbol}{rule.minAmount} - {shop.currencySymbol}{rule.maxAmount}</span>
                              <span className="font-bold text-green-600 dark:text-green-400">+{rule.points} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted rounded p-2">
                          <p className="text-xs text-muted-foreground">Min Purchase</p>
                          <p className="font-semibold">{shop.currencySymbol}{campaign.minPurchaseAmount}</p>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <p className="text-xs text-muted-foreground">Referral Bonus</p>
                          <p className="font-semibold">{(campaign as any).referralDiscountPercentage}% off</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Ready to Start Earning Rewards?</h2>
            <p className="mb-6 opacity-90">Sign up as a customer and join our loyalty program today!</p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/")}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
