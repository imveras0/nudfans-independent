import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Trash2, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommentsSectionProps {
  postId: number;
  commentsCount: number;
}

export function CommentsSection({ postId, commentsCount }: CommentsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  
  const utils = trpc.useUtils();
  
  const { data: comments, isLoading } = trpc.comment.getByPost.useQuery(
    { postId },
    { enabled: isExpanded }
  );
  
  const createMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
      utils.comment.getByPost.invalidate({ postId });
      toast.success("Comentário enviado!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const deleteMutation = trpc.comment.delete.useMutation({
    onSuccess: () => {
      utils.comment.getByPost.invalidate({ postId });
      toast.success("Comentário deletado");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const likeMutation = trpc.comment.like.useMutation({
    onSuccess: () => {
      utils.comment.getByPost.invalidate({ postId });
    },
  });
  
  const handleSubmit = (parentId?: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;
    
    createMutation.mutate({
      postId,
      content: content.trim(),
      parentId,
    });
  };
  
  const handleLike = (commentId: number) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    likeMutation.mutate({ commentId });
  };

  return (
    <div className="border-t border-border">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        {commentsCount} comentário{commentsCount !== 1 ? "s" : ""}
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* New comment input */}
          {isAuthenticated && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={(user as any)?.avatarUrl} />
                <AvatarFallback className="gradient-primary text-white text-xs">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="min-h-[40px] max-h-[120px] resize-none bg-muted"
                  rows={1}
                />
                <Button
                  onClick={() => handleSubmit()}
                  disabled={!newComment.trim() || createMutation.isPending}
                  size="icon"
                  className="gradient-primary text-white border-0 shrink-0"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Comments list */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  onLike={handleLike}
                  onDelete={(id) => deleteMutation.mutate({ id })}
                  onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  onSubmitReply={() => handleSubmit(replyingTo!)}
                  isSubmitting={createMutation.isPending}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: any;
  currentUserId?: number;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  onReply: (id: number) => void;
  replyingTo: number | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: () => void;
  isSubmitting: boolean;
  isAuthenticated: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  onLike,
  onDelete,
  onReply,
  replyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isSubmitting,
  isAuthenticated,
}: CommentItemProps) {
  const isOwner = currentUserId === comment.userId;
  
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <a href={comment.user?.username ? `/creator/${comment.user.username}` : "#"}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.user?.avatarUrl} />
            <AvatarFallback className="gradient-primary text-white text-xs">
              {comment.user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </a>
        
        <div className="flex-1">
          <div className="bg-muted rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <a 
                href={comment.user?.username ? `/creator/${comment.user.username}` : "#"}
                className="font-semibold text-sm hover:underline"
              >
                {comment.user?.name || "Usuário"}
              </a>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 px-2">
            <button
              onClick={() => onLike(comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 ${comment.likesCount > 0 ? "fill-accent text-accent" : ""}`} />
              {comment.likesCount > 0 && comment.likesCount}
            </button>
            
            {isAuthenticated && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Responder
              </button>
            )}
            
            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="flex gap-2 mt-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escreva uma resposta..."
                className="min-h-[36px] max-h-[80px] resize-none bg-muted text-sm"
                rows={1}
              />
              <Button
                onClick={onSubmitReply}
                disabled={!replyContent.trim() || isSubmitting}
                size="sm"
                className="gradient-primary text-white border-0"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enviar"}
              </Button>
            </div>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-border">
              {comment.replies.map((reply: any) => (
                <div key={reply.id} className="flex gap-3">
                  <a href={reply.user?.username ? `/creator/${reply.user.username}` : "#"}>
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={reply.user?.avatarUrl} />
                      <AvatarFallback className="gradient-primary text-white text-[10px]">
                        {reply.user?.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </a>
                  
                  <div className="flex-1">
                    <div className="bg-muted rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <a 
                          href={reply.user?.username ? `/creator/${reply.user.username}` : "#"}
                          className="font-semibold text-xs hover:underline"
                        >
                          {reply.user?.name || "Usuário"}
                        </a>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 px-2">
                      <button
                        onClick={() => onLike(reply.id)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Heart className={`w-3 h-3 ${reply.likesCount > 0 ? "fill-accent text-accent" : ""}`} />
                        {reply.likesCount > 0 && reply.likesCount}
                      </button>
                      
                      {currentUserId === reply.userId && (
                        <button
                          onClick={() => onDelete(reply.id)}
                          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
