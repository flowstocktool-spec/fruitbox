import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Purchase Amount</span>
            <span className="font-semibold" data-testid={`text-amount-${transaction.id}`}>
              ${transaction.amount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Points to Award</span>
            <span className="font-semibold text-chart-1" data-testid={`text-points-${transaction.id}`}>
              {transaction.points} pts
            </span>
          </div>
          {transaction.billImageUrl && (
            <div className="mt-3">
              <img
                src={transaction.billImageUrl}
                alt="Bill"
                className="w-full h-32 object-cover rounded-md border"
                data-testid={`img-bill-${transaction.id}`}
              />
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