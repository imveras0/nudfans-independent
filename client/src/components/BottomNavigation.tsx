import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Home, Compass, Plus, MessageCircle, User } from "lucide-react";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  const isCreator = user?.userType === "creator";
  
  // Get username from creatorProfile if available
  const creatorUsername = (user as any)?.creatorProfile?.username;
  
  const navItems = isCreator ? [
    { path: "/dashboard", icon: Home, label: "Início" },
    { path: "/explore", icon: Compass, label: "Explorar" },
    { path: "/dashboard/posts", icon: Plus, label: "Criar", isAction: true },
    { path: "/messages", icon: MessageCircle, label: "Mensagens" },
    { path: creatorUsername ? `/creator/${creatorUsername}` : "/dashboard", icon: User, label: "Perfil" },
  ] : [
    { path: "/feed", icon: Home, label: "Início" },
    { path: "/explore", icon: Compass, label: "Explorar" },
    { path: "/messages", icon: MessageCircle, label: "Mensagens" },
    { path: "/settings", icon: User, label: "Perfil" },
  ];

  // Don't show on certain pages
  const hiddenPaths = ["/", "/onboarding", "/creator-setup"];
  if (hiddenPaths.includes(location)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || location.startsWith(item.path + "/");
          
          if (item.isAction) {
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="flex flex-col items-center justify-center w-14 h-14 -mt-6 rounded-full gradient-primary text-white shadow-lg"
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          }
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
