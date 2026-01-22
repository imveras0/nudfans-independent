import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { 
  Home, BarChart3, Image, Settings, MessageCircle, Heart, 
  Users, DollarSign, TrendingUp, Eye, Plus, Loader2,
  Menu, X, LogOut, Camera, Upload
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PostCard } from "@/components/PostCard";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Visão Geral", icon: Home },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "posts", label: "Meus Posts", icon: Image },
  { id: "messages", label: "Mensagens", icon: MessageCircle },
  { id: "subscribers", label: "Assinantes", icon: Users },
  { id: "settings", label: "Configurações", icon: Settings },
];

export default function Dashboard() {
  const { tab } = useParams<{ tab?: string }>();
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(tab || "overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  const { data: profile, isLoading: profileLoading } = trpc.creator.getMyProfile.useQuery();
  const { data: analytics } = trpc.analytics.getDashboard.useQuery(undefined, { enabled: !!profile });
  const { data: posts, refetch: refetchPosts } = trpc.post.getByCreator.useQuery(
    { creatorId: profile?.id || 0, limit: 50 },
    { enabled: !!profile?.id }
  );
  const { data: subscribers } = trpc.subscription.getSubscribers.useQuery(
    { limit: 50 },
    { enabled: !!profile }
  );
  const { data: followers } = trpc.follow.getFollowers.useQuery(
    { limit: 50 },
    { enabled: !!profile }
  );

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/");
    } else if (!loading && user && !user.onboardingCompleted) {
      setLocation("/onboarding");
    } else if (!loading && user?.userType !== "creator") {
      setLocation("/feed");
    }
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (tab && SIDEBAR_ITEMS.some(item => item.id === tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setLocation(`/dashboard/${newTab}`);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Perfil não encontrado</h1>
          <p className="text-muted-foreground mb-4">Complete seu cadastro como criadora</p>
          <Button onClick={() => setLocation("/creator-setup")}>Criar Perfil</Button>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <img src="/nudfans-icon.png" alt="NudFans" className="w-10 h-10 rounded-xl" />
          <span className="text-xl font-bold gradient-text">NudFans</span>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold">
                {profile.displayName?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{profile.displayName}</div>
            <div className="text-sm text-muted-foreground truncate">@{profile.username}</div>
          </div>
        </div>
        <a 
          href={`/creator/${profile.username}?preview=true`}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          Ver como visitante
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "gradient-primary text-white" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
              <SheetDescription className="sr-only">Navegue pelas seções do dashboard</SheetDescription>
              <SidebarContent />
            </SheetContent>
          </Sheet>
          
          <span className="font-semibold">
            {SIDEBAR_ITEMS.find(item => item.id === activeTab)?.label}
          </span>
          
          <Button 
            size="icon" 
            className="gradient-primary text-white border-0"
            onClick={() => setShowCreatePost(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 h-screen sticky top-0 border-r border-border bg-card">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Desktop Header */}
          <header className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-border">
            <h1 className="text-xl font-semibold">
              {SIDEBAR_ITEMS.find(item => item.id === activeTab)?.label}
            </h1>
            <div className="flex items-center gap-3">
              <NotificationsDropdown />
              <Button 
                className="gradient-primary text-white border-0"
                onClick={() => setShowCreatePost(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Post
              </Button>
            </div>
          </header>

          <div className="p-4 lg:p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Ganhos Totais"
                    value={`R$ ${analytics?.earnings.total.toFixed(2) || "0.00"}`}
                    icon={DollarSign}
                    trend="+12%"
                    color="primary"
                  />
                  <StatCard
                    title="Assinantes"
                    value={analytics?.stats.subscribers || 0}
                    icon={Users}
                    trend="+5"
                    color="accent"
                  />
                  <StatCard
                    title="Seguidores"
                    value={analytics?.stats.followers || 0}
                    icon={Users}
                    trend="+23"
                    color="primary"
                  />
                  <StatCard
                    title="Visualizações"
                    value={analytics?.stats.posts || 0}
                    icon={Eye}
                    trend="+156"
                    color="accent"
                  />
                </div>

                {/* Recent Posts */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Posts Recentes</h2>
                  {posts && posts.length > 0 ? (
                    <div className="space-y-4">
                      {posts.slice(0, 3).map((post) => (
                        <PostCard 
                          key={post.id} 
                          post={post} 
                          creator={profile}
                          showCreatorInfo={false}
                          onDelete={() => refetchPosts()}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-card rounded-2xl border border-border">
                      <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Você ainda não tem posts</p>
                      <Button onClick={() => setShowCreatePost(true)} className="gradient-primary text-white border-0">
                        Criar Primeiro Post
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="text-sm text-muted-foreground mb-2">Assinaturas</h3>
                    <div className="text-2xl font-bold gradient-text">
                      R$ {analytics?.earnings.breakdown.subscription.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="text-sm text-muted-foreground mb-2">PPV</h3>
                    <div className="text-2xl font-bold gradient-text">
                      R$ {analytics?.earnings.breakdown.ppv.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h3 className="text-sm text-muted-foreground mb-2">Gorjetas</h3>
                    <div className="text-2xl font-bold gradient-text">
                      R$ {analytics?.earnings.breakdown.tips.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-semibold mb-4">Ganhos dos últimos 30 dias</h3>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mr-2" />
                    Gráfico de ganhos em breve
                  </div>
                </div>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === "posts" && (
              <div className="space-y-4">
                {posts && posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      creator={profile}
                      showCreatorInfo={false}
                      onDelete={() => refetchPosts()}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-card rounded-2xl border border-border">
                    <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Você ainda não tem posts</p>
                    <Button onClick={() => setShowCreatePost(true)} className="gradient-primary text-white border-0">
                      Criar Primeiro Post
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Mensagens</h3>
                <p className="text-muted-foreground mb-4">
                  Acesse suas conversas com assinantes
                </p>
                <Button onClick={() => setLocation("/messages")} className="gradient-primary text-white border-0">
                  Ir para Mensagens
                </Button>
              </div>
            )}

            {/* Subscribers Tab */}
            {activeTab === "subscribers" && (
              <div className="space-y-6">
                <Tabs defaultValue="subscribers">
                  <TabsList className="bg-card border border-border">
                    <TabsTrigger value="subscribers">Assinantes ({subscribers?.length || 0})</TabsTrigger>
                    <TabsTrigger value="followers">Seguidores ({followers?.length || 0})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="subscribers" className="mt-4">
                    {subscribers && subscribers.length > 0 ? (
                      <div className="bg-card rounded-2xl border border-border divide-y divide-border">
                        {subscribers.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                {sub.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <div className="font-medium">{sub.user?.name || "Usuário"}</div>
                                <div className="text-sm text-muted-foreground">
                                  Assinante desde {new Date(sub.currentPeriodEnd || "").toLocaleDateString("pt-BR")}
                                </div>
                              </div>
                            </div>
                            <span className="text-sm text-green-500">Ativo</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-card rounded-2xl border border-border">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhum assinante ainda</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="followers" className="mt-4">
                    {followers && followers.length > 0 ? (
                      <div className="bg-card rounded-2xl border border-border divide-y divide-border">
                        {followers.map((follow) => (
                          <div key={follow.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                {follow.user?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <div className="font-medium">{follow.user?.name || "Usuário"}</div>
                                <div className="text-sm text-muted-foreground">
                                  Seguindo desde {new Date(follow.createdAt).toLocaleDateString("pt-BR")}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-card rounded-2xl border border-border">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhum seguidor ainda</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <SettingsTab profile={profile} />
            )}
          </div>
        </main>
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={showCreatePost} 
        onOpenChange={setShowCreatePost}
        onSuccess={() => refetchPosts()}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend: string;
  color: "primary" | "accent";
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          color === "primary" ? "gradient-primary" : "bg-accent"
        } text-white`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-green-500 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          {trend}
        </span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );
}

function SettingsTab({ profile }: { profile: any }) {
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [subscriptionPrice, setSubscriptionPrice] = useState(profile.subscriptionPrice || "9.99");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [coverUrl, setCoverUrl] = useState(profile.coverUrl || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const utils = trpc.useUtils();
  
  const updateMutation = trpc.creator.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      utils.creator.getMyProfile.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateAvatarMutation = trpc.creator.updateAvatar.useMutation({
    onSuccess: () => {
      toast.success("Foto de perfil atualizada!");
      utils.creator.getMyProfile.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateCoverMutation = trpc.creator.updateCover.useMutation({
    onSuccess: () => {
      toast.success("Foto de capa atualizada!");
      utils.creator.getMyProfile.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const uploadMutation = trpc.media.confirmUpload.useMutation();
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileKey = `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        
        const result = await uploadMutation.mutateAsync({
          fileKey,
          fileBuffer: base64,
          contentType: file.type,
        });
        
        await updateAvatarMutation.mutateAsync({ avatarUrl: result.url });
        setAvatarUrl(result.url);
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao fazer upload da imagem");
      setUploadingAvatar(false);
    }
  };
  
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB");
      return;
    }
    
    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileKey = `covers/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        
        const result = await uploadMutation.mutateAsync({
          fileKey,
          fileBuffer: base64,
          contentType: file.type,
        });
        
        await updateCoverMutation.mutateAsync({ coverUrl: result.url });
        setCoverUrl(result.url);
        setUploadingCover(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao fazer upload da imagem");
      setUploadingCover(false);
    }
  };
  
  const handleSave = () => {
    updateMutation.mutate({
      displayName,
      bio,
      location,
      subscriptionPrice,
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Cover Photo */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-primary/20 to-pink-500/20">
          {coverUrl ? (
            <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Image className="w-12 h-12" />
            </div>
          )}
          <label className="absolute bottom-4 right-4 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
              disabled={uploadingCover}
            />
            <div className="flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 rounded-full text-white text-sm transition-colors">
              {uploadingCover ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              Alterar Capa
            </div>
          </label>
        </div>
        
        {/* Avatar */}
        <div className="relative px-6 pb-6">
          <div className="relative -mt-16 w-32 h-32">
            <div className="w-full h-full rounded-full border-4 border-card overflow-hidden bg-gradient-to-r from-primary to-pink-500">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                  {displayName?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
              <div className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-white shadow-lg transition-colors">
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </div>
            </label>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Clique nos ícones de câmera para alterar suas fotos de perfil e capa.
          </p>
        </div>
      </div>
      
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4">Informações do Perfil</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 bg-background"
            />
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 bg-background resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
          </div>
          
          <div>
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: São Paulo, Brasil"
              className="mt-1 bg-background"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold mb-4">Preço da Assinatura</h3>
        
        <div>
          <Label htmlFor="price">Valor Mensal (R$)</Label>
          <Input
            id="price"
            type="number"
            value={subscriptionPrice}
            onChange={(e) => setSubscriptionPrice(e.target.value)}
            min="4.99"
            step="0.01"
            className="mt-1 bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Valor mínimo: R$ 4,99. Taxa da plataforma: 20%
          </p>
        </div>
      </div>

      <Button 
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="gradient-primary text-white border-0"
      >
        {updateMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Salvar Alterações"
        )}
      </Button>
    </div>
  );
}
