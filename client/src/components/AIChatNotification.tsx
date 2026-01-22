import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface AIChatNotificationProps {
  creatorId: number;
  creatorName: string;
  creatorAvatar?: string;
}

export function AIChatNotification({ creatorId, creatorName, creatorAvatar }: AIChatNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Show notification after 3 seconds of viewing the profile
    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasNewMessage(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [creatorId]);

  const handleClick = () => {
    setHasNewMessage(false);
    setLocation(`/messages?creator=${creatorId}`);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-24 right-4 z-50"
      >
        <button
          onClick={handleClick}
          className="relative group"
        >
          {/* Glow effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-md opacity-60 group-hover:opacity-80 transition-opacity animate-pulse" />
          
          {/* Main button */}
          <div className="relative w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-pink-500/30 transition-transform group-hover:scale-110 group-active:scale-95">
            <MessageCircle className="w-6 h-6 text-white" />
            
            {/* Avatar mini */}
            {creatorAvatar && (
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full border-2 border-white overflow-hidden">
                <img src={creatorAvatar} alt={creatorName} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          
          {/* Notification badge */}
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-500 text-white text-[10px] font-bold">
                1
              </span>
            </span>
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook simplificado para usar no perfil
export function useAIChatNotification(creatorId?: number) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!creatorId) {
      setShouldShow(false);
      return;
    }

    // Delay para mostrar a notificação
    const timer = setTimeout(() => {
      setShouldShow(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      setShouldShow(false);
    };
  }, [creatorId]);

  return { shouldShow };
}
