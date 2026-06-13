import { useRef, useEffect } from 'react';
import { useThemeStore } from '@/status';

function _drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, strokeColor: string): void {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push([cx + Math.round(s * Math.cos(a)), cy + Math.round(s * Math.sin(a))]);
  }
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
}

function drawHoneycomb(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  const sz = 16;
  const cols = Math.ceil(W / (sz * 1.73)) + 2;
  const rows = Math.ceil(H / (sz * 2)) + 2;
  for (let row = -1; row < rows; row++)
    for (let col = -1; col < cols; col++)
      _drawHex(ctx, col * sz * 1.73 + (row % 2 === 0 ? 0 : sz * 0.87), row * sz * 1.5, sz, 'rgba(200,160,60,0.35)');
}

export default function HoneycombCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const honeycomb = useThemeStore(s => s.honeycomb);
  const honeycombNeedsRedraw = useThemeStore(s => s.honeycombNeedsRedraw);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.opacity = honeycomb ? '0.18' : '0';
    drawHoneycomb(canvas);
  }, [honeycomb]);

  // 主题切换时重绘
  useEffect(() => {
    if (!honeycombNeedsRedraw) return;
    drawHoneycomb(canvasRef.current);
    useThemeStore.getState().clearHoneycombRedraw();
  }, [honeycombNeedsRedraw]);

  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(() => drawHoneycomb(canvasRef.current));
    };
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return <canvas ref={canvasRef} id="chat-honeycomb" />;
}
