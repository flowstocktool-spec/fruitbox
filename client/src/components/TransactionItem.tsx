import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Transaction } from "@shared/schema";

interface TransactionItemProps {
  transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isEarned = transaction.type === "purchase" || transaction.type === "referral";
  const isPending = transaction.status === "pending";

  return (
    <div 
      className="flex items-center justify-between py-3 border-b last:border-0 hover-elevate rounded-md px-2 -mx-2"
      data-testid={`transaction-item-${transaction.id}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          isPending ? "bg-muted" :
          isEarned ? "bg-chart-3/20" : "bg-chart-4/20"
        }`}>
          {isPending ? (
            <Clock className="h-4 w-4 text-muted-foreground" />
          ) : isEarned ? (
            <ArrowUpRight className="h-4 w-4 text-chart-3" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-chart-4" />
          )}
        </div>
        <div>
          <p className="font-medium" data-testid={`text-transaction-type-${transaction.id}`}>
            {transaction.type === "purchase" ? "Purchase Reward" :
             transaction.type === "referral" ? "Referral Bonus" :
             transaction.type === "redemption" ? "Points Redeemed" :
             transaction.type}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(transaction.createdAt, "MMM d, yyyy")}
            {isPending && " • Pending"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${
          isPending ? "text-muted-foreground" :
          isEarned ? "text-chart-3" : "text-chart-4"
        }`} data-testid={`text-transaction-points-${transaction.id}`}>
          {isEarned ? "+" : "-"}{transaction.points} pts
        </p>
        {transaction.amount > 0 && (
          <p className="text-sm text-muted-foreground">
            ${transaction.amount}
          </p>
        )}
      </div>
    </div>
  );
}
