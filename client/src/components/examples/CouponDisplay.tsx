import { CouponDisplay } from "../CouponDisplay";

export default function CouponDisplayExample() {
  const campaign = {
    id: "1",
    storeId: "store-1",
    name: "Summer Rewards",
    description: "Earn points on every purchase!",
    pointsPerDollar: 5,
    minPurchaseAmount: 25,
    discountPercentage: 10,
    couponColor: "#7c3aed",
    couponTextColor: "#ffffff",
    isActive: true,
    createdAt: new Date(),
  };

  const customer = {
    id: "cust-1",
    campaignId: "1",
    name: "Alex Rivera",
    phone: "+1234567890",
    referralCode: "ALEX2024",
    totalPoints: 1250,
    redeemedPoints: 500,
    createdAt: new Date(),
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <CouponDisplay
        campaign={campaign}
        customer={customer}
        onShare={() => console.log("Share clicked")}
      />
    </div>
  );
}
