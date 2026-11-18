"use client";

import { useEffect, useRef, useState } from "react";
import { DuckPond as Engine, type PondStats } from "./engine";

/** Fixed full-viewport pond behind the page. Click open water to feed the ducks. */
export function DuckPond() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [stats, setStats] = useState<PondStats>({ ducks: 0, crumbs: 0, eaten: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: Engine;
    try {
      engine = new Engine(canvas, setStats);
    } catch {
      return;
    }
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const feedRandom = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    engineRef.current?.feed(w * (0.2 + Math.random() * 0.6), h * (0.25 + Math.random() * 0.5));
  };

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="pond-canvas pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <button
        type="button"
        onClick={feedRandom}
        className="fixed bottom-4 right-4 z-20 rounded-full border border-line bg-card/80 px-3 py-1.5 font-mono text-xs text-muted shadow-sm backdrop-blur transition hover:text-ink"
        aria-label="Feed the ducks"
      >
        {stats.crumbs > 0 ? `crumbs left: ${stats.crumbs}` : "click the water to feed the ducks"}
        {stats.eaten > 0 && <span className="ml-2 text-accent">eaten: {stats.eaten}</span>}
      </button>
    </>
  );
}
