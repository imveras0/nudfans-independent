import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Lock, CreditCard } from "lucide-react";

interface CardCheckoutFormProps {
  creatorId: number;
  subscriptionPrice: number;
  onSuccess: () => void;
}

export function CardCheckoutForm({
  creatorId,
  subscriptionPrice,
  onSuccess,
}: CardCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscriptionMutation = trpc.subscription.createWithCard.useMutation({
    onSuccess: () => {
      toast.success("Assinatura ativada com sucesso! 🎉");
      onSuccess();
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao processar pagamento");
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe não está carregado");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Elemento de cartão não encontrado");
      return;
    }

    setIsProcessing(true);

    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (pmError) {
        toast.error(pmError.message || "Erro ao validar cartão");
        setIsProcessing(false);
        return;
      }

      await createSubscriptionMutation.mutateAsync({
        creatorId,
        paymentMethodId: paymentMethod.id,
      });
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      toast.error(error.message || "Erro ao processar pagamento");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="card-element" className="text-sm font-medium text-zinc-300">
          Informações do Cartão
        </Label>
        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 focus-within:border-pink-500/50 transition-colors">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#fff",
                  fontFamily: '"Inter", sans-serif',
                  "::placeholder": {
                    color: "#71717a",
                  },
                },
                invalid: {
                  color: "#ef4444",
                },
              },
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Lock className="w-3 h-3" />
        <span>Pagamento seguro processado pelo Stripe</span>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold text-lg shadow-lg shadow-pink-500/25 transition-all duration-300"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Assinar por R$ {subscriptionPrice.toFixed(2)}/mês
          </>
        )}
      </Button>

      <p className="text-xs text-center text-zinc-500">
        Ao assinar, você concorda com nossos termos de serviço e política de privacidade.
        Assinatura renovada automaticamente.
      </p>
    </form>
  );
}
