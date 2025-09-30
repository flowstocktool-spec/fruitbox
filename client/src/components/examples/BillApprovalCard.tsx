import { BillApprovalCard } from "../BillApprovalCard";

export default function BillApprovalCardExample() {
  const transaction = {
    id: "txn-1",
    customerId: "cust-1",
    campaignId: "camp-1",
    type: "purchase",
    amount: 125,
    points: 625,
    status: "pending",
    billImageUrl: "https://images.unsplash.com/photo-1554224311-beee4f7a1788?w=400&h=300&fit=crop",
    createdAt: new Date(),
  };

  return (
    <div className="p-4 max-w-md space-y-4">
      <BillApprovalCard
        transaction={transaction}
        customerName="Sarah Johnson"
        onApprove={() => console.log("Approved")}
        onReject={() => console.log("Rejected")}
        onView={() => console.log("View bill")}
      />
      <BillApprovalCard
        transaction={{ ...transaction, id: "txn-2", status: "approved" }}
        customerName="Mike Chen"
      />
    </div>
  );
}
