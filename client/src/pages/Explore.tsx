import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Music2, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  UserPlus,
  BadgeCheck,
  X,
  Send,
  ChevronUp,
  ChevronDown,
  Bookmark,
  Home
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PremiumVideoPlayer } from "@/components/PremiumVideoPlayer";

interface VideoPost {
  id: number;
  content: string | null;
  likesCount: number;
  viewsCount: number;
  creator: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
    isOnline: boolean;
    location: string | null;
    subscriptionPrice: string;
  };
  media: {
    id: number;
    mediaType: "image" | "video";
    url: string;
    thumbnailUrl: string | null;
  }[];
}

export default function Explore() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [followedCreators, setFollowedCreators] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const touchStartY = useRef(0);

  const { data: feedData, isLoading } = trpc.post.getExploreFeed.useQuery(
    { limit: 20 },
    { staleTime: 60000 }
  );

  const posts = feedData?.posts || [];
  const currentPost = posts[currentIndex];

  const { data: comments, refetch: refetchComments } = trpc.comment.getByPost.useQuery(
    { postId: currentPost?.id ?? 0 },
    { enabled: !!currentPost }
  );

  const likeMutation = trpc.post.like.useMutation({
    onSuccess: () => {
      const postId = currentPost?.id;
      if (postId) {
        setLikedPosts(prev => new Set(prev).add(postId));
      }
    }
  });

  const commentMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      toast.success("Comentário enviado!");
    }
  });

  const followMutation = trpc.follow.toggle.useMutation({
    onSuccess: () => {
      const creatorId = currentPost?.creator.id;
      if (creatorId) {
        setFollowedCreators(prev => new Set(prev).add(creatorId));
        toast.success("Seguindo!");
      }
    }
  });

  // Handle scroll/swipe navigation
  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (!posts.length) return;
    
    if (direction === 'down' && currentIndex < posts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, posts.length]);

  // Touch handling for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    if (Math.abs(diff) > 50) {
      handleScroll(diff > 0 ? 'down' : 'up');
    }
  };

  // Wheel handling for desktop
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 30) {
      handleScroll(e.deltaY > 0 ? 'down' : 'up');
    }
  }, [handleScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments) return;
      if (e.key === 'ArrowDown' || e.key === 'j') handleScroll('down');
      if (e.key === 'ArrowUp' || e.key === 'k') handleScroll('up');
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
      if (e.key === 'm') setIsMuted(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScroll, showComments]);

  // Auto-play current video
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index === currentIndex) {
        if (isPlaying) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
        video.muted = isMuted;
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, isPlaying, isMuted]);

  const handleLike = () => {
    if (!user) {
      toast.error("Faça login para curtir");
      return;
    }
    const postId = currentPost?.id;
    if (postId && !likedPosts.has(postId)) {
      likeMutation.mutate({ postId });
    }
  };

  const handleSave = () => {
    const postId = currentPost?.id;
    if (postId) {
      setSavedPosts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
          toast.success("Removido dos salvos");
        } else {
          newSet.add(postId);
          toast.success("Salvo!");
        }
        return newSet;
      });
    }
  };

  const handleComment = () => {
    if (!user) {
      toast.error("Faça login para comentar");
      return;
    }
    if (!newComment.trim()) return;
    const postId = currentPost?.id;
    if (postId) {
      commentMutation.mutate({ postId, content: newComment });
    }
  };

  const handleFollow = () => {
    if (!user) {
      toast.error("Faça login para seguir");
      return;
    }
    const creatorId = currentPost?.creator.id;
    if (creatorId && !followedCreators.has(creatorId)) {
      followMutation.mutate({ creatorId });
    }
  };

  const handleShare = async () => {
    if (currentPost) {
      try {
        await navigator.share({
          title: `${currentPost.creator.displayName} no NudFans`,
          text: currentPost.content || '',
          url: window.location.href,
        });
      } catch {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado!");
      }
    }
  };

  const goToProfile = () => {
    if (currentPost?.creator.username) {
      setLocation(`/creator/${currentPost.creator.username}`);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center">
        <div className="text-center text-white/60 px-4">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl mb-2">Nenhum vídeo disponível</p>
          <p className="text-sm mb-6">As criadoras ainda não postaram vídeos. Volte mais tarde!</p>
          <Link href="/">
            <Button className="bg-pink-500 hover:bg-pink-600">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const videoMedia = currentPost?.media?.find((m: any) => m.mediaType === "video");
  const imageMedia = currentPost?.media?.find((m: any) => m.mediaType === "image");
  const displayMedia = videoMedia || imageMedia;
  const isVideo = !!videoMedia;
  const isLiked = likedPosts.has(currentPost?.id ?? 0);
  const isSaved = savedPosts.has(currentPost?.id ?? 0);
  const isFollowed = followedCreators.has(currentPost?.creator?.id ?? 0);

  return (
    <div 
      ref={containerRef}
      className="h-[100dvh] bg-black overflow-hidden relative select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video/Image Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0"
        >
          {isVideo && videoMedia ? (
            <PremiumVideoPlayer
              src={videoMedia.url}
              poster={videoMedia.thumbnailUrl || undefined}
              autoPlay={true}
              loop={true}
              initialMuted={false}
              externalMuted={isMuted}
              onMuteChange={(muted) => setIsMuted(muted)}
              onPlayPause={(playing) => setIsPlaying(playing)}
              className="h-full w-full"
            />
          ) : displayMedia ? (
            <div 
              className="h-full w-full"
              onClick={goToProfile}
            >
              <img 
                src={displayMedia.url} 
                alt="" 
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="h-full w-full bg-gradient-to-br from-pink-500/20 to-purple-600/20"
              onClick={goToProfile}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Play/Pause Overlay */}
      <AnimatePresence>
        {!isPlaying && isVideo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
        <div className="flex items-center justify-between p-4">
          <Link href="/">
            <div className="flex items-center gap-2">
              <img src="/nudfans-icon.png" alt="NudFans" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-white text-lg hidden sm:block">NudFans</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">Para Você</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full w-10 h-10"
            onClick={() => setIsMuted(prev => !prev)}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-2 sm:right-4 bottom-28 sm:bottom-32 z-20 flex flex-col items-center gap-4 sm:gap-5">
        {/* Profile */}
        <div className="flex flex-col items-center">
          <button 
            onClick={goToProfile}
            className="relative group"
          >
            <Avatar className="w-11 h-11 sm:w-12 sm:h-12 ring-2 ring-white shadow-lg">
              <AvatarImage src={currentPost?.creator.avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold">
                {currentPost?.creator.displayName?.[0]}
              </AvatarFallback>
            </Avatar>
            {!isFollowed && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleFollow(); }}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-pink-500 rounded-full flex items-center justify-center border-2 border-black shadow-lg"
              >
                <UserPlus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </button>
            )}
          </button>
        </div>

        {/* Like */}
        <button 
          onClick={handleLike}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-pink-500/30' : 'bg-black/30 backdrop-blur-sm'}`}>
            <Heart className={`w-6 h-6 sm:w-7 sm:h-7 transition-all ${isLiked ? 'text-pink-500 fill-pink-500 scale-110' : 'text-white'}`} />
          </div>
          <span className="text-white text-[11px] sm:text-xs font-semibold">
            {formatCount((currentPost?.likesCount ?? 0) + (isLiked ? 1 : 0))}
          </span>
        </button>

        {/* Comments */}
        <button 
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <span className="text-white text-[11px] sm:text-xs font-semibold">
            {formatCount(comments?.length ?? 0)}
          </span>
        </button>

        {/* Save */}
        <button 
          onClick={handleSave}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${isSaved ? 'bg-yellow-500/30' : 'bg-black/30 backdrop-blur-sm'}`}>
            <Bookmark className={`w-6 h-6 sm:w-7 sm:h-7 transition-all ${isSaved ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
          </div>
          <span className="text-white text-[11px] sm:text-xs font-semibold">Salvar</span>
        </button>

        {/* Share */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center gap-0.5 group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <span className="text-white text-[11px] sm:text-xs font-semibold">Enviar</span>
        </button>

        {/* Music Disc */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-900 border-2 border-zinc-700 flex items-center justify-center animate-spin-slow shadow-lg">
          <Music2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-20 sm:bottom-24 left-0 right-14 sm:right-20 z-20 p-3 sm:p-4">
        {/* Creator Info */}
        <button 
          onClick={goToProfile}
          className="flex items-center gap-2 mb-2"
        >
          <span className="text-white font-bold text-sm sm:text-base">
            @{currentPost?.creator.username}
          </span>
          {currentPost?.creator.isVerified && (
            <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400" />
          )}
          {currentPost?.creator.isOnline && (
            <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-medium">
              ONLINE
            </span>
          )}
        </button>

        {/* Caption */}
        <p className="text-white text-xs sm:text-sm mb-3 line-clamp-2">
          {currentPost?.content}
        </p>

        {/* Subscribe Button - Compact */}
        <button
          onClick={goToProfile}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-white text-xs sm:text-sm font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all active:scale-95"
        >
          <span>Assinar • R$ {currentPost?.creator.subscriptionPrice}</span>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-0.5 sm:gap-1">
        {posts.slice(0, Math.min(posts.length, 8)).map((_, index) => (
          <div
            key={index}
            className={`w-0.5 sm:w-1 rounded-full transition-all ${
              index === currentIndex 
                ? 'h-4 sm:h-6 bg-white' 
                : 'h-1.5 sm:h-2 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Scroll Hint */}
      {currentIndex === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center text-white/50"
        >
          <ChevronUp className="w-5 h-5 animate-bounce" />
          <span className="text-[10px]">Deslize para cima</span>
        </motion.div>
      )}

      {/* Comments Sheet */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowComments(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-3xl max-h-[70vh] flex flex-col safe-area-bottom"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-zinc-700" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-white font-bold">
                  {comments?.length ?? 0} comentários
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 rounded-full w-8 h-8"
                  onClick={() => setShowComments(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments && comments.length > 0 ? (
                  comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={comment.user?.avatarUrl} className="object-cover" />
                        <AvatarFallback className="bg-zinc-700 text-white text-xs">
                          {comment.user?.name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-semibold">
                            {comment.user?.name || 'Usuário'}
                          </span>
                          <span className="text-white/40 text-xs">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm mt-1 break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/40 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Seja o primeiro a comentar!</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-white/10 flex gap-3">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="flex-1 bg-zinc-800 border-0 text-white placeholder:text-white/40 rounded-full h-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button
                  onClick={handleComment}
                  disabled={!newComment.trim() || commentMutation.isPending}
                  size="icon"
                  className="bg-pink-500 hover:bg-pink-600 rounded-full w-10 h-10 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
