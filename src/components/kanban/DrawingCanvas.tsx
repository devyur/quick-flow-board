import { useEffect, useRef, useState } from "react";
import { Eraser, Redo2, Pencil, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INK_COLORS = ["#26211c", "#c2410c", "#b91c1c", "#15803d", "#1d4ed8", "#7e22ce"];
const SIZES = [2, 4, 8, 16];

interface DrawingCanvasProps {
  initial?: string | null;
  onSave: (dataUrl: string) => void;
  onClose?: () => void;
}

export function DrawingCanvas({ initial, onSave, onClose }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const history = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(INK_COLORS[0]);
  const [size, setSize] = useState(4);
  const [, forceRender] = useState(0);

  const ctx = () => canvasRef.current?.getContext("2d") ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = ctx();
    if (!canvas || !context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (initial) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        history.current = [canvas.toDataURL("image/png")];
        forceRender((n) => n + 1);
      };
      img.src = initial;
    } else {
      history.current = [canvas.toDataURL("image/png")];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const context = ctx();
    if (!context) return;
    drawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    const { x, y } = point(e);
    context.beginPath();
    context.moveTo(x, y);
    context.lineCap = "round";
    context.lineJoin = "round";
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const context = ctx();
    if (!drawing.current || !context) return;
    const { x, y } = point(e);
    context.lineWidth = tool === "eraser" ? size * 3 : size;
    context.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    context.lineTo(x, y);
    context.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    history.current.push(canvas.toDataURL("image/png"));
    future.current = [];
    forceRender((n) => n + 1);
  };

  const restore = (dataUrl: string) => {
    const canvas = canvasRef.current;
    const context = ctx();
    if (!canvas || !context) return;
    const img = new Image();
    img.onload = () => {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
      forceRender((n) => n + 1);
    };
    img.src = dataUrl;
  };

  const undo = () => {
    if (history.current.length < 2) return;
    const current = history.current.pop()!;
    future.current.push(current);
    restore(history.current[history.current.length - 1]);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(next);
    restore(next);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = ctx();
    if (!canvas || !context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    history.current.push(canvas.toDataURL("image/png"));
    future.current = [];
    forceRender((n) => n + 1);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <Button
            type="button"
            size="icon"
            variant={tool === "pen" ? "default" : "ghost"}
            className="size-8"
            onClick={() => setTool("pen")}
            aria-label="Pen"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={tool === "eraser" ? "default" : "ghost"}
            className="size-8"
            onClick={() => setTool("eraser")}
            aria-label="Eraser"
          >
            <Eraser className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          {INK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              style={{ backgroundColor: c }}
              className={cn(
                "size-6 rounded-full ring-offset-2 ring-offset-background transition",
                color === c && tool === "pen" ? "ring-2 ring-ring" : "ring-0",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`Brush ${s}`}
              onClick={() => setSize(s)}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition",
                size === s ? "bg-card shadow-card" : "hover:bg-card/60",
              )}
            >
              <span className="rounded-full bg-foreground" style={{ width: s + 2, height: s + 2 }} />
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" className="size-8" onClick={undo} aria-label="Undo">
            <Undo2 className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="size-8" onClick={redo} aria-label="Redo">
            <Redo2 className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="size-8" onClick={clear} aria-label="Clear">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={880}
        height={520}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full touch-none rounded-xl border border-border bg-white shadow-card"
      />

      <div className="flex justify-end gap-2">
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) onSave(canvas.toDataURL("image/png"));
          }}
        >
          Save sketch
        </Button>
      </div>
    </div>
  );
}
