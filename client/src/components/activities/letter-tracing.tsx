import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw, CheckCircle2 } from "lucide-react";

interface TracingData {
  type: "tracing";
  letter: string;
  word: string;
  imageDescription: string;
  upperPath: string;
  lowerPath: string;
  funFact?: string;
}

export default function LetterTracing({ data }: { data: TracingData }) {
  const [isTracing, setIsTracing] = useState(false);
  const [traced, setTraced] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    drawGuide();
  }, [data]);

  function drawGuide() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "hsl(var(--muted-foreground) / 0.2)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);

    const path = new Path2D(data.upperPath);
    ctx.stroke(path);

    ctx.setLineDash([]);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    setIsTracing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPoints([{ x, y }]);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isTracing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const newPoints = [...points, { x: (e.clientX - rect.left) / rect.width * 100, y: (e.clientY - rect.top) / rect.height * 100 }];
    setPoints(newPoints);

    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);

    if (newPoints.length >= 2) {
      const prev = newPoints[newPoints.length - 2];
      const curr = newPoints[newPoints.length - 1];
      ctx.beginPath();
      ctx.moveTo(prev.x / 100 * canvas.width, prev.y / 100 * canvas.height);
      ctx.lineTo(curr.x / 100 * canvas.width, curr.y / 100 * canvas.height);
      ctx.stroke();
    }
  }

  function handlePointerUp() {
    setIsTracing(false);
    if (points.length > 10) {
      setTraced(true);
    }
  }

  function reset() {
    setTraced(false);
    setPoints([]);
    drawGuide();
  }

  return (
    <Card className="p-6 my-6" data-testid="activity-tracing">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Trace the Letter {data.letter}!</h3>
        <Badge variant="secondary" className="text-xs">{data.letter} is for {data.word}</Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Use your finger or mouse to trace the letter {data.letter}. Follow the dotted lines!
      </p>

      <div
        ref={containerRef}
        className="relative rounded-md border-2 border-dashed border-muted-foreground/20 bg-card aspect-[4/3] max-w-md mx-auto mb-4 overflow-hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[120px] font-bold text-muted-foreground/10 select-none">{data.letter}</span>
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full h-full cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          data-testid="canvas-tracing"
        />
        {traced && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-lg">Great job!</p>
              <p className="text-sm text-muted-foreground">You traced the letter {data.letter}!</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" onClick={reset} data-testid="button-reset-tracing">
          <RotateCcw className="mr-1 h-4 w-4" /> Try Again
        </Button>
      </div>

      {data.funFact && (
        <div className="mt-4 p-3 rounded-md bg-primary/5">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Fun Fact:</span> {data.funFact}
          </p>
        </div>
      )}
    </Card>
  );
}
