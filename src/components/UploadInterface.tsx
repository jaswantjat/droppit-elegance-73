import React, { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import {
  File as FileIcon,
  Trash2,
  RotateCw,
  Link,
  CheckCircle2,
  XCircle,
  Upload,
  X,
  Clock,
} from "lucide-react";
import { useUploadManager } from "@/hooks/use-upload-manager";
import { UploadFile } from "@/types/upload";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export default function UploadInterface() {
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, formatTime, formatFileSize } = useLanguage();

  const {
    files,
    addFiles,
    removeFile,
    retryFile,
    clearAll,
    getProgress,
    getResults,
    startBatchUpload, // ✅ NEW: Explicit upload trigger
    config,
  } = useUploadManager();

  const progress = getProgress();

  // ✅ NEW: Explicit upload handler - only triggered by button click
  const handleUploadClick = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast({
        title: t.noFiles,
        description: t.noFilesDescription,
        variant: "destructive",
      });
      return;
    }

    try {
      await startBatchUpload();
      toast({
        title: t.uploadStarted || "Upload Started",
        description: `${pendingFiles.length} files are being uploaded in a single batch`,
      });
    } catch (error) {
      toast({
        title: t.uploadFailed,
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
    }
  }, [files, startBatchUpload, toast, t]);

  const onFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const result = addFiles(fileList, t);

    if (result.errors.length > 0) {
      toast({
        title: t.uploadErrors,
        description: result.errors.slice(0, 3).join(", ") + (result.errors.length > 3 ? "..." : ""),
        variant: "destructive",
      });
    }

    if (result.addedFiles > 0) {
      toast({
        title: t.filesAdded,
        description: `${result.addedFiles} ${t.filesAddedDescription}`,
      });
    }
  }, [addFiles, toast, t]);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onFiles(e.dataTransfer.files);
  };

  const addFromUrl = async () => {
    if (!url.trim()) return;
    
    try {
      const response = await fetch(url.trim(), { method: 'HEAD' });
      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      
      if (!config.allowedTypes.some(type => contentType.includes(type.split('/')[1]))) {
        toast({
          title: t.invalidFileType,
          description: t.urlMustPointToImage,
          variant: "destructive",
        });
        return;
      }

      const fileName = decodeURIComponent(url.split('/').pop() || 'image');
      const fileSize = contentLength ? parseInt(contentLength) : 1024 * 1024; // Default 1MB
      
      // Create a mock file for URL uploads
      const mockFile = new File([''], fileName, { type: contentType });
      Object.defineProperty(mockFile, 'size', { value: fileSize });
      
      onFiles([mockFile] as any);
      setUrl("");
    } catch (error) {
      toast({
        title: t.invalidUrl,
        description: t.couldNotFetchUrl,
        variant: "destructive",
      });
    }
  };

  const handleAttachFiles = async () => {
    const results = await getResults();
    if (results.length === 0) {
      toast({
        title: t.noFiles,
        description: t.noFilesDescription,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: t.filesAttached,
      description: `${results.length} ${t.filesAttachedDescription}`,
    });
  };

  const getStatusIcon = (file: UploadFile) => {
    switch (file.status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'success':
        return t.uploadSuccessful;
      case 'error':
        return `${t.uploadFailed}${file.error ? `: ${file.error}` : ''}`;
      case 'uploading':
        return file.eta > 0 ? formatTime(file.eta) : t.uploading;
      case 'cancelled':
        return t.cancelled;
      case 'pending':
        return t.waitingInQueue;
      default:
        return t.unknown;
    }
  };

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'success': return t.success;
      case 'error': return t.error;
      case 'uploading': return t.uploading;
      case 'cancelled': return t.cancelled;
      case 'pending': return t.pending;
      default: return t.unknown;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border">
      {/* Header with Language Switcher */}
      <div className="px-6 pt-6 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.uploadFiles}</h1>
            <p className="text-muted-foreground mt-1">{t.uploadedProjectAttachments}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Dropzone */}
        <div className="mt-6">
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
                <div className="text-sm">{t.dragAndDropFiles}</div>
                <p className="text-xs text-muted-foreground">{t.maxFileSize}</p>
                <p className="text-xs text-muted-foreground">{t.allowedTypes}</p>
                <Button
                  variant="cta"
                  size="md"
                  onClick={() => inputRef.current?.click()}
                  className="px-5"
                >
                  {t.selectFiles}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </div>
            </AspectRatio>
          </div>
        </div>

        {/* Upload from URL */}
        <div className="mt-4">
          <div className="text-sm mb-2">{t.orUploadFromUrl}</div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={16} />
              <Input
                aria-label="File URL"
                placeholder={t.urlPlaceholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="cta" size="md" onClick={addFromUrl}>{t.upload}</Button>
          </div>
        </div>

        {/* Upload Queue */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">
              {t.uploadQueue} ({files.length}/{config.maxFiles})
            </div>
            {files.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-destructive"
              >
                {t.clearAll}
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-72 pr-2">
            <div className="flex flex-col gap-3">
              {files.map((file) => (
                <article
                  key={file.id}
                  className="rounded-xl border bg-card px-4 py-3 shadow-sm transition-smooth hover:shadow-soft"
                  aria-label={`${file.name} ${file.status}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                      {getStatusIcon(file)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-medium">{file.name}</h3>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={file.status === 'success' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                            {getStatusBadgeText(file.status)}
                          </Badge>
                          {file.status === "error" && (
                            <Button size="icon" variant="ghost" aria-label={t.retry} onClick={() => retryFile(file.id)}>
                              <RotateCw className="h-4 w-4 opacity-70" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" aria-label={t.remove} onClick={() => removeFile(file.id)}>
                            <Trash2 className="h-4 w-4 opacity-70" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{Math.round(file.progress)}%</span>
                        <span>•</span>
                        <span className={
                          file.status === "success"
                            ? "text-green-600"
                            : file.status === "error"
                            ? "text-red-600"
                            : file.status === "uploading"
                            ? "text-blue-600"
                            : "text-gray-600"
                        }>
                          {getStatusText(file)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Progress
                          value={file.progress}
                          className="h-1.5 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {files.length === 0 && (
                <p className="text-xs text-muted-foreground px-1">{t.noFilesYet}</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Overall Progress */}
        {progress.isUploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{t.overallProgress}</span>
              <span>{progress.completedFiles}/{progress.totalFiles} {t.filesCompleted} • {progress.overallProgress}%</span>
            </div>
            <Progress value={progress.overallProgress} className="h-2" />
          </div>
        )}

        {/* Upload Action Buttons */}
        <div className="mt-6 flex justify-center gap-3">
          {/* ✅ NEW: Explicit Upload Button - triggers batch upload */}
          <Button
            variant="cta"
            size="lg"
            onClick={handleUploadClick}
            disabled={progress.isUploading || files.filter(f => f.status === 'pending').length === 0}
            className="px-8"
          >
            {progress.isUploading
              ? `${t.uploading}...`
              : `${t.upload} ${files.filter(f => f.status === 'pending').length} Files`
            }
          </Button>

          {/* Attach Files Button - only shows after successful uploads */}
          {progress.completedFiles > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleAttachFiles}
              disabled={progress.isUploading}
              className="px-6"
            >
              {`${t.attachFiles} (${progress.completedFiles})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
