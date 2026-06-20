import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Play, ImagePlus, Film, Loader2 } from "lucide-react";
import { uploadFile } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export type MediaItem = {
  id: string;
  type: string;
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
};

export type NewMedia = {
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  caption?: string;
};

export function MediaManager({
  items,
  onAdd,
  onDelete,
  adding,
  deletingId,
}: {
  items: MediaItem[];
  onAdd: (input: NewMedia) => void;
  onDelete: (id: string) => void;
  adding?: boolean;
  deletingId?: string | null;
}) {
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const busy = uploading || adding;

  const handleFile = async (file: File, type: "image" | "video") => {
    setUploading(true);
    try {
      const bucket = type === "image" ? "Images" : "Videos";
      const url = await uploadFile(bucket, file);
      onAdd({ type, url, caption: caption.trim() || undefined });
      setCaption("");
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file, "image");
    e.target.value = "";
  };

  const onVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file, "video");
    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="space-y-1.5">
          <Label>Caption (optional)</Label>
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption…"
            className="bg-background/50"
            disabled={busy}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onImagePick}
          />
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={onVideoPick}
          />

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => imageRef.current?.click()}
            data-testid="button-upload-image"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4 mr-1.5" />
            )}
            Upload photo
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => videoRef.current?.click()}
            data-testid="button-upload-video"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Film className="w-4 h-4 mr-1.5" />
            )}
            Upload video
          </Button>

          {busy && (
            <span className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              {uploading ? "Uploading…" : "Saving…"}
            </span>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((m) => (
            <div
              key={m.id}
              className="glass-card rounded-xl overflow-hidden group relative"
            >
              <div className="aspect-square bg-muted relative">
                {m.type === "video" ? (
                  m.thumbnailUrl ? (
                    <img
                      src={m.thumbnailUrl}
                      alt={m.caption ?? "Video"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video src={m.url} className="w-full h-full object-cover" />
                  )
                ) : (
                  <img
                    src={m.thumbnailUrl ?? m.url}
                    alt={m.caption ?? "Media"}
                    className="w-full h-full object-cover"
                  />
                )}
                {m.type === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-black/60">
                      <Play className="w-4 h-4 text-white fill-white translate-x-0.5" />
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(m.id)}
                  disabled={deletingId === m.id}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive disabled:opacity-50"
                  data-testid={`button-delete-media-${m.id}`}
                  aria-label="Delete media"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {m.caption && (
                <div className="p-2 text-xs text-muted-foreground truncate">
                  {m.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No media yet. Upload photos or videos above.
        </p>
      )}
    </div>
  );
}
