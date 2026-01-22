import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image, Video, X, Loader2, Upload, Lock, Heart, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface MediaItem {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  fileKey?: string;
}

export function CreatePostDialog({ open, onOpenChange, onSuccess }: CreatePostDialogProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"free" | "subscription" | "ppv">("free");
  const [ppvPrice, setPpvPrice] = useState("9.99");
  const [blurIntensity, setBlurIntensity] = useState(20);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = trpc.media.confirmUpload.useMutation();
  const createPostMutation = trpc.post.create.useMutation({
    onSuccess: () => {
      toast.success("Post criado com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });
  
  const resetForm = () => {
    setContent("");
    setPostType("free");
    setPpvPrice("9.99");
    setBlurIntensity(20);
    setMediaItems([]);
    setIsSubmitting(false);
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (mediaItems.length + files.length > 10) {
      toast.error("Máximo de 10 arquivos por post");
      return;
    }
    
    const newItems: MediaItem[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      uploading: false,
      uploaded: false,
    }));
    
    setMediaItems((prev) => [...prev, ...newItems]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const removeMedia = (id: string) => {
    setMediaItems((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((m) => m.id !== id);
    });
  };
  
  const uploadMedia = async (item: MediaItem): Promise<{ url: string; fileKey: string } | null> => {
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(item.file);
      });
      
      const ext = item.file.name.split(".").pop() || "jpg";
      const fileKey = `posts/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
      
      const result = await uploadMutation.mutateAsync({
        fileKey,
        fileBuffer: base64,
        contentType: item.file.type,
      });
      
      return { url: result.url, fileKey: result.fileKey };
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };
  
  const handleSubmit = async () => {
    if (!content.trim() && mediaItems.length === 0) {
      toast.error("Adicione conteúdo ou mídia ao post");
      return;
    }
    
    if (postType === "ppv" && (!ppvPrice || parseFloat(ppvPrice) < 1)) {
      toast.error("Defina um preço válido para o conteúdo PPV");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload all media
      const uploadedMedia: Array<{
        mediaType: "image" | "video";
        url: string;
        fileKey: string;
      }> = [];
      
      for (const item of mediaItems) {
        setMediaItems((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, uploading: true } : m))
        );
        
        const result = await uploadMedia(item);
        if (result) {
          uploadedMedia.push({
            mediaType: item.type,
            url: result.url,
            fileKey: result.fileKey,
          });
          
          setMediaItems((prev) =>
            prev.map((m) =>
              m.id === item.id
                ? { ...m, uploading: false, uploaded: true, url: result.url, fileKey: result.fileKey }
                : m
            )
          );
        } else {
          throw new Error("Falha no upload de mídia");
        }
      }
      
      // Create post
      await createPostMutation.mutateAsync({
        content: content.trim() || undefined,
        postType,
        ppvPrice: postType === "ppv" ? ppvPrice : undefined,
        blurIntensity: postType === "ppv" ? blurIntensity : undefined,
        mediaItems: uploadedMedia,
      });
    } catch (error) {
      toast.error("Erro ao criar post");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isSubmitting) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Content */}
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que você quer compartilhar?"
              className="min-h-[120px] bg-card resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{content.length}/2000</p>
          </div>
          
          {/* Media Preview */}
          {mediaItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {mediaItems.map((item) => (
                <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  {item.type === "video" ? (
                    <video src={item.preview} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  )}
                  
                  {item.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  {item.uploaded && (
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  
                  {!isSubmitting && (
                    <button
                      onClick={() => removeMedia(item.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Add Media Button */}
          {mediaItems.length < 10 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-transparent"
                disabled={isSubmitting}
              >
                <Upload className="w-4 h-4 mr-2" />
                Adicionar Mídia ({mediaItems.length}/10)
              </Button>
            </div>
          )}
          
          {/* Post Type */}
          <div>
            <Label>Tipo de Post</Label>
            <Select value={postType} onValueChange={(v: any) => setPostType(v)} disabled={isSubmitting}>
              <SelectTrigger className="mt-1 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Gratuito - Visível para todos
                  </div>
                </SelectItem>
                <SelectItem value="subscription">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Assinantes - Apenas para assinantes
                  </div>
                </SelectItem>
                <SelectItem value="ppv">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    PPV - Compra única
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* PPV Options */}
          {postType === "ppv" && (
            <div className="space-y-4 p-4 rounded-xl bg-muted/50">
              <div>
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  value={ppvPrice}
                  onChange={(e) => setPpvPrice(e.target.value)}
                  min="1"
                  step="0.01"
                  className="mt-1 bg-card"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <Label>Intensidade do Blur: {blurIntensity}px</Label>
                <Slider
                  value={[blurIntensity]}
                  onValueChange={(v) => setBlurIntensity(v[0])}
                  min={5}
                  max={50}
                  step={1}
                  className="mt-2"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Controla o quanto o preview ficará borrado
                </p>
              </div>
            </div>
          )}
          
          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && mediaItems.length === 0)}
            className="w-full gradient-primary text-white border-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
