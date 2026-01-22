import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Heart, MessageCircle, UserPlus, DollarSign, Image, Check, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  new_follower: <UserPlus className="w-4 h-4 text-primary" />,
  new_subscriber: <DollarSign className="w-4 h-4 text-green-500" />,
  new_comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
  new_like: <Heart className="w-4 h-4 text-accent" />,
  new_message: <MessageCircle className="w-4 h-4 text-primary" />,
  new_tip: <DollarSign className="w-4 h-4 text-yellow-500" />,
  new_post: <Image className="w-4 h-4 text-purple-500" />,
};

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const { data: notifications, isLoading } = trpc.notification.getAll.useQuery(
    { limit: 20 },
    { enabled: open }
  );
  
  const utils = trpc.useUtils();
  
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getAll.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });
  
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getAll.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });
  
  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate({ id: notification.id });
    }
    
    // Navigate based on notification type
    if (notification.relatedType === "post" && notification.relatedId) {
      window.location.href = `/post/${notification.relatedId}`;
    } else if (notification.relatedType === "message" && notification.relatedId) {
      window.location.href = `/messages`;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Marcar todas como lidas
                </>
              )}
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="py-2">
              {notifications.map((notification: any) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors text-left ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {NOTIFICATION_ICONS[notification.type] || <Bell className="w-4 h-4" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""}`}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
