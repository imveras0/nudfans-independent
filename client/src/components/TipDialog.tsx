import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Heart, CreditCard } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creator: any;
  postId?: number;
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

export function TipDialog({ open, onOpenChange, creator, postId }: TipDialogProps) {
  const [amount, setAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  
  const checkoutMutation = trpc.payment.createTipCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecionando para o checkout...");
        window.open(data.checkoutUrl, "_blank");
        onOpenChange(false);
        setAmount(10);
        setCustomAmount("");
        setMessage("");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleSend = () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!finalAmount || finalAmount < 1) {
      toast.error("Valor mínimo é R$ 1,00");
      return;
    }
    
    checkoutMutation.mutate({
      creatorId: creator.id,
      amount: finalAmount,
      message: message || undefined,
      postId,
    });
  };
  
  const handleQuickAmount = (value: number) => {
    setAmount(value);
    setCustomAmount("");
  };
  
  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount(0);
  };

  const displayAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Enviar Gorjeta</DialogTitle>
          <DialogDescription className="text-center">
            Mostre seu apoio para {creator.displayName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Creator info */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center text-white text-xl font-bold">
                  {creator.displayName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold">{creator.displayName}</div>
              <div className="text-sm text-muted-foreground">@{creator.username}</div>
            </div>
          </div>
          
          {/* Quick amounts */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {QUICK_AMOUNTS.map((value) => (
              <Button
                key={value}
                variant={amount === value && !customAmount ? "default" : "outline"}
                className={amount === value && !customAmount ? "gradient-primary text-white border-0" : "bg-transparent"}
                onClick={() => handleQuickAmount(value)}
              >
                R${value}
              </Button>
            ))}
          </div>
          
          {/* Custom amount */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="Outro valor"
              className="pl-10 h-12 bg-card"
              min={1}
            />
          </div>
          
          {/* Message */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Adicionar uma mensagem (opcional)"
            className="mb-4 bg-card resize-none"
            rows={3}
            maxLength={500}
          />
          
          {/* Total */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted mb-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-2xl font-bold gradient-text">
              R$ {displayAmount.toFixed(2)}
            </span>
          </div>
          
          {/* Send button */}
          <Button 
            onClick={handleSend}
            disabled={checkoutMutation.isPending || displayAmount < 1}
            className="w-full gradient-primary text-white border-0 hover:opacity-90 h-12"
          >
            {checkoutMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Enviar R$ {displayAmount.toFixed(2)}
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            Pagamento processado de forma segura via Stripe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
