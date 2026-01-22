import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardCheckoutForm } from "./CardCheckoutForm";
import { CreditCard, Smartphone } from "lucide-react";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: number;
  creatorName: string;
  creatorUsername: string;
  subscriptionPrice: number;
}

export function SubscriptionModal({
  open,
  onOpenChange,
  creatorId,
  creatorName,
  creatorUsername,
  subscriptionPrice,
}: SubscriptionModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-zinc-900 via-zinc-900 to-pink-950/20 border-pink-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Assinar {creatorName}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            @{creatorUsername} • R$ {subscriptionPrice.toFixed(2)}/mês
          </DialogDescription>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "pix")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50">
            <TabsTrigger value="card" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              <CreditCard className="w-4 h-4 mr-2" />
              Cartão
            </TabsTrigger>
            <TabsTrigger value="pix" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
              <Smartphone className="w-4 h-4 mr-2" />
              PIX
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-6">
            <CardCheckoutForm
              creatorId={creatorId}
              subscriptionPrice={subscriptionPrice}
              onSuccess={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="pix" className="mt-6">
            <div className="text-center py-8 text-zinc-400">
              <Smartphone className="w-16 h-16 mx-auto mb-4 text-pink-400/50" />
              <p className="text-lg font-medium">PIX em breve</p>
              <p className="text-sm mt-2">
                Estamos trabalhando para adicionar pagamento via PIX
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
