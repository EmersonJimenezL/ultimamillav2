import { useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  value?: string | null;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
  height?: number;
}

export function SignaturePad({
  value = null,
  onChange,
  disabled = false,
  height = 160,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      const width = parent ? parent.clientWidth : 400;
      const nextHeight = height;
      canvas.width = width;
      canvas.height = nextHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#111827";

      if (value) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = value;
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [value, height]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { x, y } = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    canvas.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { x, y } = getPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finishDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(false);
    canvas.releasePointerCapture(event.pointerId);
    onChange(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="w-full">
      <div className="rounded-lg border border-gray-300 bg-white">
        <canvas
          ref={canvasRef}
          style={{ height }}
          className="w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrawing}
          onPointerLeave={finishDrawing}
        />
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled}
          className="text-xs font-semibold text-gray-600 hover:text-gray-800"
        >
          Limpiar firma
        </button>
      </div>
    </div>
  );
}
