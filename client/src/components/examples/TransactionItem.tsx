import { TransactionItem } from "../TransactionItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TransactionItemExample() {
  const transactions = [
    {
      id: "1",
      customerId: "c1",
      campaignId: "camp1",
      type: "purchase",
      amount: 150,
      points: 750,
      status: "approved",
      billImageUrl: null,
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      customerId: "c1",
      campaignId: "camp1",
      type: "referral",
      amount: 0,
      points: 500,
      status: "approved",
      billImageUrl: null,
      createdAt: new Date("2024-01-10"),
    },
    {
      id: "3",
      customerId: "c1",
      campaignId: "camp1",
      type: "purchase",
      amount: 85,
      points: 425,
      status: "pending",
      billImageUrl: null,
      createdAt: new Date("2024-01-12"),
    },
    {
      id: "4",
      customerId: "c1",
      campaignId: "camp1",
      type: "redemption",
      amount: 0,
      points: 1000,
      status: "approved",
      billImageUrl: null,
      createdAt: new Date("2024-01-05"),
    },
  ];

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {transactions.map((txn) => (
              <TransactionItem key={txn.id} transaction={txn} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
