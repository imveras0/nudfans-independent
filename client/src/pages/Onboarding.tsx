import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Camera, Users, ArrowRight, Flame } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<"fan" | "creator" | null>(null);
  
  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      if (selectedType === "creator") {
        setLocation("/creator-setup");
      } else {
        setLocation("/feed");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    } else if (!loading && user?.onboardingCompleted) {
      if (user.userType === "creator") {
        setLocation("/dashboard");
      } else {
        setLocation("/feed");
      }
    }
  }, [loading, user, setLocation]);

  const handleContinue = () => {
    if (!selectedType) return;
    
    if (selectedType === "creator") {
      setLocation("/creator-setup");
    } else {
      completeMutation.mutate({ userType: "fan" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center gap-2">
          <img src="/nudfans-icon.png" alt="NudFans" className="w-10 h-10 rounded-xl" />
          <span className="text-xl font-bold gradient-text">NudFans</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Bem-vinda ao NudFans!</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Como você quer usar o <span className="gradient-text">NudFans</span>?
            </h1>
            <p className="text-muted-foreground">
              Escolha seu perfil para personalizar sua experiência
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {/* Creator Option */}
            <button
              onClick={() => setSelectedType("creator")}
              className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                selectedType === "creator"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {selectedType === "creator" && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-white mb-4">
                <Camera className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">Sou Criadora</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Quero compartilhar conteúdo exclusivo e monetizar meu trabalho
              </p>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Crie posts exclusivos
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Receba assinaturas e gorjetas
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Converse com seus fãs
                </li>
              </ul>
            </button>

            {/* Fan Option */}
            <button
              onClick={() => setSelectedType("fan")}
              className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                selectedType === "fan"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {selectedType === "fan" && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-white mb-4">
                <Users className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">Sou Fã</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Quero descobrir e apoiar criadoras incríveis
              </p>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Descubra criadoras
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Acesse conteúdo exclusivo
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Apoie quem você admira
                </li>
              </ul>
            </button>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              disabled={!selectedType || completeMutation.isPending}
              onClick={handleContinue}
              className="gradient-primary text-white border-0 hover:opacity-90 h-14 px-10 text-lg disabled:opacity-50"
            >
              {completeMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
