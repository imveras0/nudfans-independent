import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Star, Shield, Sparkles, Users, DollarSign, ArrowRight, Play, Flame } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect authenticated users
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (!user.onboardingCompleted) {
        setLocation("/onboarding");
      } else if (user.userType === "creator") {
        setLocation("/dashboard");
      } else {
        setLocation("/feed");
      }
    }
  }, [loading, isAuthenticated, user, setLocation]);

  const { data: creators } = trpc.creator.list.useQuery({ limit: 6 });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="/nudfans-icon.png" alt="NudFans" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-bold gradient-text">NudFans</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={getLoginUrl()} className="hidden sm:block">
              <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                Entrar
              </Button>
            </Link>
            <Link href={getLoginUrl()}>
              <Button className="gradient-primary text-white border-0 hover:opacity-90">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">A plataforma mais quente do Brasil</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Seu{" "}
              <span className="gradient-text">conteúdo exclusivo</span>
              {" "}merece valor
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Conecte-se com seus fãs mais dedicados, compartilhe conteúdo exclusivo e construa uma comunidade que valoriza seu trabalho.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={getLoginUrl()}>
                <Button size="lg" className="gradient-primary text-white border-0 hover:opacity-90 h-14 px-8 text-lg">
                  Criar Minha Conta
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-transparent">
                <Play className="w-5 h-5 mr-2" />
                Ver Como Funciona
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              <div>
                <div className="text-3xl font-bold gradient-text">10K+</div>
                <div className="text-sm text-muted-foreground">Criadoras</div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-text">500K+</div>
                <div className="text-sm text-muted-foreground">Fãs Ativos</div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-text">R$5M+</div>
                <div className="text-sm text-muted-foreground">Pagos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Por que escolher o <span className="gradient-text">NudFans</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Oferecemos as melhores ferramentas para você criar, compartilhar e monetizar seu conteúdo de forma segura e elegante.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<DollarSign className="w-6 h-6" />}
              title="Monetização Flexível"
              description="Assinaturas mensais, conteúdo pay-per-view e gorjetas. Você decide como monetizar."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Pagamentos Seguros"
              description="Processamento via Stripe com proteção total. Receba seus ganhos de forma rápida e segura."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Comunidade Engajada"
              description="Chat direto com seus fãs, notificações em tempo real e ferramentas de engajamento."
            />
            <FeatureCard
              icon={<Star className="w-6 h-6" />}
              title="Conteúdo Premium"
              description="Upload de fotos e vídeos em alta qualidade com armazenamento ilimitado na nuvem."
            />
            <FeatureCard
              icon={<Flame className="w-6 h-6" />}
              title="Relacionamento Próximo"
              description="Construa conexões genuínas com seus fãs através de mensagens e conteúdo exclusivo."
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Analytics Detalhado"
              description="Acompanhe seus ganhos, visualizações e crescimento com dashboards intuitivos."
            />
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      {creators && creators.length > 0 && (
        <section className="py-24 bg-card/50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Criadoras em <span className="gradient-text">Destaque</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Descubra criadoras incríveis e comece a apoiar o conteúdo que você ama.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link href={getLoginUrl()}>
                <Button size="lg" variant="outline" className="bg-transparent">
                  Ver Todas as Criadoras
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Pronta para começar sua jornada?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Junte-se a milhares de criadoras que já estão monetizando seu conteúdo no NudFans.
            </p>
            <Link href={getLoginUrl()}>
              <Button size="lg" className="gradient-primary text-white border-0 hover:opacity-90 h-14 px-10 text-lg">
                Criar Conta Gratuita
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/nudfans-icon.png" alt="NudFans" className="w-8 h-8 rounded-lg" />
              <span className="font-semibold gradient-text">NudFans</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 NudFans. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border hover-lift">
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function CreatorCard({ creator }: { creator: any }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-card border border-border hover-lift">
      {/* Cover */}
      <div className="h-24 bg-gradient-to-r from-primary/50 to-accent/50">
        {creator.coverUrl && (
          <img src={creator.coverUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      
      {/* Avatar */}
      <div className="absolute top-12 left-4">
        <div className={`w-20 h-20 rounded-full border-4 border-card overflow-hidden ${creator.isVerified ? 'avatar-verified' : ''}`}>
          {creator.avatarUrl ? (
            <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full gradient-primary flex items-center justify-center text-white text-2xl font-bold">
              {creator.displayName?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="pt-12 p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold">{creator.displayName}</h3>
          {creator.isVerified && (
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">@{creator.username}</p>
        {creator.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{creator.bio}</p>
        )}
        <Link href={getLoginUrl()}>
          <Button className="w-full gradient-primary text-white border-0 hover:opacity-90">
            Ver Perfil
          </Button>
        </Link>
      </div>
    </div>
  );
}
