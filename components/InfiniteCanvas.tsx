"use client";
import { v4 as uuidv4 } from "uuid";
import {
  useUndo,
  useRedo,
  useCanUndo,
  useHistory,
  useCanRedo,
} from "@liveblocks/react";
import { Hand } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";

import {
  writeClipboard,
  readClipboard,
  ClipboardPayload,
} from "./CanvasModule/clipboard";
import SelectionGroup from "./CanvasModule/SelectionBox";
import { Shape as IShape, Position, ShapeType } from "./CanvasModule/types";
import { useSmartGuidesStore } from "./CanvasModule/hooks/useSmartGuidesStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

import { shapeRegistry } from "./CanvasModule/blocks/blockRegistry";
import { useShapeManager } from "./CanvasModule/hooks/useShapeManager";
import { useShapeDragging } from "./CanvasModule/hooks/useShapeDragging";
import { useShapeResizing } from "./CanvasModule/hooks/useShapeResizing";
import { useBorderSnapping } from "./CanvasModule/hooks/useBorderSnapping";
import { useCanvasTransform } from "./CanvasModule/hooks/useCanvasTransform";
import { useMarqueeSelection } from "./CanvasModule/hooks/useMarqueeSelection";
import { useShapeInteraction } from "./CanvasModule/hooks/useShapeInteraction";
import { useCanvasInteraction } from "./CanvasModule/hooks/useCanvasInteraction";
import { useConnectionManager } from "./CanvasModule/hooks/useConnectionManager";
import { SelectableConnectionArrow } from "./CanvasModule/SelectableConnectionArrow";
import { useRealtimeShapes } from "./CanvasModule/hooks/realtime/useRealtimeShapes";
import { useRealtimeConnections } from "./CanvasModule/hooks/realtime/useRealtimeConnections";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { Comments } from "./CanvasModule/Comments";
import { Button } from "./ui/button";
import { PlusIcon, SquarePlus, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ActiveUsersBar } from "./CanvasModule/live/ActiveUsersBar";
import { LiveCursors } from "./CanvasModule/live/LiveCursors";
import { ValueMapOverlay } from "./CanvasModule/ValueMapOverlay";
import NextImage from "next/image";
import { HelperQuestions } from "./CanvasModule/HelperQuestions";
import { HelperValueProp } from "./CanvasModule/HelperValueProp";
import { HelperAnalysis } from "./CanvasModule/HelperAnalysis";
import { OrthogonalArrow } from "./CanvasModule/OrthogonalArrow";

type RelativeAnchor = {
  x: number; // valor entre 0 y 1, representa el porcentaje del ancho
  y: number; // valor entre 0 y 1, representa el porcentaje del alto
};

type Connection = {
  fromShapeId: string;
  fromAnchor: { x: number; y: number }; // relative [0-1] range
  toShapeId: string;
  toAnchor: { x: number; y: number }; // relative [0-1] range
};

export function getAbsoluteAnchorPosition(
  shape: IShape,
  anchor: { x: number; y: number }
): Position {
  return {
    x: shape.x + shape.width * anchor.x,
    y: shape.y + shape.height * anchor.y,
  };
}

interface InfiniteCanvasProps {
  editable?: boolean;
  toolbarOptions?: {
    card: boolean;
    text: boolean;
    table: boolean;
    answer: boolean;
    ellipse: boolean;
    feature: boolean;
    question: boolean;
    rectangle: boolean;
    interview: boolean;
  };
}

export default function InfiniteCanvas({
  editable = true,
  toolbarOptions = {
    card: true,
    text: true,
    table: true,
    answer: true,
    ellipse: true,
    feature: true,
    question: true,
    rectangle: true,
    interview: true,
  },
}: InfiniteCanvasProps) {
  const pathname = usePathname();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string[]>([]);
  const { scale, canvasRef, position, setPosition, setScale, zoomIn, zoomOut } =
    useCanvasTransform();

  const isAnalysisCanvas = pathname.includes("/analysis");
  const isQuestionsCanvas = pathname.includes("/questions");
  const isMarketSegmentsCanvas = pathname.includes("/segments");
  const isValuePropCanvas = pathname.includes("/value-proposition");

  const [problems, setProblems] = useState(true);
  const [examples, setExamples] = useState(true);
  const [solutions, setSolutions] = useState(true);
  const [valueArea, setValueArea] = useState(false);
  const [panToolEnabled, setPanToolEnabled] = useState(false);

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { pause, resume } = useHistory();

  const [showGrid, setShowGrid] = useState(true);
  const [connecting, setConnecting] = useState<{
    fromShapeId: string;
    fromDirection: "top" | "right" | "bottom" | "left";
    fromPosition: { x: number; y: number };
  } | null>(null);

  // const [connections, setConnections] = useState<
  //   {
  //     fromShapeId: number;
  //     fromDirection: "top" | "right" | "bottom" | "left";
  //     toShapeId: number;
  //     toPoint: { x: number; y: number };
  //   }[]
  // >([]);
  // const [connections, setConnections] = useState<Connection[]>([]);

  const [connectingMousePos, setConnectingMousePos] = useState<Position | null>(
    null
  );

  const guides = useSmartGuidesStore((s) => s.guides);

  const [isDraggingConnector, setIsDraggingConnector] = useState(false);

  const {
    shapes,
    addShape,
    updateShape,
    updateMany,
    removeShapes,
    liveShapesReady,
  } = useRealtimeShapes();

  const {
    //shapes,
    setShapes,
    selectedShapeIds,
    setSelectedShapeIds,
    toggleSelection,
    selectOnly,
    clearSelection,
    getSelectedShapes,
    getGroupBounds,
    resizing,
    setResizing,
    dragging,
    setDragging,
    //addShape,
    //updateShape,
  } = useShapeManager(scale, position, shapes);

  const {
    connections,
    finalizeFromSnap,
    useConnectionEndpoints,
    selectConnection,
    selectedConnectionId,
    removeSelectedConnection,
    removeConnectionsByIds,
    removeConnection, // (for later)
    updateConnection, // (for later)
    addConnectionRelative, // (for later/manual adds)
  } = useConnectionManager();

  const connectionEndpoints = useConnectionEndpoints(shapes);

  // const { snapResult } = useBorderSnapping(connectingMousePos, shapes);
  const { snapResult } = useBorderSnapping(
    connectingMousePos,
    shapes,
    scale,
    connecting?.fromShapeId ?? null
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!editable) return;

      if (connecting) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left - position.x) / scale;
        const y = (e.clientY - rect.top - position.y) / scale;
        setConnectingMousePos({ x, y });

        if (!isDraggingConnector) setIsDraggingConnector(true);
      }
    };

    const handleMouseUp = () => {
      if (!editable) return;

      if (isDraggingConnector && connecting && snapResult?.shapeId) {
        const fromShape = shapes.find((s) => s.id === connecting.fromShapeId);
        const toShape = shapes.find((s) => s.id === snapResult.shapeId);

        if (!fromShape || !toShape) {
          setConnecting(null);
          setConnectingMousePos(null);
          setIsDraggingConnector(false);
          return;
        }

        finalizeFromSnap({
          connecting, // { fromShapeId, fromDirection, fromPosition }
          snapResult, // { shapeId, snappedPosition }
          shapes,
        });

        setConnecting(null);
        setConnectingMousePos(null);
        setIsDraggingConnector(false);
      }
    };

    if (connecting) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [connecting, position, scale, isDraggingConnector, snapResult, editable]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!editable) return;
      // if (
      //   (e.key === "Backspace" || e.key === "Delete") &&
      //   selectedConnectionId
      // ) {
      //   e.preventDefault();
      //   removeSelectedConnection();
      // }
      if (isTypingIntoField(e.target)) return;

      if (!isTypingIntoField(e.target) && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        setShowGrid((s) => !s);
        return;
      }

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo: Shift+Cmd/Ctrl+Z
          redo();
        } else {
          // Undo: Cmd/Ctrl+Z
          undo();
        }
        return;
      }
      // Windows-style redo: Ctrl+Y
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (meta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelection();
        return;
      }
      if (meta && e.key.toLowerCase() === "x") {
        e.preventDefault();
        cutSelection();
        return;
      }
      if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteFromClipboard();
        return;
      }
      // Duplicate: Cmd/Ctrl + D  (optional but handy)
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelection();
        return;
      }

      const isDelete = e.key === "Backspace" || e.key === "Delete";

      if (isDelete) {
        // If a connection is selected, delete that first (preserves your existing UX)
        if (selectedConnectionId) {
          e.preventDefault();
          removeSelectedConnection();
          return;
        }

        // Otherwise, delete shapes (and their connections)
        if (selectedShapeIds.length > 0) {
          e.preventDefault();
          //deleteSelectedShapes();
          const exampleShapeIds = shapes
            .filter(
              (shape) =>
                shape.type.includes("example") ||
                shape.subtype?.includes("example")
            )
            .map((s) => s.id);
          setShowDeleteConfirm(
            selectedShapeIds.filter((id) => !exampleShapeIds.includes(id))
          );
          return;
        }
      }

      // Optional: ESC clears connection selection (and your shape selection if you want)
      if (e.key === "Escape" && selectedConnectionId) {
        selectConnection(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedConnectionId,
    removeSelectedConnection,
    selectConnection,
    undo,
    redo,
    editable,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editable) return;

      if (e.key === "Escape") {
        setConnecting(null);
        setConnectingMousePos(null);
        setIsDraggingConnector(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editable]);

  // Panning & marquee selection
  const [isPanning, setIsPanning] = useState(false);
  const [canvasMousePos, setCanvasMousePos] = useState<Position>({
    x: 0,
    y: 0,
  });

  const {
    marquee,
    startMarquee,
    setLastMousePos: setMarqueeMousePos,
  } = useMarqueeSelection({
    scale,
    position,
    canvasRef,
    shapes,
    setSelectedShapeIds,
  });

  // const startMarqueeSafe = editable ? startMarquee : () => {};
  const startMarqueeSafe =
    editable && !panToolEnabled ? startMarquee : () => {};

  useShapeDragging({
    selectedShapeIds,
    setShapes,
    scale,
    updateMany,
    setLastMousePos: setCanvasMousePos,
    lastMousePos: canvasMousePos,
    shapes,
    dragging,
    setDragging,
  });

  useShapeResizing({
    resizing,
    setResizing,
    shapes,
    setShapes,
    updateShape,
    scale,
    lastMousePos: canvasMousePos,
    setLastMousePos: setCanvasMousePos,
  });

  useCanvasInteraction({
    canvasRef,
    setPosition,
    canvasMousePos,
    setCanvasMousePos,
    scale,
    setIsPanning,
    setResizing,
    setDragging,
    // startMarquee,
    startMarquee: startMarqueeSafe,
    setMarqueeMousePos,
    panToolEnabled,
  });

  const { handleShapeMouseDown, startResizing } = useShapeInteraction({
    toggleSelection,
    selectOnly,
    setDragging,
    setCanvasMousePos,
    setResizing,
  });

  // Shape ID generator
  const nextIdRef = useRef(1000);

  const handleConnectorMouseDown = (
    e: React.MouseEvent,
    shapeId: string,
    direction: "top" | "right" | "bottom" | "left"
  ) => {
    e.preventDefault();
    if (!editable) return;
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return;

    // Calculate the exact starting point of the arrow
    const shapeCenter = {
      x: shape.x + shape.width / 2,
      y: shape.y + shape.height / 2,
    };

    let fromX = shapeCenter.x;
    let fromY = shapeCenter.y;

    switch (direction) {
      case "top":
        fromY = shape.y;
        break;
      case "bottom":
        fromY = shape.y + shape.height;
        break;
      case "left":
        fromX = shape.x;
        break;
      case "right":
        fromX = shape.x + shape.width;
        break;
    }

    setConnecting({
      fromShapeId: shapeId,
      fromDirection: direction,
      fromPosition: { x: fromX, y: fromY },
    });

    // Prevent other interactions
    setDragging(false);
    setResizing(null);
  };

  const groupBounds = getGroupBounds();

  // helper: load a File as data URL
  function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  // helper: probe natural size from URL/dataURL
  function getImageSize(src: string): Promise<{ w: number; h: number }> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = rej;
      img.src = src;
    });
  }

  function bbox(of: IShape[]) {
    const xs = of.map((s) => s.x);
    const ys = of.map((s) => s.y);
    const xe = of.map((s) => s.x + s.width);
    const ye = of.map((s) => s.y + s.height);
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xe);
    const bottom = Math.max(...ye);
    return { left, top, width: right - left, height: bottom - top };
  }

  function toTemplate(s: IShape) {
    const { id, ...rest } = s as any;
    return rest as Omit<IShape, "id">;
  }

  // Where should pasted shapes land? At mouse if we have it; otherwise viewport center.
  function pasteAnchor() {
    if (canvasMousePos) return { x: canvasMousePos.x, y: canvasMousePos.y };
    const vw = canvasRef.current?.clientWidth ?? 0;
    const vh = canvasRef.current?.clientHeight ?? 0;
    return {
      x: (-position.x + vw / 2) / scale,
      y: (-position.y + vh / 2) / scale,
    };
  }

  // --- Shape creation ---
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editable) return;
    const type = e.dataTransfer.getData("shape-type") as ShapeType;
    if (!canvasRef.current) return;

    const dt = e.dataTransfer;
    const { x, y } = clientToWorld(e, canvasRef.current, position, scale);

    const files = Array.from(dt.files || []);
    const imageFile = files.find((f) => f.type && f.type.startsWith("image/"));
    console.log("files", files, imageFile);

    // 1) Local image file dropped
    if (imageFile) {
      const id = uuidv4();
      addShape("image", x, y, id); // provisional

      // quick local preview + base64 thumb
      const localUrl = URL.createObjectURL(imageFile);
      let natW = 320,
        natH = 240;
      try {
        const size = await getImageSize(localUrl); // your helper works with blob URLs too
        natW = size.w;
        natH = size.h;
      } catch {}

      const maxW = 480;
      const scaleFactor = natW > maxW ? maxW / natW : 1;
      const width = Math.max(40, Math.round(natW * scaleFactor));
      const height = Math.max(40, Math.round(natH * scaleFactor));

      // small base64 thumbnail for collaborators
      let preview: string | undefined;
      try {
        preview = await makeBase64Thumb(imageFile, 384);
      } catch {}

      // optimistic state
      pause();
      updateShape(id, (s) => ({
        ...s,
        src: localUrl, // visible immediately to you
        preview, // others see this while upload runs
        uploading: true,
        uploadProgress: 0,
        keepAspect: true,
        naturalWidth: natW,
        naturalHeight: natH,
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
        uploadError: undefined,
      }));
      resume();

      try {
        // real upload with progress
        const { url } = await uploadToSupabase(imageFile, (p) => {
          updateShape(id, (s) => ({ ...s, uploadProgress: p }));
        });

        // swap to canonical URL
        pause();
        updateShape(id, (s) => ({
          ...s,
          src: url,
          uploading: false,
          uploadProgress: 1,
        }));
        resume();
      } catch (err: any) {
        updateShape(id, (s) => ({
          ...s,
          uploading: false,
          uploadError: String(err?.message || err),
        }));
      } finally {
        // free the local object URL
        try {
          URL.revokeObjectURL(localUrl);
        } catch {}
      }
      return;
    }

    // 2) Dragged IMAGE URL (from web)
    const urlFromUriList = dt.getData("text/uri-list");
    let imageUrl = urlFromUriList || "";
    if (!imageUrl) {
      const text = dt.getData("text/plain");
      if (
        text &&
        /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(text)
      ) {
        imageUrl = text.trim();
      }
    }
    if (imageUrl) {
      const id = uuidv4();
      addShape("image", x, y, id);
      try {
        const { w: natW, h: natH } = await getImageSize(imageUrl);
        const maxW = 480;
        const scaleFactor = natW > maxW ? maxW / natW : 1;
        const width = Math.max(40, Math.round(natW * scaleFactor));
        const height = Math.max(40, Math.round(natH * scaleFactor));

        updateShape(id, (s) => ({
          ...s,
          src: imageUrl, // already a URL; you can optionally “import” to your storage later
          keepAspect: true,
          naturalWidth: natW,
          naturalHeight: natH,
          x: x - width / 2,
          y: y - height / 2,
          width,
          height,
        }));
      } catch (err) {
        removeShapes([id]);
        console.error("Failed to load dropped image URL", err);
      }
      return;
    }

    if (!type) return;

    // if (type === "feature_idea") {
    //   const SMALL_W = 140,
    //     SMALL_H = 64;
    //   const MAIN_W = 260,
    //     MAIN_H = 140;
    //   const GAP = 24;

    //   const labelId = uuidv4();
    //   const mainId = uuidv4();

    //   const labelX = x - GAP - SMALL_W;
    //   const labelY = y - SMALL_H / 2;

    //   const mainX = x + GAP;
    //   const mainY = y - MAIN_H / 2;

    //   pause();

    //   // create label
    //   addShape("rect", labelX, labelY, labelId);
    //   updateShape(labelId, (s) => ({
    //     ...s,
    //     width: SMALL_W,
    //     height: SMALL_H,
    //     text: "Trigger", // editable with your existing Rect text behavior
    //     color: "bg-blue-100", // optional default fill
    //   }));
    //   // create main
    //   addShape("feature_idea", mainX, mainY, mainId);
    //   updateShape(mainId, (s) => ({
    //     ...s,
    //     width: MAIN_W,
    //     height: MAIN_H,
    //   }));
    //   resume();

    //   addConnectionRelative({
    //     fromShapeId: labelId,
    //     toShapeId: mainId,
    //     fromAnchor: { x: 1, y: 0.5 }, // right middle
    //     toAnchor: { x: 0, y: 0.5 }, // left middle
    //     //fromSide: "right",
    //     //toSide: "left",
    //     //style: "curve", // or "orthogonal" if you added that toggle
    //   });

    //   return;
    // }

    addShape(type, x, y, uuidv4());
  };

  // tiny base64 preview (fast to sync via Liveblocks)
  async function makeBase64Thumb(file: File, max = 384): Promise<string> {
    const img = document.createElement("img");
    const blobUrl = URL.createObjectURL(file);
    await new Promise((res, rej) => {
      img.onload = () => res(null);
      img.onerror = rej;
      img.src = blobUrl;
    });
    const ratio = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(blobUrl);
    return canvas.toDataURL("image/jpeg", 0.7);
  }

  // plug your real uploader here (S3/Supabase/UploadThing/etc.)
  async function uploadToStorage(
    file: File,
    onProgress: (p: number) => void
  ): Promise<{ url: string }> {
    // Example pattern using an API route that returns { uploadUrl, fileUrl }
    const resp = await fetch(
      `/api/upload-url?filename=${encodeURIComponent(file.name)}`
    );
    if (!resp.ok) throw new Error("Failed to get upload URL");
    const { uploadUrl, fileUrl } = await resp.json();

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) onProgress(evt.loaded / evt.total);
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error("Upload failed"));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream"
      );
      xhr.send(file);
    });

    return { url: fileUrl };
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  function clientToWorld(
    e: React.DragEvent | React.MouseEvent,
    canvasEl: HTMLDivElement,
    position: { x: number; y: number },
    scale: number
  ) {
    const rect = canvasEl.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    return { x, y };
  }

  function isTypingIntoField(target: EventTarget | null) {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return !!el.closest('input, textarea, [contenteditable="true"]');
  }

  const deleteSelectedShapes = () => {
    //if (selectedShapeIds.length === 0) return;
    if (showDeleteConfirm.length === 0) return;

    const selectedShapeIds = showDeleteConfirm;

    // 1) Remove all arrows attached to any of these shapes
    removeConnectionsByIds(selectedShapeIds);

    // 2) Remove the shapes themselves
    removeShapes(selectedShapeIds);

    // 3) Clear selection & any in-progress connection
    clearSelection?.();
    setConnecting?.(null);
    setConnectingMousePos?.(null);
    setIsDraggingConnector?.(false);
  };

  async function copySelection() {
    if (!selectedShapeIds.length) return;
    const sel = shapes.filter((s) => selectedShapeIds.includes(s.id));
    if (!sel.length) return;

    const box = bbox(sel);
    const payload: ClipboardPayload<IShape> = {
      kind: "shapes-v1",
      createdAt: Date.now(),
      anchor: { x: box.left, y: box.top },
      shapes: sel,
    };
    await writeClipboard(payload);
  }

  async function cutSelection() {
    if (!selectedShapeIds.length) return;
    await copySelection();
    deleteSelectedShapes(); // you already have this
  }

  async function pasteFromClipboard() {
    const data = await readClipboard<ClipboardPayload<IShape>>();
    if (!data?.shapes?.length) return;

    const anchorTarget = pasteAnchor();
    const { left, top, width, height } = bbox(data.shapes);
    // center the pasted group under anchor
    const dx = anchorTarget.x - (left + width / 2);
    const dy = anchorTarget.y - (top + height / 2);

    const newIds: string[] = [];
    pause();
    try {
      for (const s of data.shapes) {
        const newId = uuidv4();
        newIds.push(newId);

        // create minimal shell at new position
        addShape(s.type as ShapeType, s.x + dx, s.y + dy, newId);
        // then patch full shape (keeps your Liveblocks adapter happy)
        updateShape(newId, () => ({
          ...toTemplate(s),
          id: newId,
          x: s.x + dx,
          y: s.y + dy,
        }));
      }
      setSelectedShapeIds(newIds);
    } finally {
      resume();
    }
  }

  async function duplicateSelection() {
    if (!selectedShapeIds.length) return;
    const sel = shapes.filter((s) => selectedShapeIds.includes(s.id));
    if (!sel.length) return;

    const ox = 24,
      oy = 24; // visible nudge
    const newIds: string[] = [];
    pause();
    try {
      for (const s of sel) {
        const newId = uuidv4();
        newIds.push(newId);
        addShape(s.type as ShapeType, s.x + ox, s.y + oy, newId);
        updateShape(newId, () => ({
          ...toTemplate(s),
          id: newId,
          x: s.x + ox,
          y: s.y + oy,
        }));
      }
      setSelectedShapeIds(newIds);
    } finally {
      resume();
    }
  }

  const GRID = 24;
  const MAJOR = GRID * 5;
  function getGridStyle(): React.CSSProperties | undefined {
    if (!showGrid) return undefined;

    // Convert world spacing -> screen pixels
    // Clamp to avoid subpixel/flicker at tiny zoom
    const minorPx = Math.max(8, Math.round(GRID * scale));
    const majorPx = Math.max(minorPx * 5, Math.round(MAJOR * scale));

    // Shift the repeating pattern with world pan so dots/lines stay “glued” to content
    const offset = `${Math.round(position.x)}px ${Math.round(position.y)}px`;

    // DOT grid (swap for line grid below if you prefer)
    // return {
    //   backgroundImage: `
    //     radial-gradient(circle at 1px 1px, rgba(17,24,39,0.12) 1px, transparent 1.5px),
    //     radial-gradient(circle at 1px 1px, rgba(17,24,39,0.18) 1px, transparent 1.5px)
    //   `,
    //   backgroundSize: `${minorPx}px ${minorPx}px, ${majorPx}px ${majorPx}px`,
    //   backgroundPosition: `${offset}, ${offset}`,
    // };

    // LINE grid alternative:
    return {
      backgroundImage: `
      linear-gradient(to right, rgba(17,24,39,0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(17,24,39,0.06) 1px, transparent 1px),
      linear-gradient(to right, rgba(17,24,39,0.10) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(17,24,39,0.10) 1px, transparent 1px)
    `,
      backgroundSize: `
      ${minorPx}px ${minorPx}px,
      ${minorPx}px ${minorPx}px,
      ${majorPx}px ${majorPx}px,
      ${majorPx}px ${majorPx}px
    `,
      backgroundPosition: `${offset}, ${offset}, ${offset}, ${offset}`,
    };
  }

  const onBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editable) return;
    if (e.button !== 0) return; // left click only
    clearSelection?.();
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    // convert client → world
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    setCanvasMousePos({ x, y });
  };

  const handleCanvasPointerLeave = () => {
    // so paste falls back to viewport center when cursor is outside
    setCanvasMousePos({ x: NaN, y: NaN }); // or set to null if you prefer
  };

  type Side = "top" | "right" | "bottom" | "left";

  function sideFromAnchor(a: {
    x: number;
    y: number;
  }): "top" | "right" | "bottom" | "left" {
    const dTop = a.y;
    const dBottom = 1 - a.y;
    const dLeft = a.x;
    const dRight = 1 - a.x;
    const min = Math.min(dTop, dBottom, dLeft, dRight);
    if (min === dTop) return "top";
    if (min === dBottom) return "bottom";
    if (min === dLeft) return "left";
    return "right";
  }

  return (
    <div className="w-full h-full overflow-hidden bg-[#EFF0F4] relative flex">
      <div className="absolute top-4 right-4 z-20 flex flex-row gap-6 bg-black p-2 rounded-md text-white">
        <div className="flex items-center gap-3 ">
          <Checkbox
            id="example"
            checked={examples}
            onCheckedChange={() => setExamples(!examples)}
            className={
              "data-[state=checked]:bg-white data-[state=checked]:text-black"
            }
          />
          <Label htmlFor="example">Examples</Label>
        </div>
      </div>

      {isValuePropCanvas && (
        <div className="absolute top-4 left-4 z-20 flex flex-row gap-6 bg-black p-2 rounded-md text-white">
          <div className="flex items-center gap-3 ">
            <Checkbox
              id="problems"
              checked={problems}
              onCheckedChange={() => setProblems(!problems)}
              className={
                "data-[state=checked]:bg-white data-[state=checked]:text-black"
              }
            />
            <Label htmlFor="problems">Problems</Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="solutions"
              checked={solutions}
              onCheckedChange={() => setSolutions(!solutions)}
              className={
                "data-[state=checked]:bg-white data-[state=checked]:text-black"
              }
            />
            <Label htmlFor="solutions">Solutions</Label>
          </div>

          {/* <div className="flex items-center gap-3">
            <Checkbox
              id="value-areas"
              checked={valueArea}
              onCheckedChange={() => setValueArea(!valueArea)}
              className={
                "data-[state=checked]:bg-white data-[state=checked]:text-black"
              }
            />
            <Label htmlFor="value-areas">Values Area</Label>
          </div> */}
        </div>
      )}

      {editable && (
        <div className="absolute bottom-4 right-4 z-20">
          <Comments />
        </div>
      )}

      <div className="absolute bottom-4 right-35 z-20">
        {isAnalysisCanvas && <HelperAnalysis />}
        {isQuestionsCanvas && <HelperQuestions />}
        {isValuePropCanvas && <HelperValueProp />}
      </div>

      <AlertDialog
        open={showDeleteConfirm.length > 0}
        onOpenChange={() => setShowDeleteConfirm([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              shape.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteSelectedShapes();
                setShowDeleteConfirm([]);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="absolute bottom-4 left-4 z-20 flex items-center flex-row gap-2">
        <Button
          variant={"default"}
          size={"icon"}
          className="size-8"
          onClick={zoomIn}
        >
          <ZoomInIcon />
        </Button>
        <Button
          variant={"default"}
          size={"icon"}
          className="size-8"
          onClick={zoomOut}
        >
          <ZoomOutIcon />
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <ActiveUsersBar maxVisible={3} includeSelf={false} />
      </div>

      <LiveCursors
        canvasRef={canvasRef}
        position={position}
        scale={scale}
        includeSelf={false}
        zIndex={550}
      />

      {/* Toolbar */}
      {editable && (
        <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 py-4 px-3 bg-white  rounded-2xl shadow flex flex-col gap-6 items-center">
          <button
            onClick={() => setPanToolEnabled((v) => !v)}
            className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl
    ${
      panToolEnabled
        ? "bg-blue-600 text-white"
        : "bg-transparent text-[#111827]"
    }
  `}
            title="Pan tool"
          >
            <Hand className="pointer-events-none" size={18} />
            <span className="text-[10px] font-bold opacity-60 pointer-events-none">
              Pan
            </span>
          </button>

          {toolbarOptions.rectangle && (
            <button
              draggable
              onDragStart={(e) => {
                console.log("e", e);

                e.dataTransfer.setData("shape-type", "rect");
              }}
              className="w-10 h-10 gap-1 flex flex-col items-center "
              title="Rectangle"
            >
              {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
              <NextImage
                src={"/rectangle.svg"}
                alt="Rectangle"
                width={20}
                height={20}
                className="pointer-events-none"
              />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Rectangle
              </span>
            </button>
          )}

          {toolbarOptions.ellipse && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "ellipse");
              }}
              className="w-10 h-10 gap-1 flex flex-col items-center "
              title="Ellipse"
            >
              {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
              <NextImage
                src={"/ellipse.svg"}
                alt="Ellipse"
                width={20}
                height={20}
                className="pointer-events-none"
              />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Ellipse
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "text");
          }}
          className="w-10 h-10 flex items-center justify-center bg-yellow-300 rounded text-black font-bold"
          title="Text"
        >
          Tx
        </button> */}

          {toolbarOptions.text && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "text");
              }}
              className="w-10 h-10 gap-1 flex flex-col items-center "
              title="Text"
            >
              {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
              <NextImage
                src={"/text.svg"}
                alt="Text"
                width={16}
                height={16}
                className="pointer-events-none"
              />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Text
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "interview");
          }}
          className="w-10 h-10 flex items-center justify-center bg-purple-300 rounded text-black font-bold"
          title="Interview"
        >
          In
        </button> */}

          {toolbarOptions.interview && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "interview");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Interview"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Interview
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "question");
          }}
          className="w-10 h-10 flex items-center justify-center bg-red-300 rounded text-black font-bold"
          title="Question"
        >
          Qs
        </button> */}

          {toolbarOptions.question && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "question");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Question"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Question
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "question_answer");
          }}
          className="w-10 h-10 flex items-center justify-center bg-amber-300 rounded text-black font-bold"
          title="Answer"
        >
          An
        </button> */}

          {toolbarOptions.answer && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "question_answer");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Answer"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Answer
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "table");
          }}
          className="w-10 h-10 flex items-center justify-center bg-pink-300 rounded text-black font-bold"
          title="Table"
        >
          Tb
        </button> */}
          {toolbarOptions.table && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "table");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Table"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Table
              </span>
            </button>
          )}

          {/* <button
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("shape-type", "feature_idea");
          }}
          className="w-10 h-10 flex items-center justify-center bg-indigo-300 rounded text-black font-bold"
          title="Feature Idea"
        >
          Fi
        </button> */}
          {toolbarOptions.feature && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "feature_idea");
              }}
              className="w-10 h-10  flex flex-col items-center "
              title="Feature Idea"
            >
              <SquarePlus className="text-[#111827] pointer-events-none" />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Feature
              </span>
            </button>
          )}

          {toolbarOptions.card && (
            <button
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("shape-type", "card");
              }}
              className="w-10 h-10 gap-1 flex flex-col items-center "
              title="Card"
            >
              {/* <SquarePlus className="text-[#111827] pointer-events-none" /> */}
              <NextImage
                src={"/card.svg"}
                alt="Card"
                width={20}
                height={20}
                className="pointer-events-none"
              />
              <span className="text-[10px] font-bold text-[#111827] opacity-60 pointer-events-none">
                Card
              </span>
            </button>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        // className="flex-1 relative"
        // className={`flex-1 relative ${panToolEnabled ? "cursor-grab" : ""}`}
        className={[
          "flex-1 relative",
          panToolEnabled ? "cursor-grab" : "",
          isPanning ? "cursor-grabbing" : "",
        ].join(" ")}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        onPointerMove={handleCanvasPointerMove}
        onPointerLeave={handleCanvasPointerLeave}
      >
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={getGridStyle()}
          />
        )}

        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <div className="absolute inset-0" onPointerDown={onBgPointerDown} />

          {/* Marquee selection */}
          {editable && marquee && (
            <div
              style={{
                position: "absolute",
                left: `${marquee.x}px`,
                top: `${marquee.y}px`,
                width: `${marquee.w}px`,
                height: `${marquee.h}px`,
                background: "rgba(96, 165, 250, 0.2)",
                border: "1px solid #60A5FA",
                zIndex: 100,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Group bounding box */}
          {editable && groupBounds && <SelectionGroup bounds={groupBounds} />}

          {connecting && connectingMousePos && (
            <CurvedArrow
              from={connecting.fromPosition}
              fromSide={connecting.fromDirection}
              toSide={snapResult?.side}
              to={snapResult?.snappedPosition ?? connectingMousePos}
            />
          )}

          {/* <ValueMapOverlay
            canvasRef={canvasRef}
            position={position}
            scale={scale}
            visible={valueArea}
            zIndex={1} // under shapes
          /> */}

          {connectionEndpoints
            .filter((endpoint) => {
              if (isValuePropCanvas) {
                if (!problems) {
                  const toShape = shapes.find(
                    (s) => s.id === endpoint.connection.toShapeId
                  );

                  if (
                    toShape?.type === "card" &&
                    (toShape.subtype === "jobs_to_be_done_card" ||
                      toShape.subtype === "gains_card" ||
                      toShape.subtype === "pains_card")
                  ) {
                    return false;
                  }
                }

                if (!solutions) {
                  const toShape = shapes.find(
                    (s) => s.id === endpoint.connection.toShapeId
                  );

                  if (
                    toShape?.type === "card" &&
                    (toShape.subtype === "products_services_card" ||
                      toShape.subtype === "gain_creators_card" ||
                      toShape.subtype === "pain_relievers_card")
                  ) {
                    return false;
                  }
                }
              }

              return true;
            })
            .map(
              ({
                id,
                from,
                to,
                fromSide,
                toSide,
                connection,
                fromRect,
                toRect,
              }) => {
                // const fromSide = sideFromAnchor(connection.fromAnchor);
                // const toSide = sideFromAnchor(connection.toAnchor);

                return (
                  // <SelectableConnectionArrow
                  //   key={id}
                  //   id={id}
                  //   from={from}
                  //   to={to}
                  //   zIndex={400}
                  //   fromSide={fromSide} // <- pass through
                  //   toSide={toSide} // <- pass through
                  //   selected={editable && selectedConnectionId === id}
                  //   onSelect={editable ? selectConnection : undefined}
                  //   layout="orthogonal"
                  // />
                  <OrthogonalArrow
                    key={id}
                    id={id}
                    from={from}
                    to={to}
                    zIndex={1}
                    fromSide={fromSide}
                    toSide={toSide}
                    fromRect={fromRect} // 👈 new
                    toRect={toRect}
                    selected={editable && selectedConnectionId === id}
                    onSelect={editable ? selectConnection : undefined}
                  />
                );
              }
            )}

          {shapes
            .filter((shape) => {
              if (!shape) return false;
              if (
                !examples &&
                (shape.type.includes("example") ||
                  shape.subtype?.includes("example"))
              )
                return false;
              if (isValuePropCanvas) {
                if (
                  shape.type === "text" ||
                  shape.type === "rect" ||
                  shape.type === "ellipse"
                ) {
                  return true;
                }

                if (!problems) {
                  if (
                    shape.type === "card" &&
                    (shape.subtype === "jobs_to_be_done_card" ||
                      shape.subtype === "gains_card" ||
                      shape.subtype === "pains_card")
                  ) {
                    return false;
                  }
                }

                if (!solutions) {
                  if (
                    shape.type === "card" &&
                    (shape.subtype === "products_services_card" ||
                      shape.subtype === "gain_creators_card" ||
                      shape.subtype === "pain_relievers_card")
                  ) {
                    return false;
                  }
                }
              }

              return true;
            })
            .map((shape) => {
              const Component = shapeRegistry[shape.type];
              if (!Component) return null;

              return (
                <Component
                  key={shape.id}
                  shape={shape}
                  interactive={editable}
                  //renderHandles={renderHandles}
                  onResizeStart={startResizing}
                  selectedCount={selectedShapeIds.length}
                  isSelected={selectedShapeIds.includes(shape.id)}
                  onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                  onConnectorMouseDown={handleConnectorMouseDown}
                  //@ts-ignore
                  onCommitText={(id, text) =>
                    updateShape(id, (s) => ({
                      ...s,
                      // keep empty strings if user clears the text; Liveblocks adapter already null-coalesces
                      text,
                    }))
                  }
                  //@ts-ignore
                  onCommitInterview={(id, patch) =>
                    updateShape(id, (s) => ({ ...s, ...patch }))
                  }
                  //@ts-ignore
                  onCommitTable={(id, patch) =>
                    updateShape(id, (s) => ({ ...s, ...patch }))
                  }
                  //@ts-ignore
                  onChangeTags={(id, names) => {
                    updateShape(id, (s) => ({ ...s, tags: names }));
                  }}
                  //@ts-ignore
                  onCommitStyle={(id, patch) => {
                    updateShape(id, (s) => ({ ...s, ...patch })); // your existing immutable updater
                  }}
                />
              );
            })}

          {/* Smart Guides */}
          {guides.map((g, i) =>
            g.type === "v" ? (
              <div
                key={`vg-${i}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${g.x}px`,
                  top: `${Math.min(g.fromY, g.toY)}px`,
                  width: "0px",
                  height: `${Math.abs(g.toY - g.fromY)}px`,
                  borderLeft: "1px dashed #60A5FA",
                  zIndex: 250, // above shapes, below handles if you want
                }}
              />
            ) : (
              <div
                key={`hg-${i}`}
                className="absolute pointer-events-none"
                style={{
                  top: `${g.y}px`,
                  left: `${Math.min(g.fromX, g.toX)}px`,
                  height: "0px",
                  width: `${Math.abs(g.toX - g.fromX)}px`,
                  borderTop: "1px dashed #60A5FA",
                  zIndex: 250,
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
type Side = "top" | "right" | "bottom" | "left";

type CurvedArrowProps = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Optional: which side of the source/target shape the arrow attaches to */
  fromSide?: Side;
  toSide?: Side;
  color?: string;
  strokeWidth?: number;
  zIndex?: number;
  /** How “curvy” the line is in px. Defaults to 40. */
  bend?: number;
};

function computePreviewOrthogonalPoints(
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  fromSide?: Side,
  toSide?: Side
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  pts.push({ x: fx, y: fy });

  const dx = tx - fx;
  const dy = ty - fy;

  const axisOf = (side?: Side): "h" | "v" | null => {
    if (!side) return null;
    if (side === "left" || side === "right") return "h";
    return "v"; // top / bottom
  };

  const fromAxis = axisOf(fromSide);
  const toAxis = axisOf(toSide);

  if (!fromAxis || !toAxis || Math.abs(dx) < 4 || Math.abs(dy) < 4) {
    pts.push({ x: tx, y: ty });
    return pts;
  }

  if (fromAxis === toAxis) {
    if (fromAxis === "h") {
      const midX = fx + dx / 2;
      pts.push({ x: midX, y: fy });
      pts.push({ x: midX, y: ty });
    } else {
      const midY = fy + dy / 2;
      pts.push({ x: fx, y: midY });
      pts.push({ x: tx, y: midY });
    }
    pts.push({ x: tx, y: ty });
    return pts;
  }

  if (fromAxis === "h" && toAxis === "v") {
    pts.push({ x: tx, y: fy });
    pts.push({ x: tx, y: ty });
    return pts;
  }

  if (fromAxis === "v" && toAxis === "h") {
    pts.push({ x: fx, y: ty });
    pts.push({ x: tx, y: ty });
    return pts;
  }

  pts.push({ x: tx, y: ty });
  return pts;
}

export const CurvedArrow: React.FC<CurvedArrowProps> = ({
  from,
  to,
  fromSide,
  toSide,
  color = "#3B82F6",
  strokeWidth = 2,
  zIndex = 50,
  bend = 40,
}) => {
  const OUT = 6;

  // Bounding box (with padding) so the SVG is small & absolutely positioned
  const pad = 40;
  const minX = Math.min(from.x, to.x) - pad;
  const minY = Math.min(from.y, to.y) - pad;
  const maxX = Math.max(from.x, to.x) + pad;
  const maxY = Math.max(from.y, to.y) + pad;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  // Local coords
  const fx = from.x - minX;
  const fy = from.y - minY;
  const tx = to.x - minX;
  const ty = to.y - minY;

  // Unit normals for each side (pointing outward from shape border)
  const normalFor = (side?: Side) => {
    switch (side) {
      case "top":
        return { nx: 0, ny: -1 };
      case "bottom":
        return { nx: 0, ny: 1 };
      case "left":
        return { nx: -1, ny: 0 };
      case "right":
        return { nx: 1, ny: 0 };
      default:
        return null;
    }
  };

  // Control points: if we know the side, push the control point along that side’s normal
  // so the tangent at the endpoint points in/out of the border.
  const fromN = normalFor(fromSide);
  const toN = normalFor(toSide);

  // Small offset out of the shapes, same idea as final arrow
  const fx1 = fromN ? fx + fromN.nx * OUT : fx;
  const fy1 = fromN ? fy + fromN.ny * OUT : fy;
  const tx1 = toN ? tx + toN.nx * OUT : tx;
  const ty1 = toN ? ty + toN.ny * OUT : ty;

  // ORTHOGONAL preview path
  const pts = computePreviewOrthogonalPoints(
    fx1,
    fy1,
    tx1,
    ty1,
    fromSide,
    toSide
  );

  const d =
    pts.length > 0
      ? `M ${pts[0].x},${pts[0].y}` +
        pts
          .slice(1)
          .map((p) => ` L ${p.x},${p.y}`)
          .join("")
      : `M ${fx1},${fy1} L ${tx1},${ty1}`;

  // Unique marker id per instance so previews don't conflict
  const markerId = useMemo(
    () => `arrowhead-preview-${Math.random().toString(36).slice(2)}`,
    []
  );

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
      }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>

      <path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
};
