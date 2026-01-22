import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, CreditCard, DollarSign, Heart, Users, 
  ShoppingBag, Loader2, Receipt, Calendar, ExternalLink
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLoginUrl } from "@/const";

export default function PaymentHistory() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: subscriptions, isLoading: subsLoading } = trpc.payment.getMySubscriptions.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: purchases, isLoading: purchasesLoading } = trpc.payment.getMyPurchases.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(price));
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Ativa" },
      completed: { variant: "default", label: "Concluído" },
      pending: { variant: "secondary", label: "Pendente" },
      canceled: { variant: "outline", label: "Cancelada" },
      expired: { variant: "outline", label: "Expirada" },
      failed: { variant: "destructive", label: "Falhou" },
      refunded: { variant: "outline", label: "Reembolsado" },
    };
    
    const config = variants[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center h-14">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-2 font-semibold">Histórico de Pagamentos</h1>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Compras
            </TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Minhas Assinaturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : subscriptions && subscriptions.length > 0 ? (
                  <div className="space-y-4">
                    {subscriptions.map((sub: any) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {sub.creator?.avatarUrl ? (
                              <img
                                src={sub.creator.avatarUrl}
                                alt={sub.creator.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold">
                                {sub.creator?.displayName?.[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="font-semibold">{sub.creator?.displayName || "Criadora"}</div>
                            <div className="text-sm text-muted-foreground">
                              @{sub.creator?.username || "unknown"}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {sub.currentPeriodEnd && (
                                <>Renova em {format(new Date(sub.currentPeriodEnd), "dd/MM/yyyy", { locale: ptBR })}</>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold">{formatPrice(sub.priceAtPurchase)}/mês</div>
                          <div className="mt-1">{getStatusBadge(sub.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Você ainda não possui assinaturas</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setLocation("/explore")}
                    >
                      Descobrir Criadoras
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Minhas Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                {purchasesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : purchases && purchases.length > 0 ? (
                  <div className="space-y-4">
                    {purchases.map((purchase: any) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                            {purchase.post?.media?.[0]?.thumbnailUrl || purchase.post?.media?.[0]?.url ? (
                              <img
                                src={purchase.post.media[0].thumbnailUrl || purchase.post.media[0].url}
                                alt="Post"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="font-semibold">
                              Conteúdo PPV
                            </div>
                            <div className="text-sm text-muted-foreground">
                              De @{purchase.creator?.username || "unknown"}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(purchase.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold">{formatPrice(purchase.amount)}</div>
                          <div className="mt-1">{getStatusBadge(purchase.status)}</div>
                          {purchase.status === "completed" && purchase.post && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-1 text-xs"
                              onClick={() => setLocation(`/creator/${purchase.creator?.username}`)}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ver
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Você ainda não fez nenhuma compra</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setLocation("/explore")}
                    >
                      Descobrir Criadoras
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
