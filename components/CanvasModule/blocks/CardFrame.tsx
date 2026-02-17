"use client";

import React, { useEffect, useRef, useState } from "react";

import { v4 as uuidv4 } from "uuid";
import { Attachment, Kind, Shape, ShapeComponent } from "../types";
import { ShapeFrame, ShapeFrameProps } from "./BlockFrame";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileTextIcon,
  Paperclip,
  Play,
  PlayIcon,
  PlusIcon,
  X,
  XIcon,
} from "lucide-react";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { AttachmentTileDialog } from "../AttachmentTile";

type CardFrame = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: Shape;
  body: React.ReactNode;
  header: React.ReactNode;
  headerBg?: string;
  headerTextColor?: string;
  useAttachments?: boolean;
  onCommitStyle?: (id: string, patch: Partial<Shape>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export const CardFrame: React.FC<CardFrame> = (props) => {
  const {
    shape,
    body,
    header,
    onCommitStyle,
    useAttachments = true,
    headerBg = "#6A35FF",
    headerTextColor = "#FFFFFF",
    onClick,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments: Attachment[] = Array.isArray((shape as any).attachments)
    ? ((shape as any).attachments as Attachment[])
    : [];

  const attRef = useRef<Attachment[]>(attachments);
  useEffect(() => {
    attRef.current = attachments;
  }, [attachments]);

  const commit = (patch: Partial<Shape>) => onCommitStyle?.(shape.id, patch);

  function setAttachments(next: Attachment[]) {
    commit({ attachments: next as any });
  }

  function setAttachmentsNext(
    next: Attachment[] | ((prev: Attachment[]) => Attachment[]),
  ) {
    const base = attRef.current ?? [];
    const value = typeof next === "function" ? next(base) : next;
    commit({ attachments: value as any });
  }

  function upsertAttachment(id: string, patch: Partial<Attachment>) {
    setAttachmentsNext((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }

  function removeAttachment(id: string) {
    setAttachmentsNext((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleFiles(files: FileList | File[]) {
    // const uploadedFiles = Array.from(files).filter((f) => /^image\//.test(f.type));
    const uploadedFiles = Array.from(files);
    if (uploadedFiles.length === 0) return;

    for (const file of uploadedFiles) {
      const id = uuidv4();
      const name = file.name;
      const mime = file.type || "application/octet-stream";
      const ext = name.split(".").pop()?.toLowerCase();
      const kind = getKind(mime, ext);
      const size = file.size;

      const localUrl = URL.createObjectURL(file);
      let preview: string | undefined;
      try {
        // preview = await makeBase64Thumb(file, 320);
        if (kind === "image") {
          preview = await makeImageThumb(file, 320);
        } else if (kind === "video") {
          preview = await makeVideoPoster(localUrl, 320);
        } else if (kind === "pdf") {
          preview = await makeLabelThumb("PDF", "#FDE68A", 220, 140); // amber
        } else {
          preview = await makeLabelThumb(
            (ext || "FILE").toUpperCase(),
            "#E5E7EB",
            220,
            140,
          ); // gray
        }
      } catch {
        preview = await makeLabelThumb(
          (ext || "FILE").toUpperCase(),
          "#E5E7EB",
          220,
          140,
        );
      }

      // 👇 add using functional update (no stale array)
      setAttachmentsNext((prev) => [
        ...prev,
        // {
        //   id,
        //   name,
        //   mime,
        //   url: localUrl, // instant local preview for *this* user
        //   preview, // tiny preview so collaborators see something
        //   uploading: true,
        //   progress: 0,
        //   createdAt: Date.now(),
        // },
        {
          id,
          name,
          mime,
          kind,
          size,
          ext,
          url: kind === "image" ? localUrl : localUrl, // use local preview for all kinds
          preview,
          uploading: true,
          progress: 0,
          createdAt: Date.now(),
        },
      ]);

      try {
        let last = 0;
        const { url } = await uploadToSupabase(file, (p) => {
          // throttle updates a bit
          if (p - last >= 0.05 || p === 1) {
            last = p;
            upsertAttachment(id, { progress: p });
          }
        });

        // swap to canonical URL
        upsertAttachment(id, { url, uploading: false, progress: 1 });

        try {
          URL.revokeObjectURL(localUrl);
        } catch {}
      } catch {
        // mark failed
        upsertAttachment(id, { uploading: false });
      }
    }
  }

  function onPickClick(e: React.MouseEvent) {
    e.stopPropagation();
    fileInputRef.current?.click();
  }

  function onDropAttachments(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  function openPreviewById(id: string) {
    const i = attachments.findIndex((a) => a.id === id);
    if (i >= 0) {
      setPreviewIndex(i);
      setPreviewOpen(true);
    }
  }

  return (
    <ShapeFrame
      {...props}
      resizable={false}
      interactive={props.interactive ?? true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div
        className="w-full bg-white border-1 border-[#B4B9C9] rounded-xl flex flex-col overflow-hidden shadow-[0px_4px_33.3px_0px_rgba(30,39,143,0.2)]"
        onClick={onClick}
      >
        {/* Header */}
        <div
          className={`px-3 py-2 font-semibold text-[14px] flex items-start justify-between break-words whitespace-normal`}
          style={{ backgroundColor: headerBg, color: headerTextColor }}
        >
          {header}
        </div>

        {body}
        {/* <Component {...props} /> */}

        {/* Attachments */}
        {useAttachments && (
          <>
            <div className="bg-[#DDE1F2] h-full px-10 pt-6 pb-6 border-t-1 border-[#B4B9C9]">
              <div className="flex items-center justify-center mb-8">
                <button
                  type="button"
                  onClick={onPickClick}
                  className="flex items-center gap-2 text-[#6B46C1] hover:text-[#5B21B6] transition-colors cursor-pointer"
                  title="Add attachment"
                >
                  <span className="text-sm font-medium">+ add attachment</span>
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              {/* Hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf,*/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length) handleFiles(files);
                  // reset so picking the same file again still fires change
                  e.currentTarget.value = "";
                }}
              />

              {/* Attachments list */}
              <div className="space-y-3 flex flex-wrap">
                {(attachments ?? []).map((att) => (
                  <AttachmentTile
                    key={att.id}
                    att={att}
                    onOpen={openPreviewById}
                    onRemove={() => removeAttachment(att.id)}
                  />
                ))}
              </div>
            </div>
            <AttachmentPreviewModal
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              //@ts-ignore
              items={attachments.map((a) => ({
                id: a.id,
                name: a.name,
                url: a.url ? a.url : a.preview, // show local preview if still uploading
                mime: a.mime,
                size: a.size,
              }))}
              index={previewIndex}
              setIndex={setPreviewIndex}
            />
          </>
        )}
      </div>
    </ShapeFrame>
  );
};

function getKind(mime: string, ext?: string): Kind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  return "file";
}

function renderThumb(att: Attachment) {
  const src = att.url || att.preview;
  if (att.kind === "image" && src) {
    return (
      <img
        src={src}
        alt={att.name}
        className="w-full h-full object-cover"
        draggable={false}
      />
    );
  }
  if (att.kind === "video") {
    return (
      <div className="w-full h-full relative bg-black/5">
        {att.preview ? (
          <img
            src={att.preview}
            alt={att.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-gray-500">
            {att.ext?.toUpperCase() || "VIDEO"}
          </div>
        )}
        <div className="absolute inset-0 grid place-items-center">
          <div className="bg-white/80 rounded-full p-1.5">
            <PlayIcon className="w-4 h-4 text-gray-800" />
          </div>
        </div>
      </div>
    );
  }
  if (att.kind === "pdf") {
    return (
      <div className="w-full h-full grid place-items-center bg-amber-50 text-amber-800">
        <div className="flex flex-col items-center gap-1">
          <FileTextIcon className="w-5 h-5" />
          <span className="text-[10px] font-semibold">PDF</span>
        </div>
      </div>
    );
  }
  // generic file
  return (
    <div className="w-full h-full grid place-items-center bg-gray-50 text-gray-600">
      <div className="text-[10px] font-semibold">
        {(att.ext || "FILE").toUpperCase()}
      </div>
    </div>
  );
}

/* ---------- Preview helpers ---------- */

// Image → base64 thumb
async function makeImageThumb(file: File, max = 320): Promise<string> {
  const bmp = await fileToImageBitmap(file);
  const ratio = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * ratio));
  const h = Math.max(1, Math.round(bmp.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);
  try {
    (bmp as any).close?.();
  } catch {}
  return canvas.toDataURL("image/jpeg", 0.7);
}

function fileToImageBitmap(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        createImageBitmap(img).then(resolve).catch(reject);
      };
      img.onerror = reject;
      img.src = String(fr.result);
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// Video → capture first frame as poster
async function makeVideoPoster(objectUrl: string, max = 320): Promise<string> {
  const video = document.createElement("video");
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  await videoLoadedMeta(video);
  try {
    await videoSeekTo(video, Math.min(0.1, (video.duration || 1) * 0.1));
  } catch {}
  const w0 = video.videoWidth || 320;
  const h0 = video.videoHeight || 240;
  const ratio = Math.min(1, max / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * ratio));
  const h = Math.max(1, Math.round(h0 * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.7);
}
function videoLoadedMeta(v: HTMLVideoElement) {
  return new Promise<void>((res, rej) => {
    const onErr = () => rej(new Error("video error"));
    v.onloadedmetadata = () => res();
    v.onerror = onErr;
  });
}
function videoSeekTo(v: HTMLVideoElement, t: number) {
  return new Promise<void>((res, rej) => {
    const onSeeked = () => {
      v.removeEventListener("seeked", onSeeked);
      res();
    };
    v.addEventListener("seeked", onSeeked);
    v.currentTime = t;
  });
}

// Label tile (for PDFs & generic files)
async function makeLabelThumb(
  label: string,
  bg = "#E5E7EB",
  w = 220,
  h = 140,
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 28px ui-sans-serif, system-ui, -apple-system";
  const tw = ctx.measureText(label).width;
  ctx.fillText(label, (w - tw) / 2, h / 2 + 10);
  return canvas.toDataURL("image/png");
}

function AttachmentTile({
  att,
  onOpen,
  onRemove,
}: {
  att: Attachment;
  onRemove: () => void;
  onOpen: (id: string) => void;
}) {
  const src = att.url ? att.url : att.preview;

  const open = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen(att.id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div
      className="relative bg-[#F0F3FD] rounded-lg shadow-sm border border-gray-200 p-2 flex items-center gap-2 hover:shadow-md transition-shadow cursor-pointer w-78 h-16 mr-2"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={open}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
        {isImage(att.mime) ? (
          <img
            src={att.preview || att.url}
            alt={att.name}
            className="object-cover w-full h-full"
            draggable={false}
          />
        ) : isVideo(att.mime) ? (
          <div className="w-full h-full grid place-items-center bg-gray-200">
            <Play className="w-5 h-5 text-gray-600" />
          </div>
        ) : isPdf(att.mime) ? (
          <div className="w-full h-full grid place-items-center bg-red-100">
            <FileTextIcon className="w-6 h-6 text-red-600" />
          </div>
        ) : (
          <div className="w-full h-full grid place-items-center bg-gray-200">
            <FileTextIcon className="w-6 h-6 text-gray-600" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {att.name}
        </div>
        <div className="text-xs text-gray-500">
          {att.size ? formatFileSize(att.size) : "Unknown size"}
        </div>
      </div>

      {/* Download button */}
      <a
        href={att.url}
        target="_blank"
        rel="noreferrer"
        download
        title="Download"
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <Download className="w-4 h-4 text-gray-600" />
      </a>

      {/* Remove button */}
      <button
        title="Remove"
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <XIcon className="w-4 h-4 text-gray-600" />
      </button>

      {/* Progress */}
      {att.uploading && (
        <div className="absolute inset-0 bg-white/80 grid place-items-end rounded-lg">
          <div className="w-full h-1 bg-gray-200 rounded-b-lg">
            <div
              className="h-1 bg-indigo-500 transition-[width] rounded-b-lg"
              style={{ width: `${Math.round((att.progress ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

async function makeBase64Thumb(file: File, max = 320): Promise<string> {
  const bmp = await fileToImageBitmap(file);
  const ratio = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * ratio));
  const h = Math.max(1, Math.round(bmp.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  try {
    (bmp as any).close?.();
  } catch {}
  return dataUrl;
}

function formatBytes(bytes?: number) {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1,
  );
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function isImage(mime = "", url = "") {
  return (
    mime.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(url)
  );
}
export function isVideo(mime = "", url = "") {
  return mime.startsWith("video/") || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url);
}
export function isPdf(mime = "", url = "") {
  return mime === "application/pdf" || /\.pdf(\?|#|$)/i.test(url);
}

export function AttachmentPreviewModal({
  open,
  onClose,
  items,
  index,
  setIndex,
}: {
  open: boolean;
  onClose: () => void;
  items: Attachment[];
  index: number;
  setIndex: (i: number) => void;
}) {
  const att = items[index];

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIndex((index - 1 + items.length) % items.length);
      if (e.key === "ArrowRight") setIndex((index + 1) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, items.length]);

  if (!open || !att) return null;

  const showImage = isImage(att.mime, att.url);
  const showVideo = isVideo(att.mime, att.url);
  const showPdf = isPdf(att.mime, att.url);

  return (
    <div
      className="fixed inset-0 z-[1000000] bg-black/70 flex items-center justify-center"
      data-nodrag="true"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        // close if clicking backdrop (not the content)
        if (e.currentTarget === e.target) onClose();
      }}
    >
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm px-3 py-1.5 rounded bg-black/50">
        {att.name} {att.size ? `• ${formatBytes(att.size)}` : ""}
      </div>
      <button
        className="absolute top-3 right-3 p-2 rounded hover:bg-white/10 text-white"
        title="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="w-5 h-5" />
      </button>

      {items.length > 1 && (
        <>
          <button
            className="absolute left-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
            title="Previous"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((index - 1 + items.length) % items.length);
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white"
            title="Next"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((index + 1) % items.length);
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div
        className="w-auto z-[1000000] h-auto bg-transparent rounded shadow-lg overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {showImage && (
          <img
            src={att.url}
            alt={att.name}
            className="object-contain select-none"
            draggable={false}
          />
        )}

        {showVideo && (
          <video
            src={att.url}
            className=""
            controls
            autoPlay
            preload="metadata"
          />
        )}

        {showPdf && (
          // <div className="bg-white max-w-[90vw] max-h-[85vh] w-[80vw] h-[80vh]">
          //   {/* Try to embed; some hosts may set headers that prevent inline PDF */}
          //   <iframe src={att.url} className="w-full h-full" title={att.name} />
          // </div>
          <div className="w-[80vw] max-w-[640px] h-[40vh] max-h-[360px] flex items-center justify-center">
            <a
              href={att.url}
              download
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="group inline-flex flex-col items-center justify-center gap-3 px-6 py-6 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20"
              title={`Download ${att.name}`}
              aria-label={`Download ${att.name}`}
            >
              {/* Big download icon */}
              <svg
                className="w-14 h-14 text-white/90 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              <span className="text-white/90 text-sm">Download PDF</span>
            </a>
          </div>
        )}

        {!showImage && !showVideo && !showPdf && (
          <div className="bg-white max-w-[90vw] max-h-[85vh] w-[420px] p-6 flex flex-col items-center gap-4">
            <div className="text-sm text-gray-700 break-all text-center">
              {att.name}
            </div>
            <div className="text-xs text-gray-500">
              {att.mime || "application/octet-stream"}
            </div>
            <div className="flex gap-2">
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-800"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              >
                Open in new tab
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
