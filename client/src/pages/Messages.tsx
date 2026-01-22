import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation, useParams, useSearch } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Heart, Loader2, Send, ArrowLeft, Search, Image, DollarSign, Home } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TipDialog } from "@/components/TipDialog";
import { Link } from "wouter";

export default function Messages() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const searchParams = new URLSearchParams(useSearch());
  const creatorIdParam = searchParams.get("creator");
  
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [offset, setOffset] = useState(0);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const MESSAGES_PER_PAGE = 20;
  
  const { data: conversations, isLoading: conversationsLoading } = (trpc as any).message.getConversations.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = (trpc as any).message.getMessages.useQuery(
    { conversationId: selectedConversation || 0, limit: MESSAGES_PER_PAGE, offset: 0 },
    { enabled: !!selectedConversation && selectedConversation > 0, refetchInterval: 5000 }
  );
  
  // Load more messages mutation
  const loadMoreMessages = async () => {
    if (!selectedConversation || isLoadingMore || !messagesData?.hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const newOffset = allMessages.length;
      const result = await (trpc as any).message.getMessages.fetch({
        conversationId: selectedConversation,
        limit: MESSAGES_PER_PAGE,
        offset: newOffset,
      });
      
      if (result?.messages?.length > 0) {
        setAllMessages(prev => [...result.messages, ...prev]);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Update allMessages when messagesData changes
  useEffect(() => {
    if (messagesData?.messages) {
      setAllMessages(messagesData.messages);
    }
  }, [messagesData]);
  
  // Reset messages when conversation changes
  useEffect(() => {
    setAllMessages([]);
    setOffset(0);
  }, [selectedConversation]);
  
  const utils = trpc.useUtils();
  
  // Create conversation with creator
  const createConversationMutation = (trpc as any).message.createConversation.useMutation({
    onSuccess: (data: any) => {
      setSelectedConversation(data.id);
      setHasInitialized(true);
      (utils as any).message.getConversations.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar conversa");
      setHasInitialized(true);
    },
  });
  
  const sendMessageMutation = (trpc as any).message.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      (utils as any).message.getConversations.invalidate();
      
      // Show typing indicator for AI response
      setIsTyping(true);
      
      // Poll for new messages and hide typing when AI responds
      const checkForResponse = setInterval(() => {
        refetchMessages().then((result: any) => {
          if (result.data?.messages && result.data.messages.length > 0) {
            const lastMsg = result.data.messages[result.data.messages.length - 1];
            if (lastMsg.senderId !== user?.id) {
              setIsTyping(false);
              clearInterval(checkForResponse);
            }
          }
        });
      }, 1000);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        setIsTyping(false);
        clearInterval(checkForResponse);
      }, 10000);
    },
    onError: (error: any) => {
      toast.error(error.message);
      setIsTyping(false);
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  // Initialize conversation - runs only once when conversations are loaded
  useEffect(() => {
    if (hasInitialized || conversationsLoading || !conversations) return;
    
    // Get creator ID from URL parameter or path
    const creatorId = creatorIdParam || conversationId;
    
    if (creatorId) {
      const creatorIdNum = parseInt(creatorId);
      
      // Check if we already have a conversation with this creator
      const existingConv = conversations?.find((c: any) => 
        c.creatorId === creatorIdNum || c.otherUser?.id === creatorIdNum
      );
      
      if (existingConv) {
        setSelectedConversation(existingConv.id);
        setHasInitialized(true);
      } else if (!createConversationMutation.isPending) {
        // Create new conversation
        createConversationMutation.mutate({ creatorId: creatorIdNum });
      }
    } else {
      // No creator ID, just show conversation list
      setHasInitialized(true);
    }
  }, [conversations, conversationsLoading, hasInitialized, creatorIdParam, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageText.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConv = conversations?.find((c: any) => c.id === selectedConversation);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Conversations List */}
      <div className={`w-full md:w-80 border-r border-border bg-card flex flex-col ${
        selectedConversation ? "hidden md:flex" : "flex"
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <Home className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">Mensagens</span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-9 bg-background"
            />
          </div>
        </div>
        
        {/* Conversations */}
        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="divide-y divide-border">
              {conversations.map((conv: any) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                    selectedConversation === conv.id ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {conv.otherUser?.avatarUrl ? (
                        <img src={conv.otherUser.avatarUrl} alt="" className="w-full h-full object-cover aspect-square" />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold">
                          {conv.otherUser?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    {conv.otherUser?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">{conv.otherUser?.name || "Usuário"}</span>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{conv.unreadCount}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhuma conversa ainda</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Visite o perfil de uma criadora para iniciar uma conversa
              </p>
              <Link href="/explore">
                <Button className="mt-4 gradient-primary">
                  Explorar criadoras
                </Button>
              </Link>
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${
        !selectedConversation ? "hidden md:flex" : "flex"
      }`}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <Link href={selectedConv.otherUser?.username ? `/creator/${selectedConv.otherUser.username}` : "#"}>
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {selectedConv.otherUser?.avatarUrl ? (
                        <img src={selectedConv.otherUser.avatarUrl} alt="" className="w-full h-full object-cover aspect-square" />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold">
                          {selectedConv.otherUser?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    {selectedConv.otherUser?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedConv.otherUser?.name || "Usuário"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedConv.otherUser?.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </Link>
              
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTipDialog(true)}
                  className="text-pink-500 border-pink-500/30 hover:bg-pink-500/10"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Gorjeta
                </Button>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : allMessages && allMessages.length > 0 ? (
                <div className="space-y-4">
                  {/* Load More Button */}
                  {messagesData?.hasMore && (
                    <div className="flex justify-center mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMoreMessages}
                        disabled={isLoadingMore}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isLoadingMore ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <ArrowLeft className="w-4 h-4 mr-2 rotate-90" />
                        )}
                        Carregar mensagens anteriores
                      </Button>
                    </div>
                  )}
                  <div ref={topRef} />
                  {allMessages.map((msg: any) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-white/60" : "text-muted-foreground"}`}>
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Typing Indicator */}
                  {isTyping && selectedConv && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm text-muted-foreground ml-2">
                          {selectedConv.otherUser?.name || 'Criadora'} está digitando...
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Envie uma mensagem para iniciar a conversa
                  </p>
                </div>
              )}
            </ScrollArea>
            
            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Image className="w-5 h-5" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="gradient-primary"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Suas mensagens</h3>
            <p className="text-muted-foreground max-w-sm">
              Selecione uma conversa ou visite o perfil de uma criadora para iniciar uma nova conversa
            </p>
            <Link href="/">
              <Button className="mt-6 gradient-primary">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao início
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Tip Dialog */}
      {selectedConv && (
        <TipDialog
          open={showTipDialog}
          onOpenChange={setShowTipDialog}
          creator={{
            id: selectedConv.creatorId,
            username: selectedConv.otherUser?.username || "",
            displayName: selectedConv.otherUser?.name || "Criadora",
          }}
        />
      )}
    </div>
  );
}
