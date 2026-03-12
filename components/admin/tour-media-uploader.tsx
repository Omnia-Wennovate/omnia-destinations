"use client";

import React from "react"

import { useState, useRef, useCallback } from "react";
import {
  ImagePlus,
  Video,
  X,
  Loader2,
  Upload,
  AlertCircle,
  Check,
  Trash2,
  FileImage,
  FileVideo,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  uploadTourMedia,
  validateFile,
  getAcceptedFileTypes,
  type UploadProgress,
} from "@/lib/services/storage.service";

interface MediaItem {
  url: string;
  type: "image" | "video";
  fileName?: string;
}

interface TourMediaUploaderProps {
  tourId: string;
  existingMedia?: { images: string[]; videos: string[] };
  onMediaChange: (media: { images: string[]; videos: string[] }) => void;
  disabled?: boolean;
}

export function TourMediaUploader({
  tourId,
  existingMedia,
  onMediaChange,
  disabled = false,
}: TourMediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<
    Map<string, UploadProgress>
  >(new Map());
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const images = existingMedia?.images || [];
  const videos = existingMedia?.videos || [];
  const allMedia: MediaItem[] = [
    ...images.map((url) => ({ url, type: "image" as const })),
    ...videos.map((url) => ({ url, type: "video" as const })),
  ];

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Validate all files first
      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      // Upload each file
      for (const file of fileArray) {
        const fileKey = `${file.name}-${Date.now()}`;
        const fileType = file.type.startsWith("video/") ? "video" : "image";

        setUploads((prev) => {
          const next = new Map(prev);
          next.set(fileKey, {
            progress: 0,
            status: "uploading",
            fileName: file.name,
            fileType: fileType as "image" | "video",
          });
          return next;
        });

        try {
          const downloadURL = await uploadTourMedia(
            file,
            tourId,
            (progress) => {
              setUploads((prev) => {
                const next = new Map(prev);
                next.set(fileKey, progress);
                return next;
              });
            }
          );

          // Add to media list
          const newImages = fileType === "image" ? [...images, downloadURL] : images;
          const newVideos = fileType === "video" ? [...videos, downloadURL] : videos;
          onMediaChange({ images: newImages, videos: newVideos });

          // Remove from uploads after a delay
          setTimeout(() => {
            setUploads((prev) => {
              const next = new Map(prev);
              next.delete(fileKey);
              return next;
            });
          }, 2000);
        } catch (err: any) {
          setUploads((prev) => {
            const next = new Map(prev);
            next.set(fileKey, {
              progress: 0,
              status: "error",
              error: err?.message || "Upload failed",
              fileName: file.name,
              fileType: fileType as "image" | "video",
            });
            return next;
          });
        }
      }
    },
    [tourId, images, videos, onMediaChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const removeMedia = (url: string, type: "image" | "video") => {
    const newImages = type === "image" ? images.filter((u) => u !== url) : images;
    const newVideos = type === "video" ? videos.filter((u) => u !== url) : videos;
    onMediaChange({ images: newImages, videos: newVideos });
  };

  const activeUploads = Array.from(uploads.entries());
  const hasActiveUploads = activeUploads.some(
    ([, u]) => u.status === "uploading"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Media Gallery</CardTitle>
            <CardDescription>
              Upload images and videos for this tour ({images.length} images, {videos.length} videos)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <FileImage className="h-3 w-3" />
              {images.length}
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <FileVideo className="h-3 w-3" />
              {videos.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
            ${dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
            }
            ${disabled ? "opacity-50 pointer-events-none" : ""}
          `}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={getAcceptedFileTypes()}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Images: JPG, PNG, WebP, AVIF (max 10MB) | Videos: MP4, WebM, MOV (max 100MB)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent gap-1.5"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Add Images
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent gap-1.5"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Video className="h-3.5 w-3.5" />
                Add Videos
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Active Uploads */}
        {activeUploads.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Uploading
            </p>
            {activeUploads.map(([key, upload]) => (
              <div
                key={key}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
              >
                <div className="shrink-0">
                  {upload.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {upload.status === "complete" && (
                    <Check className="h-4 w-4 text-emerald-500" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm truncate text-foreground">
                      {upload.fileName}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] ml-2 shrink-0"
                    >
                      {upload.fileType}
                    </Badge>
                  </div>
                  {upload.status === "uploading" && (
                    <Progress value={upload.progress} className="h-1.5" />
                  )}
                  {upload.status === "error" && (
                    <p className="text-xs text-destructive">{upload.error}</p>
                  )}
                </div>
                {upload.status === "uploading" && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {Math.round(upload.progress)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Media Grid */}
        {allMedia.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Uploaded Media
              </p>
              <p className="text-xs text-muted-foreground">
                {allMedia.length} file{allMedia.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allMedia.map((item, idx) => (
                <div
                  key={item.url}
                  className="group relative aspect-video rounded-lg overflow-hidden border bg-muted"
                >
                  {item.type === "image" ? (
                    <img
                      src={item.url || "/placeholder.svg"}
                      alt={`Tour media ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="p-2 rounded-full bg-black/50">
                          <Video className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-1.5 left-1.5">
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${
                        item.type === "image"
                          ? "bg-blue-500/80 text-white border-0 hover:bg-blue-500/80"
                          : "bg-purple-500/80 text-white border-0 hover:bg-purple-500/80"
                      }`}
                    >
                      {item.type === "image" ? (
                        <FileImage className="h-2.5 w-2.5 mr-0.5" />
                      ) : (
                        <FileVideo className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      {item.type}
                    </Badge>
                  </div>

                  {/* Thumbnail index */}
                  {idx === 0 && (
                    <div className="absolute top-1.5 right-1.5">
                      <Badge className="text-[10px] px-1.5 py-0 bg-primary/80 text-primary-foreground border-0 hover:bg-primary/80">
                        Cover
                      </Badge>
                    </div>
                  )}

                  {/* Delete overlay */}
                  {!disabled && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        type="button"
                        onClick={() => removeMedia(item.url, item.type)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allMedia.length === 0 && activeUploads.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No media uploaded yet</p>
            <p className="text-xs mt-1">
              Upload images and videos to showcase this tour
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
