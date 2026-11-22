"use client";

import { useEffect, useRef } from "react";
import { useIsLight } from "@/components/koi-pond/koi-pond";
import { DARK, LIGHT, mix, shade, TILE_GLYPHS, type Rgb } from "@/components/koi-pond/renderer";

/**
 * A small dot-matrix font, 5 wide and 9 tall: capitals and ascenders fill rows 0-6 with the baseline under row 6,
 * and descenders drop into rows 7-8. Only the letters the name needs are drawn; each is trimmed to its own width
 * when laid out, so narrow letters like "i" take less room.
 */
const FONT: Record<string, string[]> = {
    S: [".###.", "#...#", "#....", ".###.", "....#", "#...#", ".###.", ".....", "....."],
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####", ".....", "....."],
    H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#", ".....", "....."],
    i: ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", ".###.", ".....", "....."],
    s: [".....", ".....", ".####", "#....", ".###.", "....#", "####.", ".....", "....."],
    n: [".....", ".....", "#.##.", "##..#", "#...#", "#...#", "#...#", ".....", "....."],
    u: [".....", ".....", "#...#", "#...#", "#...#", "#..##", ".##.#", ".....", "....."],
    a: [".....", ".....", ".###.", "....#", ".####", "#...#", ".####", ".....", "....."],
    g: [".....", ".....", ".####", "#...#", "#...#", "#...#", ".####", "....#", ".###."],
    "-": [".....", ".....", ".....", ".###.", ".....", ".....", ".....", ".....", "....."],
};
const FONT_ROWS = 9;
const SPACE = 2;
const GAP = 1;
/** Each dot of the font is this many tiles across and down, so strokes are thick enough to read and to shade. */
const DOT = 2;
const ROWS = FONT_ROWS * DOT;

/** Lay a line of text out on the tile grid: which tiles are on, and how many columns it takes. */
function layout(text: string) {
    const dots = layoutDots(text);
    const cols = dots.cols * DOT;
    const on = (c: number, r: number) =>
        c >= 0 && c < cols && r >= 0 && r < ROWS && dots.on(Math.floor(c / DOT), Math.floor(r / DOT));
    return { cols, on };
}

/** The same, one tile per dot of the font. */
function layoutDots(text: string) {
    const ROWS = FONT_ROWS;
    const columns: boolean[][] = [];
    for (const ch of text) {
        if (ch === " ") {
            for (let k = 0; k < SPACE; k++) columns.push(new Array(ROWS).fill(false));
            continue;
        }
        const glyph = FONT[ch];
        if (!glyph) continue;
        // Trim to the columns the letter actually uses.
        let from = 5;
        let to = -1;
        for (let c = 0; c < 5; c++) {
            if (glyph.some((row) => row[c] === "#")) {
                from = Math.min(from, c);
                to = Math.max(to, c);
            }
        }
        if (columns.length > 0) for (let k = 0; k < GAP; k++) columns.push(new Array(ROWS).fill(false));
        for (let c = from; c <= to; c++) columns.push(glyph.map((row) => row[c] === "#"));
    }
    const cols = columns.length;
    const on = (c: number, r: number) => c >= 0 && c < cols && r >= 0 && r < ROWS && columns[c][r];
    return { cols, on };
}

/** Deterministic hash to [0, 1), for glyph choice and the occasional glint. */
function hash(a: number, b: number, c: number) {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const css = (c: Rgb) => `rgb(${c[0]},${c[1]},${c[2]})`;
const FRAME_MS = 66;
// Tiles at most this big, so the name sits at headline size rather than filling the screen.
const MAX_TILE = 3;

/**
 * The name drawn in the pond's own material: each dot of a dot-matrix font is a tile like a koi's, washed in the
 * koi's white with a glyph etched in it, gaps between, so fish swimming underneath show through. Stroke edges facing
 * the light (top and left) are brighter and the far edges darker, and a slow sheen slides across, with now and then
 * a tile glinting, as on the koi's scales. Tiles size themselves to the width available. Purely visual: the page
 * keeps the name as real text for search engines and screen readers.
 */
export function MosaicName({ text, className }: { text: string; className?: string }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isLight = useIsLight();

    useEffect(() => {
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!wrap || !canvas || !ctx) return;
        const grid = layout(text);
        const palette = isLight ? LIGHT : DARK;
        const [tile0, tile1] = palette.tile;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let cw = MAX_TILE;
        let ch = MAX_TILE;
        let dpr = 1;
        let raf = 0;
        let last = 0;

        const draw = (time: number) => {
            const t = reduce ? 0 : time / 1000;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.font = `600 ${Math.max(4, Math.round(ch * 0.72))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // The gap between tiles: a pixel, narrower on tiny tiles so they don't break up into dots.
            const gap = cw >= 4 ? 1 : Math.max(0.5, cw * 0.22);
            for (let c = 0; c < grid.cols; c++) {
                for (let r = 0; r < ROWS; r++) {
                    if (!grid.on(c, r)) continue;
                    // Lit from the top left, like the koi: edges facing the light catch it, far edges fall into shade.
                    let lum = 0.55;
                    if (!grid.on(c, r - 1)) lum += 0.25;
                    if (!grid.on(c - 1, r)) lum += 0.12;
                    if (!grid.on(c, r + 1)) lum -= 0.22;
                    if (!grid.on(c + 1, r)) lum -= 0.1;
                    // A band of light sliding slowly across the letters.
                    const sheen = Math.max(0, Math.sin(c * 0.16 - r * 0.05 - t * 0.9) - 0.85) / 0.15;
                    lum = Math.min(1, Math.max(0, lum + sheen * 0.3));
                    let tile = mix(palette.bg, palette.white, tile0 + (tile1 - tile0) * lum);
                    // Now and then a tile glints, on a staggered clock.
                    if (!reduce && hash(c, r, Math.floor(t * 1.4 + hash(r, c, 3) * 7)) < 0.015) {
                        tile = mix(tile, palette.bg, 0.45);
                    }
                    const x = c * cw;
                    const y = r * ch;
                    ctx.globalAlpha = 0.95;
                    ctx.fillStyle = css(tile);
                    ctx.fillRect(x + gap, y + gap, cw - gap, ch - gap);
                    // Tiles too small to hold a glyph are left plain.
                    if (cw < 4) continue;
                    const jitter = Math.floor(hash(c, r, 11) * 3);
                    const glyph = TILE_GLYPHS[Math.min(TILE_GLYPHS.length - 1, Math.round((1 - lum) * 4) + jitter)];
                    ctx.globalAlpha = 0.6;
                    ctx.fillStyle = css(shade(tile, palette.ink));
                    ctx.fillText(glyph, x + cw / 2, y + ch / 2 + 1);
                }
            }
            ctx.globalAlpha = 1;
        };

        const size = () => {
            const width = wrap.clientWidth;
            if (width < 1) return;
            // Whole pixels when there's room, for crisp tiles; on a narrow phone, whatever fraction fits the whole
            // name across, rather than cutting the end off.
            const fit = Math.min(MAX_TILE, width / grid.cols);
            cw = fit >= 3 ? Math.floor(fit) : fit;
            ch = cw * 1.15;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(grid.cols * cw * dpr);
            canvas.height = Math.round(ROWS * ch * dpr);
            canvas.style.width = `${grid.cols * cw}px`;
            canvas.style.height = `${ROWS * ch}px`;
            draw(performance.now());
        };

        const loop = (time: number) => {
            if (time - last > FRAME_MS) {
                last = time;
                draw(time);
            }
            raf = requestAnimationFrame(loop);
        };

        const observer = new ResizeObserver(size);
        observer.observe(wrap);
        size();
        if (!reduce) raf = requestAnimationFrame(loop);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [text, isLight]);

    return (
        <div ref={wrapRef} className={className}>
            <canvas ref={canvasRef} aria-hidden="true" className="block" />
        </div>
    );
}
