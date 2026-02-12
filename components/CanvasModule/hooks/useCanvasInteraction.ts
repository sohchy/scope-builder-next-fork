// CanvasModule/hooks/useCanvasInteraction.ts
import { useEffect, useRef } from "react";
import { Position, Shape } from "../types";

interface UseCanvasInteractionProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  setPosition: React.Dispatch<React.SetStateAction<Position>>;
  setCanvasMousePos: React.Dispatch<React.SetStateAction<Position>>;
  canvasMousePos: Position;
  scale: number;
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>;
  setResizing: React.Dispatch<
    React.SetStateAction<null | { id: string; handle: string }>
  >;
  setDragging: React.Dispatch<React.SetStateAction<boolean>>;
  startMarquee: (x: number, y: number) => void;
  setMarqueeMousePos: (pos: { x: number; y: number }) => void;
  panToolEnabled?: boolean;
}

export function useCanvasInteraction({
  canvasRef,
  setPosition,
  canvasMousePos,
  setCanvasMousePos,
  scale,
  setIsPanning,
  setResizing,
  setDragging,
  startMarquee,
  setMarqueeMousePos,
  panToolEnabled = false,
}: UseCanvasInteractionProps) {
  const isPanningRef = useRef(false);

  // useEffect(() => {
  //   const handleMouseDown = (e: MouseEvent) => {
  //     const target = e.target as HTMLElement;
  //     if (target.draggable) return;
  //     if (target.closest('[data-handle="true"]')) return;

  //     if (panToolEnabled && e.button === 0) {
  //       e.preventDefault();
  //       setIsPanning(true);
  //       setCanvasMousePos({ x: e.clientX, y: e.clientY });
  //       return;
  //     }

  //     // Middle mouse → panning
  //     if (e.button === 1) {
  //       e.preventDefault();
  //       setIsPanning(true);
  //       setCanvasMousePos({ x: e.clientX, y: e.clientY });
  //       return;
  //     }

  //     // Group drag area
  //     if (target.dataset.groupdrag === "true") {
  //       setDragging(true);
  //       setCanvasMousePos({ x: e.clientX, y: e.clientY });
  //       return;
  //     }

  //     // Start marquee
  //     if (!target.dataset.shapeid && !target.dataset.handle) {
  //       startMarquee(e.clientX, e.clientY);
  //       setMarqueeMousePos({ x: e.clientX, y: e.clientY });
  //     }
  //   };

  //   const handleMouseMove = (e: MouseEvent) => {
  //     if (e.buttons === 0) return; // Skip if no button is held (helps prevent ghost events)

  //     // Panning
  //     if (e.button === 1 || e.buttons === 4) {
  //       const dx = e.clientX - canvasMousePos.x;
  //       const dy = e.clientY - canvasMousePos.y;
  //       setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  //       setCanvasMousePos({ x: e.clientX, y: e.clientY });
  //     }
  //   };

  //   const handleMouseUp = () => {
  //     setResizing(null);
  //     setIsPanning(false);
  //     setDragging(false);
  //   };

  //   window.addEventListener("mousedown", handleMouseDown);
  //   window.addEventListener("mousemove", handleMouseMove);
  //   window.addEventListener("mouseup", handleMouseUp);

  //   return () => {
  //     window.removeEventListener("mousedown", handleMouseDown);
  //     window.removeEventListener("mousemove", handleMouseMove);
  //     window.removeEventListener("mouseup", handleMouseUp);
  //   };
  // }, [
  //   setPosition,
  //   canvasMousePos,
  //   setCanvasMousePos,
  //   scale,
  //   setIsPanning,
  //   setResizing,
  //   setDragging,
  //   startMarquee,
  //   setMarqueeMousePos,
  // ]);
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // only if click is inside the canvas
      const canvasEl = canvasRef.current;
      if (!canvasEl || !canvasEl.contains(target)) return;

      if (target.draggable) return;
      if (target.closest('[data-handle="true"]')) return;

      // ✅ Pan tool: left mouse drag pans
      if (panToolEnabled && e.button === 0) {
        e.preventDefault();
        isPanningRef.current = true;
        setIsPanning(true);
        setCanvasMousePos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Middle mouse → panning
      if (e.button === 1) {
        e.preventDefault();
        isPanningRef.current = true;
        setIsPanning(true);
        setCanvasMousePos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Group drag area
      if (target.dataset.groupdrag === "true") {
        setDragging(true);
        setCanvasMousePos({ x: e.clientX, y: e.clientY });
        return;
      }

      // Start marquee
      if (!target.dataset.shapeid && !target.dataset.handle) {
        startMarquee(e.clientX, e.clientY);
        setMarqueeMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons === 0) return;

      const leftHeld = (e.buttons & 1) === 1;
      const middleHeld = (e.buttons & 4) === 4;

      // ✅ pan if we are currently panning
      // - middle drag always pans
      // - left drag pans only if pan tool enabled
      const shouldPan =
        isPanningRef.current && (middleHeld || (panToolEnabled && leftHeld));

      if (!shouldPan) return;

      const dx = e.clientX - canvasMousePos.x;
      const dy = e.clientY - canvasMousePos.y;
      setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setCanvasMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      isPanningRef.current = false;
      setResizing(null);
      setIsPanning(false);
      setDragging(false);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    canvasRef,
    panToolEnabled, // ✅ IMPORTANT
    setPosition,
    canvasMousePos,
    setCanvasMousePos,
    setIsPanning,
    setResizing,
    setDragging,
    startMarquee,
    setMarqueeMousePos,
  ]);
}
