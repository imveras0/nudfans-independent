import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Heart, Loader2, Search, Compass } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/PostCard";
import { getLoginUrl } from "@/const";

export default function Feed() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: posts, isLoading } = trpc.post.getFeed.useQuery({ limit: 20 });
  const { data: suggestedCreators } = trpc.creator.list.useQuery({ limit: 5 });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <img src="/nudfans-icon.png" alt="NudFans" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-bold gradient-text">NudFans</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/explore")}
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  creator={post.creator}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Compass className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Seu feed está vazio</h3>
                <p className="text-muted-foreground mb-4">
                  Siga criadoras para ver seus posts aqui
                </p>
                <Button onClick={() => setLocation("/explore")} className="gradient-primary text-white border-0">
                  Explorar Criadoras
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar - Suggested Creators */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-semibold mb-4">Criadoras Sugeridas</h3>
                
                {suggestedCreators && suggestedCreators.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedCreators.map((creator) => (
                      <a 
                        key={creator.id}
                        href={`/creator/${creator.username}`}
                        className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {creator.avatarUrl ? (
                            <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full gradient-primary flex items-center justify-center text-white font-bold">
                              {creator.displayName?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium truncate">{creator.displayName}</span>
                            {creator.isVerified && (
                              <svg className="w-4 h-4 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground truncate">@{creator.username}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma sugestão disponível</p>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 text-primary"
                  onClick={() => setLocation("/explore")}
                >
                  Ver Todas
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
