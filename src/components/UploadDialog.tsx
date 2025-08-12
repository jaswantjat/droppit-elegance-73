import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  File as FileIcon,
  Trash2,
  RotateCw,
  Link,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Small helpers
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export type UploadStatus = "uploading" | "success" | "error";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number; // 0-100
  eta: number; // seconds remaining
  status: UploadStatus;
}

const MAX_FILE_SIZE_LABEL = "Max. file size: 256 MB";

export default function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulate upload progress
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.status !== "uploading") return it;
          const increment = Math.min(5 + Math.random() * 12, 100 - it.progress);
          const newProgress = Math.min(100, it.progress + increment);
          const remaining = Math.max(0, 100 - newProgress);
          const newEta = Math.ceil((remaining / (increment || 1)) * 0.5);
          const maybeFail = newProgress > 25 && Math.random() < 0.01;
          return {
            ...it,
            progress: newProgress,
            eta: newProgress >= 100 ? 0 : newEta,
            status: maybeFail ? "error" : newProgress >= 100 ? "success" : "uploading",
          };
        })
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const next: UploadItem[] = Array.from(files).map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      progress: 0,
      eta: 30,
      status: "uploading",
    }));
    setItems((prev) => [...next, ...prev]);
  }, []);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onFiles(e.dataTransfer.files);
  };

  const retry = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, progress: 0, eta: 30, status: "uploading" }
          : it
      )
    );
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const addFromUrl = () => {
    if (!url.trim()) return;
    try {
      const u = new URL(url.trim());
      const name = decodeURIComponent(u.pathname.split("/").pop() || "file");
      const fakeSize = 5 * 1024 * 1024; // 5 MB
      setItems((prev) => [
        {
          id: `${name}-${Date.now()}`,
          name,
          size: fakeSize,
          progress: 0,
          eta: 20,
          status: "uploading",
        },
        ...prev,
      ]);
      setUrl("");
    } catch (e) {
      // not a valid URL, ignore
    }
  };

  const hasItems = items.length > 0;

  const statusVariant = (s: UploadStatus) =>
    s === "success" ? "success" : s === "error" ? "destructive" : "info";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="cta" size="md">Open Uploader</Button>
      </DialogTrigger>
      <DialogContent className="sm:rounded-2xl p-0 max-w-xl shadow-soft animate-enter">
        <header className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>Uploaded project attachments</DialogDescription>
          </DialogHeader>
        </header>

        <main className="px-6 pb-2">
          {/* Dropzone - 16:9 dashed box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`group relative overflow-hidden rounded-2xl border-2 border-dashed transition-smooth ring-1 ring-transparent ${
              isDragging ? "border-primary bg-accent/40 ring-primary/30" : "border-border bg-accent/30 hover:ring-primary/20 hover:shadow-glow"
            }`}
          >
            <AspectRatio ratio={16 / 9} className="flex items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                  <FileIcon aria-hidden className="opacity-70" />
                </div>
                <div className="text-sm">Drag and drop your files</div>
                <p className="text-xs text-muted-foreground">{MAX_FILE_SIZE_LABEL}</p>
                <Button
                  variant="cta"
                  size="md"
                  onClick={() => inputRef.current?.click()}
                  className="px-5"
                >
                  Select files
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => onFiles(e.target.files)}
                />
              </div>
            </AspectRatio>
          </div>

          {/* Upload from URL */}
          <div className="mt-4">
            <div className="text-sm mb-2">Or upload from URL</div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={16} />
                <Input
                  aria-label="File URL"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="cta" size="md" onClick={addFromUrl}>Upload</Button>
            </div>
          </div>

          {/* Uploaded files list */}
          <div className="mt-6">
            <div className="mb-2 text-sm font-medium">Uploaded Files</div>
            <ScrollArea className="max-h-72 pr-2">
              <div className="flex flex-col gap-3">
                {items.map((it) => (
                  <article
                    key={it.id}
                    className="rounded-xl border bg-card px-4 py-3 shadow-sm transition-smooth hover:shadow-soft hover-scale"
                    aria-label={`${it.name} ${it.status}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                        <FileIcon size={18} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-medium">{it.name}</h3>
                          <div className="flex items-center gap-1.5">
                            {it.status === "error" ? (
                              <Button size="icon" variant="ghost" aria-label="Retry" onClick={() => retry(it.id)}>
                                <RotateCw className="opacity-70" />
                              </Button>
                            ) : null}
                            <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(it.id)}>
                              <Trash2 className="opacity-70" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatBytes(it.size)}</span>
                          <span>•</span>
                          <span>{Math.round(it.progress)}%</span>
                          <span>•</span>
                          <span className={
                            it.status === "success"
                              ? "text-success"
                              : it.status === "error"
                              ? "text-destructive"
                              : "text-info"
                          }>
                            {it.status === "success" && (
                              <>
                                <CheckCircle2 className="inline mr-1" size={14} /> Upload Successful | 100%
                              </>
                            )}
                            {it.status === "error" && (
                              <>
                                <XCircle className="inline mr-1" size={14} /> Upload failed
                              </>
                            )}
                            {it.status === "uploading" && `${it.eta}s sec left`}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Progress value={it.progress} variant={statusVariant(it.status)} className="h-1.5 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                {!hasItems && (
                  <p className="text-xs text-muted-foreground px-1">No files yet</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </main>

        <DialogFooter className="px-6 pb-6">
          <div className="flex w-full items-center justify-between gap-3">
            <DialogClose asChild>
              <Button variant="ghost" size="md">Cancel</Button>
            </DialogClose>
            <Button variant="cta" size="md">Attach files</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
