import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useParams, useSearch } from "wouter";
import { useState, useEffect } from "react";
import { 
  Heart, MapPin, Users, Image, ShoppingBag, 
  MessageCircle, DollarSign, Check, Loader2,
  Grid, Play, Lock, Eye, UserPlus,
  ChevronLeft, MoreHorizontal, Share2, Sparkles, Crown, Zap, Star, Flame, Diamond
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { PostCard } from "@/components/PostCard";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { TipDialog } from "@/components/TipDialog";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Link } from "wouter";
import { AIChatNotification, useAIChatNotification } from "@/components/AIChatNotification";

// Ultra Premium Verified Badge Component
function VerifiedBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7"
  };
  
  return (
    <div className={`relative ${sizes[size]} flex-shrink-0 group`}>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity animate-pulse" />
      
      {/* Main badge */}
      <svg viewBox="0 0 24 24" fill="none" className="relative w-full h-full drop-shadow-lg">
        <defs>
          <linearGradient id="verifiedGradientPremium" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="30%" stopColor="#818CF8" />
            <stop offset="60%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Badge shape */}
        <path
          d="M12 2L14.09 4.26L17 3.27L17.27 6.27L20 7.27L19.27 10.27L22 12L19.27 13.73L20 16.73L17.27 17.73L17 20.73L14.09 19.74L12 22L9.91 19.74L7 20.73L6.73 17.73L4 16.73L4.73 13.73L2 12L4.73 10.27L4 7.27L6.73 6.27L7 3.27L9.91 4.26L12 2Z"
          fill="url(#verifiedGradientPremium)"
          filter="url(#glow)"
        />
        
        {/* Inner circle */}
        <circle cx="12" cy="12" r="6" fill="rgba(255,255,255,0.15)" />
        
        {/* Checkmark */}
        <path
          d="M8.5 12L10.5 14L15.5 9"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
      </svg>
      
      {/* Sparkle effects */}
      <div className="absolute -top-1 -right-1 w-2 h-2">
        <Sparkles className="w-full h-full text-yellow-300 animate-pulse" />
      </div>
    </div>
  );
}

// Ultra Premium Online Status Component
function OnlineStatus({ showText = true, size = "md" }: { showText?: boolean; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5" : "px-3 py-1.5";
  const dotSize = size === "sm" ? "h-2 w-2" : "h-3 w-3";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  
  return (
    <div className={`relative flex items-center gap-2 ${sizeClasses} rounded-full overflow-hidden`}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/30 via-green-500/30 to-emerald-600/30 bg-[length:200%_100%] animate-gradient" />
      
      {/* Glass effect border */}
      <div className="absolute inset-0 rounded-full border border-emerald-400/50 backdrop-blur-sm" />
      
      {/* Glow ring */}
      <div className="absolute inset-0 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
      
      {/* Pulsing dot */}
      <span className={`relative flex ${dotSize}`}>
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-50 scale-150"></span>
        <span className={`relative inline-flex rounded-full ${dotSize} bg-gradient-to-br from-emerald-300 to-green-500 shadow-lg shadow-emerald-500/80`}></span>
      </span>
      
      {showText && (
        <span className={`relative ${textSize} font-bold text-emerald-300 uppercase tracking-widest`}>
          Online
        </span>
      )}
    </div>
  );
}

// Ultra Premium Subscribe Button Component
function SubscribeButton({ 
  price, 
  onClick, 
  isSubscribed,
  disabled 
}: { 
  price: string; 
  onClick: () => void; 
  isSubscribed: boolean;
  disabled?: boolean;
}) {
  if (isSubscribed) {
    return (
      <button 
        className="relative w-full h-11 rounded-xl overflow-hidden bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/40"
        disabled
      >
        <div className="flex items-center justify-center gap-2 h-full">
          <Crown className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-300 font-semibold text-sm">Assinante VIP</span>
          <Check className="w-4 h-4 text-emerald-400" />
        </div>
      </button>
    );
  }

  return (
    <div className="relative w-full group">
      {/* Subtle glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
      
      <button 
        onClick={onClick}
        disabled={disabled}
        className="relative w-full h-11 rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500" />
        
        {/* Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        {/* Content */}
        <div className="relative flex items-center justify-center gap-2 h-full">
          <Crown className="w-4 h-4 text-yellow-200" />
          <span className="text-white font-bold text-sm">
            Assinar • R$ {price}/mês
          </span>
        </div>
        
        {/* Border */}
        <div className="absolute inset-0 rounded-xl border border-white/20" />
      </button>
    </div>
  );
}

export default function CreatorProfile() {
  const { username } = useParams<{ username: string }>();
  const searchParams = new URLSearchParams(useSearch());
  const isPreviewMode = searchParams.get("preview") === "true";
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [showFullBio, setShowFullBio] = useState(false);
  
  const { data: creator, isLoading: creatorLoading } = trpc.creator.getByUsername.useQuery(
    { username: username || "" },
    { enabled: !!username }
  );
  
  const { data: posts, isLoading: postsLoading } = trpc.post.getByCreator.useQuery(
    { creatorId: creator?.id || 0, limit: 20 },
    { enabled: !!creator?.id }
  );
  
  const { data: followStatus } = trpc.follow.status.useQuery(
    { creatorId: creator?.id || 0 },
    { enabled: !!creator?.id && isAuthenticated && !isPreviewMode }
  );
  
  const { data: subscriptionStatus } = trpc.subscription.status.useQuery(
    { creatorId: creator?.id || 0 },
    { enabled: !!creator?.id && isAuthenticated && !isPreviewMode }
  );
  
  const { data: shopItems } = trpc.shop.getItems.useQuery(
    { creatorId: creator?.id || 0 },
    { enabled: !!creator?.id }
  );
  
  const utils = trpc.useUtils();
  
  // AI Chat notification hook - MUST be called before any conditional returns
  const isOwner = user?.id === creator?.userId && !isPreviewMode;
  const { shouldShow: showChatNotification } = useAIChatNotification(
    !isOwner && creator ? creator.id : undefined
  );
  
  const followMutation = trpc.follow.toggle.useMutation({
    onSuccess: (data) => {
      utils.follow.status.invalidate({ creatorId: creator?.id });
      utils.creator.getByUsername.invalidate({ username });
      toast.success(data.following ? "Seguindo!" : "Deixou de seguir");
    },
  });
  
  const handleFollow = () => {
    if (isPreviewMode) {
      toast.info("Modo de visualização - ação desabilitada");
      return;
    }
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (creator?.id) {
      followMutation.mutate({ creatorId: creator.id });
    }
  };
  
  const handleSubscribe = () => {
    if (isPreviewMode) {
      toast.info("Modo de visualização - ação desabilitada");
      return;
    }
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setShowSubscribeDialog(true);
  };
  
  const handleMessage = () => {
    if (isPreviewMode) {
      toast.info("Modo de visualização - ação desabilitada");
      return;
    }
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLocation(`/messages?creator=${creator?.id}`);
  };

  // Redirect to explore if no username provided
  useEffect(() => {
    if (!username) {
      setLocation("/explore");
    }
  }, [username, setLocation]);

  if (creatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-2">Perfil não encontrado</h1>
        <p className="text-muted-foreground mb-4">Esta criadora não existe ou foi removida</p>
        <Button onClick={() => setLocation("/explore")}>Explorar Criadoras</Button>
      </div>
    );
  }

  const isSubscribed = isPreviewMode ? false : subscriptionStatus?.subscribed;
  const isFollowing = isPreviewMode ? false : followStatus?.following;

  // Filter media posts
  const mediaPosts = posts?.filter(p => p.media && p.media.length > 0) || [];
  const allMedia = mediaPosts.flatMap(p => p.media.map(m => ({ ...m, postId: p.id, hasAccess: p.hasAccess })));

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-center py-2.5 text-sm font-semibold shadow-lg">
          <Eye className="w-4 h-4 inline mr-2" />
          Modo de Visualização - Vendo como visitante
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/dashboard")}
            className="ml-4 text-white hover:bg-white/20 h-7 border border-white/30"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      )}

      {/* Header */}
      <header className={`fixed ${isPreviewMode ? 'top-10' : 'top-0'} left-0 right-0 z-50 glass border-b border-border/50`}>
        <div className="flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div 
        className={`relative h-60 sm:h-80 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-indigo-500/30 ${isPreviewMode ? 'mt-24' : 'mt-14'}`}
        style={creator.coverUrl ? {
          backgroundImage: `url(${creator.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: `center ${creator.coverPositionY || 50}%`,
        } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        
        {/* Online Status on Cover - Premium Position */}
        {creator.isOnline && (
          <div className="absolute top-4 right-4">
            <OnlineStatus />
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="container relative -mt-24 px-4">
        {/* Avatar with Premium Ring */}
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            {/* Animated ring */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow opacity-75 blur-sm" />
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-full" />
            
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-background overflow-hidden bg-card shadow-2xl">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-primary flex items-center justify-center text-white text-5xl font-bold">
                  {creator.displayName?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            
            {/* Online Indicator on Avatar - Premium */}
            {creator.isOnline && (
              <div className="absolute bottom-2 right-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md animate-pulse" />
                  <div className="relative w-8 h-8 bg-gradient-to-br from-emerald-300 to-green-500 rounded-full border-4 border-background flex items-center justify-center shadow-lg shadow-emerald-500/50">
                    <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Name and Badges - Premium Layout */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-white to-pink-200 bg-clip-text text-transparent">
            {creator.displayName}
          </h1>
          {creator.isVerified && <VerifiedBadge size="lg" />}
        </div>
        
        {/* Username */}
        <p className="text-muted-foreground text-lg mb-3">@{creator.username}</p>
        
        {/* Online Status Badge (if online) */}
        {creator.isOnline && (
          <div className="mb-4">
            <OnlineStatus size="md" />
          </div>
        )}
        
        {/* Location with Distance - Premium Design */}
        {creator.location && (
          <div className="flex flex-wrap items-center gap-2 text-sm mb-5">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span className="text-foreground font-medium">{creator.location}</span>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-full blur-md group-hover:blur-lg transition-all" />
              <div className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="text-pink-300 font-bold">2 km de você</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row - Premium Design */}
        <div className="flex items-center justify-around mb-6 py-5 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 rounded-2xl border border-border/50 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-extrabold bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
              {formatNumber(creator.stats?.posts || 0)}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Posts</span>
          </div>
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-extrabold bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
              {formatNumber(creator.stats?.followers || 0)}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Seguidores</span>
          </div>
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-border to-transparent" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-extrabold bg-gradient-to-b from-pink-300 to-pink-500 bg-clip-text text-transparent">
              {formatNumber(creator.stats?.likes || 0)}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Curtidas</span>
          </div>
        </div>
        
        {/* Bio */}
        {creator.bio && (
          <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/50">
            <p className={`text-sm leading-relaxed ${showFullBio ? '' : 'line-clamp-3'}`}>
              {creator.bio}
            </p>
            {creator.bio.length > 120 && (
              <button 
                onClick={() => setShowFullBio(!showFullBio)}
                className="text-sm text-pink-400 hover:text-pink-300 mt-2 font-semibold"
              >
                {showFullBio ? 'ver menos' : 'ver mais'}
              </button>
            )}
          </div>
        )}

        {/* Main Action Buttons */}
        {!isOwner && (
          <div className="space-y-4 mb-8">
            {/* Subscribe Button - Ultra Premium Design */}
            <SubscribeButton 
              price={creator.subscriptionPrice || "0"}
              onClick={handleSubscribe}
              isSubscribed={isSubscribed || false}
              disabled={isPreviewMode}
            />

            {/* Secondary Actions - Premium Design */}
            <div className="flex gap-3">
              <Button
                onClick={handleFollow}
                variant="outline"
                disabled={followMutation.isPending || isPreviewMode}
                className={`flex-1 h-14 rounded-xl transition-all duration-300 border-2 ${
                  isFollowing 
                    ? "bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 border-pink-400/50 text-pink-300 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-pink-500/30" 
                    : "bg-transparent border-border hover:bg-muted hover:border-pink-500/50"
                }`}
              >
                {followMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    <span className="font-semibold">{isFollowing ? "Seguindo" : "Seguir"}</span>
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleMessage} 
                disabled={isPreviewMode}
                className="flex-1 h-14 rounded-xl bg-transparent border-2 border-border hover:bg-muted hover:border-purple-500/50 transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Mensagem</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => !isPreviewMode && setShowTipDialog(true)} 
                disabled={isPreviewMode}
                className="h-14 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/40 text-yellow-400 hover:from-yellow-500/30 hover:to-amber-500/30 px-5 transition-all duration-300"
              >
                <DollarSign className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}
        
        {isOwner && (
          <Button 
            onClick={() => setLocation("/dashboard/settings")} 
            variant="outline" 
            className="w-full h-14 rounded-xl bg-transparent border-2 mb-8 hover:bg-muted"
          >
            <span className="font-semibold">Editar Perfil</span>
          </Button>
        )}

        {/* Tabs - Premium Design */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-14 bg-muted/50 rounded-xl p-1.5 border border-border/50">
            <TabsTrigger 
              value="posts" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border data-[state=active]:border-pink-500/30 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Grid className="w-4 h-4 mr-2" />
              <span className="font-semibold">Posts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border data-[state=active]:border-pink-500/30 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Image className="w-4 h-4 mr-2" />
              <span className="font-semibold">Mídia</span>
            </TabsTrigger>
            <TabsTrigger 
              value="shop" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border data-[state=active]:border-pink-500/30 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              <span className="font-semibold">Loja</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6 space-y-4">
            {postsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => (
                <PostCard key={post.id} post={post} creator={creator} />
              ))
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Image className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum post ainda</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            {allMedia.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                {allMedia.map((media: any, index: number) => (
                  <Link key={`${media.postId}-${media.id}`} href={`/post/${media.postId}`}>
                    <div className="aspect-square relative bg-muted cursor-pointer group overflow-hidden">
                      {media.hasAccess ? (
                        <>
                          {media.mediaType === "video" ? (
                            <>
                              <img 
                                src={media.thumbnailUrl || creator.avatarUrl} 
                                alt="" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play className="w-8 h-8 text-white" fill="white" />
                              </div>
                            </>
                          ) : (
                            <img 
                              src={media.url} 
                              alt="" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-500/20">
                          <Lock className="w-8 h-8 text-pink-500" />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Image className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma mídia ainda</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shop" className="mt-6">
            {shopItems && shopItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {shopItems.map((item: any) => (
                  <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      <p className="text-pink-500 font-bold">R$ {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Loja em breve</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
      
      {/* AI Chat Notification */}
      {showChatNotification && creator && (
        <AIChatNotification
          creatorId={creator.id}
          creatorName={creator.displayName}
          creatorAvatar={creator.avatarUrl || undefined}
        />
      )}
      
      {/* Dialogs */}
      {creator && (
        <>
          <SubscriptionModal
            open={showSubscribeDialog}
            onOpenChange={setShowSubscribeDialog}
            creatorId={creator.id}
            creatorName={creator.displayName}
            creatorUsername={creator.username}
            subscriptionPrice={Number(creator.subscriptionPrice) || 9.99}
          />
          <TipDialog
            open={showTipDialog}
            onOpenChange={setShowTipDialog}
            creator={creator}
          />
        </>
      )}
    </div>
  );
}
