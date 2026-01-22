import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CommentsSection } from "@/components/CommentsSection";
import { Heart, MessageCircle, Share2, Lock, Eye, MoreHorizontal, Play, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { PremiumVideoPlayer } from "@/components/PremiumVideoPlayer";

interface PostCardProps {
  post: any;
  creator: any;
  showCreatorInfo?: boolean;
  onDelete?: () => void;
}

export function PostCard({ post, creator, showCreatorInfo = true, onDelete }: PostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showFullContent, setShowFullContent] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  
  const utils = trpc.useUtils();
  
  const likeMutation = trpc.post.like.useMutation({
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikesCount((prev: number) => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setIsLiked(isLiked);
      setLikesCount(post.likesCount);
      toast.error("Erro ao curtir post");
    },
  });
  
  const deleteMutation = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deletado");
      onDelete?.();
    },
    onError: () => {
      toast.error("Erro ao deletar post");
    },
  });
  
  const ppvCheckoutMutation = trpc.payment.createPPVCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirecionando para o checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const handleLike = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    likeMutation.mutate({ postId: post.id });
  };
  
  const handlePurchase = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    ppvCheckoutMutation.mutate({ postId: post.id });
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success("Link copiado!");
  };
  
  const isOwner = user?.id === creator?.userId;
  const hasAccess = post.hasAccess;
  const isLocked = !hasAccess && post.postType !== "free";
  
  const mediaCount = post.media?.length || 0;

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaCount);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden animate-fade-in">
      {/* Header */}
      {showCreatorInfo && creator && (
        <div className="flex items-center justify-between p-4">
          <Link href={`/creator/${creator.username}`}>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-pink-500/50">
                  {creator.avatarUrl ? (
                    <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold">
                      {creator.displayName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {creator.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold hover:underline">{creator.displayName}</span>
                  {creator.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
          </Link>
          
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.info("Edição em breve")}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => deleteMutation.mutate({ id: post.id })}
                  className="text-destructive"
                >
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className={`whitespace-pre-wrap ${!showFullContent && post.content.length > 300 ? 'line-clamp-3' : ''}`}>
            {post.content}
          </p>
          {post.content.length > 300 && (
            <button 
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-pink-500 text-sm mt-1 hover:text-pink-400"
            >
              {showFullContent ? "Ver menos" : "Ver mais"}
            </button>
          )}
        </div>
      )}

      {/* Media Carousel */}
      {mediaCount > 0 && (
        <div className="relative">
          {/* Main Media Display */}
          <div className="relative bg-black">
            {post.media.map((media: any, index: number) => {
              const isVideo = media.mediaType === "video";
              const isActive = index === currentMediaIndex;
              
              if (!isActive) return null;
              
              return (
                <div 
                  key={media.id} 
                  className="relative w-full flex items-center justify-center"
                >
                  {isVideo ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      {hasAccess ? (
                        <div className="w-full max-h-[600px]">
                          <PremiumVideoPlayer
                            src={media.url}
                            poster={media.thumbnailUrl}
                            autoPlay={false}
                            loop={true}
                            initialMuted={false}
                            className="max-w-full max-h-[600px]"
                          />
                        </div>
                      ) : (
                        <>
                          <img 
                            src={media.thumbnailUrl || media.url} 
                            alt="" 
                            className="w-full h-full object-contain"
                            style={{ 
                              filter: `blur(${post.blurIntensity || 20}px)`,
                              maxHeight: '600px'
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                              <Play className="w-8 h-8 text-white ml-1" fill="white" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full flex items-center justify-center bg-black">
                      <img 
                        src={media.url} 
                        alt="" 
                        className={`max-w-full max-h-[600px] object-contain ${isLocked ? '' : ''}`}
                        style={isLocked ? { 
                          filter: `blur(${post.blurIntensity || 20}px)`,
                        } : undefined}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Navigation Arrows */}
            {mediaCount > 1 && (
              <>
                <button 
                  onClick={prevMedia}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextMedia}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Dots Indicator */}
            {mediaCount > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {post.media.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Media Counter */}
            {mediaCount > 1 && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
                {currentMediaIndex + 1}/{mediaCount}
              </div>
            )}
          
            {/* Lock overlay for PPV/Subscription */}
            {isLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Lock className="w-12 h-12 text-white mb-4" />
                {post.postType === "ppv" ? (
                  <>
                    <p className="text-white font-semibold text-lg mb-1">Conteúdo Pay-Per-View</p>
                    <p className="text-white/70 text-sm mb-4">Desbloqueie este conteúdo exclusivo</p>
                    <Button 
                      onClick={handlePurchase}
                      disabled={ppvCheckoutMutation.isPending}
                      className="gradient-primary text-white border-0 px-8 h-12 text-lg"
                    >
                      {ppvCheckoutMutation.isPending ? "Processando..." : `Desbloquear por R$ ${post.ppvPrice}`}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-white font-semibold text-lg mb-1">Conteúdo Exclusivo</p>
                    <p className="text-white/70 text-sm mb-4">Assine para ter acesso a este conteúdo</p>
                    <Link href={`/creator/${creator?.username}`}>
                      <Button className="gradient-primary text-white border-0 px-8 h-12 text-lg">
                        Assinar Agora
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post type badge */}
      {post.postType !== "free" && (
        <div className="px-4 pt-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            post.postType === "subscription" 
              ? "bg-pink-500/10 text-pink-500 border border-pink-500/20" 
              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
          }`}>
            {post.postType === "subscription" ? (
              <>
                <Heart className="w-3.5 h-3.5" />
                Exclusivo para Assinantes
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                PPV • R$ {post.ppvPrice}
              </>
            )}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-5">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all ${isLiked ? 'text-pink-500 scale-110' : 'text-muted-foreground hover:text-pink-500'}`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm font-medium">{post.commentsCount || 0}</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Eye className="w-4 h-4" />
          <span>{post.viewsCount || 0}</span>
        </div>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <CommentsSection postId={post.id} commentsCount={post.commentsCount || 0} />
      )}
    </div>
  );
}
