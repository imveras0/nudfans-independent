import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ArrowRight, Check, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CreatorSetup() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  
  const utils = trpc.useUtils();
  
  const checkUsernameMutation = trpc.onboarding.checkUsername.useQuery(
    { username: username.toLowerCase() },
    {
      enabled: username.length >= 3,
      staleTime: 1000,
    }
  );
  
  const completeMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      toast.success("Perfil criado com sucesso!");
      setLocation("/dashboard");
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

  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    
    setUsernameStatus("checking");
  }, [username]);

  useEffect(() => {
    if (checkUsernameMutation.data !== undefined) {
      setUsernameStatus(checkUsernameMutation.data.available ? "available" : "taken");
    }
  }, [checkUsernameMutation.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameStatus !== "available" || !displayName.trim()) {
      return;
    }
    
    completeMutation.mutate({
      userType: "creator",
      username: username.toLowerCase(),
      displayName: displayName.trim(),
    });
  };

  const isValidUsername = /^[a-zA-Z0-9_]+$/.test(username);

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
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-4">
              Configure seu <span className="gradient-text">perfil</span>
            </h1>
            <p className="text-muted-foreground">
              Escolha um nome de usuário único para sua página
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="seunome"
                  className="pl-8 pr-10 h-12 bg-card"
                  maxLength={30}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" && (
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  )}
                  {usernameStatus === "available" && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {usernameStatus === "taken" && (
                    <X className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </div>
              {username.length > 0 && username.length < 3 && (
                <p className="text-sm text-muted-foreground">Mínimo de 3 caracteres</p>
              )}
              {username.length >= 3 && !isValidUsername && (
                <p className="text-sm text-destructive">Apenas letras, números e underscore</p>
              )}
              {usernameStatus === "taken" && (
                <p className="text-sm text-destructive">Este nome de usuário já está em uso</p>
              )}
              {usernameStatus === "available" && (
                <p className="text-sm text-green-500">Nome de usuário disponível!</p>
              )}
              <p className="text-xs text-muted-foreground">
                Sua página será: nudfans.com/creator/{username || "seunome"}
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de exibição</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu Nome"
                className="h-12 bg-card"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Este é o nome que aparecerá no seu perfil
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={usernameStatus !== "available" || !displayName.trim() || completeMutation.isPending}
              className="w-full gradient-primary text-white border-0 hover:opacity-90 h-14 text-lg disabled:opacity-50"
            >
              {completeMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Criar Meu Perfil
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Você poderá editar essas informações depois nas configurações
          </p>
        </div>
      </main>
    </div>
  );
}
