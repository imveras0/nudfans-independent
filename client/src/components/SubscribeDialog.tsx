import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, Check, Loader2, CreditCard } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creator: any;
}

export function SubscribeDialog({ open, onOpenChange, creator }: SubscribeDialogProps) {
  const checkoutMutation = trpc.payment.createSubscriptionCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecionando para o checkout...");
        window.open(data.checkoutUrl, "_blank");
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleSubscribe = () => {
    checkoutMutation.mutate({ creatorId: creator.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Assinar {creator.displayName}</DialogTitle>
          <DialogDescription className="text-center">
            Tenha acesso a todo o conteúdo exclusivo
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {/* Creator info */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {creator.displayName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold">{creator.displayName}</div>
              <div className="text-sm text-muted-foreground">@{creator.username}</div>
            </div>
          </div>
          
          {/* Price */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold gradient-text mb-1">
              R$ {creator.subscriptionPrice || "9.99"}
            </div>
            <div className="text-muted-foreground">por mês</div>
          </div>
          
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm">Acesso a todos os posts exclusivos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm">Chat direto com a criadora</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm">Conteúdo novo toda semana</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm">Cancele quando quiser</span>
            </div>
          </div>
          
          {/* Subscribe button */}
          <Button 
            onClick={handleSubscribe}
            disabled={checkoutMutation.isPending}
            className="w-full gradient-primary text-white border-0 hover:opacity-90 h-12"
          >
            {checkoutMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Assinar Agora
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            Ao assinar, você concorda com nossos termos de serviço.
            Pagamento processado de forma segura via Stripe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
