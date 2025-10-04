import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Receipt } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveTransaction, rejectTransaction } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@shared/schema";
import { format } from "date-fns";

interface BillApprovalCardProps {
  transaction: Transaction;
  customerName: string;
  onApprove?: () => void;
  onReject?: () => void;
  onView?: () => void;
}

export function BillApprovalCard({ transaction, customerName, onApprove, onReject, onView }: BillApprovalCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fraud detection indicators
  const isHighAmount = transaction.amount > 1000;
  const isVeryRecent = new Date().getTime() - new Date(transaction.createdAt).getTime() < 60000; // Less than 1 minute

  const approveMutation = useMutation({
    mutationFn: () => approveTransaction(transaction.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      toast({
        title: "Transaction Approved",
        description: "Points have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectTransaction(transaction.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Transaction Rejected",
        description: "Transaction has been rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card data-testid={`card-bill-${transaction.id}`} className="hover-elevate">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base font-heading" data-testid={`text-customer-name-${transaction.id}`}>
              {customerName}
            </CardTitle>
            <CardDescription className="mt-1">
              {format(transaction.createdAt, "MMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </div>
          <Badge variant={
            transaction.status === "approved" ? "default" :
            transaction.status === "rejected" ? "destructive" :
            "secondary"
          } data-testid={`badge-status-${transaction.id}`}>
            {transaction.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Fraud Warning Indicators */}
          {(isHighAmount || !transaction.billImageUrl) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">⚠️ Review Carefully</p>
              <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                {isHighAmount && <li>• High purchase amount - verify bill authenticity</li>}
                {!transaction.billImageUrl && <li>• No bill image provided - request proof</li>}
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Purchase Amount</span>
            <span className={`font-semibold ${isHighAmount ? 'text-yellow-600' : ''}`} data-testid={`text-amount-${transaction.id}`}>
              ${transaction.amount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Points to Award</span>
            <span className="font-semibold text-chart-1" data-testid={`text-points-${transaction.id}`}>
              {transaction.points} pts
            </span>
          </div>
          
          {/* Fraud Prevention Checklist */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">✓ Verification Checklist:</p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>□ Bill image is clear and readable</li>
              <li>□ Shows your store name/logo</li>
              <li>□ Amount matches the bill image</li>
              <li>□ Date is recent and reasonable</li>
              <li>□ Not a duplicate submission</li>
            </ul>
          </div>
          
          {transaction.billImageUrl && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Bill Image:</p>
              <img
                src={transaction.billImageUrl}
                alt="Bill"
                className="w-full h-32 object-cover rounded-md border"
                data-testid={`img-bill-${transaction.id}`}
              />
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                👁️ Click "View" to see full-size image for verification
              </p>
            </div>
          )}
        </div>
      </CardContent>
      {transaction.status === "pending" && (
        <CardFooter className="flex gap-2 justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1"
            data-testid={`button-view-bill-${transaction.id}`}
          >
            <Receipt className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => rejectMutation.mutate()}
            className="text-destructive hover:text-destructive"
            data-testid={`button-reject-${transaction.id}`}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => approveMutation.mutate()}
            className="flex-1"
            data-testid={`button-approve-${transaction.id}`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}