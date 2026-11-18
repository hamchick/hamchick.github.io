/**
 * ASCII duck pond: a full-viewport canvas drawn as a grid of monospace glyphs.
 * - The water is a small wave simulation on the glyph grid, so clicks, the pointer and paddling ducks leave ripples.
 * - Ducks are rasterised into the grid every frame (body, head, beak, wing lines, eyes).
 * - Clicking open water drops bread crumbs; the ducks race for them, ducklings included.
 * Everything runs in the browser, so it works on a static host.
 */

type Rgb = [number, number, number];
type ColorKey =
  | "water"
  | "yellow"
  | "yellowShade"
  | "white"
  | "whiteShade"
  | "chick"
  | "chickShade"
  | "beak"
  | "eye"
  | "crumb";

type Palette = Record<ColorKey, Rgb>;
type Box = { left: number; top: number; right: number; bottom: number };
type Vec = { x: number; y: number };

interface Duck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  /** Body length in px. */
  len: number;
  coat: "yellow" | "white" | "chick";
  leader: Duck | null;
  target: Vec;
  retargetIn: number;
  phase: number;
  wakeIn: number;
}

interface Crumb {
  x: number;
  y: number;
  age: number;
}

interface Quack {
  x: number;
  y: number;
  age: number;
  text: string;
}

export interface PondStats {
  ducks: number;
  crumbs: number;
  eaten: number;
}

const CELL_W = 9;
const CELL_H = 12;
const STEP = 1 / 60;
const MAX_STEPS = 4;
// Explicit wave-equation weights. Different x/y weights keep rings round although glyph cells are not square.
const WAVE_X = 0.45;
const WAVE_Y = WAVE_X * (CELL_W / CELL_H) ** 2;
const DAMPING = 0.988;
const CRUMB_LIFE = 14;
const QUACK_LIFE = 1.4;
const WATER_GLYPHS = [".", ":", "-", "~", "+", "*"];
const BODY_GLYPHS = [".", ":", "+", "o", "*", "%", "#", "@"];
const INTERACTIVE = "a, button, input, textarea, select, label, summary, [role='button'], [data-pond-ignore]";
const AVOID = "[data-pond-avoid]";

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/** Pick a line glyph that follows a direction on screen. */
function lineGlyph(angle: number) {
  const a = ((angle % Math.PI) + Math.PI) % Math.PI; // 0..PI
  if (a < Math.PI / 8 || a >= (7 * Math.PI) / 8) return "-";
  if (a < (3 * Math.PI) / 8) return "\\";
  if (a < (5 * Math.PI) / 8) return "|";
  return "/";
}

function parseColor(value: string, fallback: Rgb): Rgb {
  const m = value.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : fallback;
}

export class DuckPond {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private cols = 0;
  private rows = 0;
  private cur = new Float32Array(0);
  private prev = new Float32Array(0);
  private noise = new Float32Array(0);
  private ducks: Duck[] = [];
  private crumbs: Crumb[] = [];
  private quacks: Quack[] = [];
  private boxes: Box[] = [];
  private pointer: Vec | null = null;
  private lastRipple = 0;
  private palette!: Palette;
  private time = 0;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private frames = 0;
  private ambientIn = 1;
  private eaten = 0;
  private reported = "";
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  private colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  private resizeObserver: ResizeObserver;
  private themeObserver: MutationObserver;

  constructor(
    private canvas: HTMLCanvasElement,
    private onStats: (stats: PondStats) => void = () => {}
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;
    this.readPalette();
    this.resize();
    this.spawnDucks();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.themeObserver = new MutationObserver(() => this.readPalette());
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    this.colorScheme.addEventListener("change", this.readPalette);
    this.reducedMotion.addEventListener("change", this.schedule);
    document.addEventListener("visibilitychange", this.schedule);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown);
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);
    this.schedule();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver.disconnect();
    this.themeObserver.disconnect();
    this.colorScheme.removeEventListener("change", this.readPalette);
    this.reducedMotion.removeEventListener("change", this.schedule);
    document.removeEventListener("visibilitychange", this.schedule);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
  }

  /** Drop crumbs at a viewport point (also used by the "feed" button). */
  feed(x: number, y: number) {
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = i === 0 ? 0 : rand(8, 34);
      this.crumbs.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, age: 0 });
    }
    if (this.crumbs.length > 40) this.crumbs.splice(0, this.crumbs.length - 40);
    this.drop(x, y, 3, 36);
    if (this.reducedMotion.matches) this.render();
    this.schedule();
  }

  // ---------------------------------------------------------------- setup

  private readPalette = () => {
    const css = getComputedStyle(this.canvas);
    const get = (name: string, fb: Rgb) => parseColor(css.getPropertyValue(name), fb);
    this.palette = {
      water: get("--pond-water", [90, 140, 200]),
      yellow: get("--duck-yellow", [245, 196, 60]),
      yellowShade: get("--duck-yellow-shade", [200, 140, 30]),
      white: get("--duck-white", [235, 232, 225]),
      whiteShade: get("--duck-white-shade", [160, 160, 170]),
      chick: get("--duck-chick", [250, 222, 120]),
      chickShade: get("--duck-chick-shade", [215, 170, 70]),
      beak: get("--duck-beak", [240, 120, 40]),
      eye: get("--duck-eye", [25, 25, 30]),
      crumb: get("--pond-crumb", [190, 130, 70]),
    };
    if (this.reducedMotion.matches) this.render();
  };

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    const cols = Math.ceil(this.w / CELL_W);
    const rows = Math.ceil(this.h / CELL_H);
    if (cols !== this.cols || rows !== this.rows) {
      this.cols = cols;
      this.rows = rows;
      this.cur = new Float32Array(cols * rows);
      this.prev = new Float32Array(cols * rows);
      this.noise = new Float32Array(cols * rows);
      for (let i = 0; i < this.noise.length; i++) this.noise[i] = Math.random();
    }
    for (const d of this.ducks) {
      d.x = clamp(d.x, 20, this.w - 20);
      d.y = clamp(d.y, 20, this.h - 20);
    }
    this.measure();
    this.render();
  }

  private spawnDucks() {
    const families = this.w < 640 ? [3] : [4, 3];
    const coats: Duck["coat"][] = ["yellow", "white"];
    families.forEach((chicks, f) => {
      const start = this.openPoint();
      const mother = this.makeDuck(start.x, start.y, 112, coats[f % coats.length], null);
      this.ducks.push(mother);
      let leader = mother;
      for (let i = 0; i < chicks; i++) {
        const back = mother.angle + Math.PI;
        const chick = this.makeDuck(
          leader.x + Math.cos(back) * 50,
          leader.y + Math.sin(back) * 50,
          rand(50, 56),
          "chick",
          leader
        );
        this.ducks.push(chick);
        leader = chick;
      }
    });
  }

  private makeDuck(x: number, y: number, len: number, coat: Duck["coat"], leader: Duck | null): Duck {
    const angle = leader ? leader.angle : Math.random() * Math.PI * 2;
    return { x, y, vx: 0, vy: 0, angle, len, coat, leader, target: { x, y }, retargetIn: 0, phase: Math.random() * 10, wakeIn: 0 };
  }

  /** A random point that is not under page content, if one can be found. */
  private openPoint(): Vec {
    const m = 60;
    let p = { x: rand(m, this.w - m), y: rand(m, this.h - m) };
    for (let i = 0; i < 12; i++) {
      if (!this.boxes.some((b) => p.x > b.left - 30 && p.x < b.right + 30 && p.y > b.top - 30 && p.y < b.bottom + 30)) break;
      p = { x: rand(m, this.w - m), y: rand(m, this.h - m) };
    }
    return p;
  }

  private measure() {
    this.boxes = [];
    document.querySelectorAll(AVOID).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > this.h || r.width === 0) return;
      this.boxes.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    });
  }

  // ---------------------------------------------------------------- input

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const p = { x: e.clientX, y: e.clientY };
    const now = performance.now();
    if (this.pointer && now - this.lastRipple > 45) {
      const moved = Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y);
      if (moved > 4) {
        this.drop(p.x, p.y, clamp(moved / 40, 0.15, 0.6), 14);
        this.lastRipple = now;
      }
    }
    this.pointer = p;
    this.schedule();
  };

  private onPointerLeave = () => {
    this.pointer = null;
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as Element | null;
    if (target?.closest?.(INTERACTIVE) || target?.closest?.(AVOID)) return;
    this.feed(e.clientX, e.clientY);
  };

  // ---------------------------------------------------------------- loop

  private schedule = () => {
    if (this.raf || document.hidden) return;
    if (this.reducedMotion.matches) {
      this.render();
      return;
    }
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  };

  private frame = (now: number) => {
    this.raf = 0;
    if (document.hidden || this.reducedMotion.matches) return;
    this.acc = Math.min(this.acc + (now - this.last) / 1000, STEP * MAX_STEPS);
    this.last = now;
    if (++this.frames % 20 === 0) this.measure();
    while (this.acc >= STEP) {
      this.step(STEP);
      this.acc -= STEP;
    }
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private step(dt: number) {
    this.time += dt;
    this.stepWater();

    this.ambientIn -= dt;
    if (this.ambientIn <= 0) {
      const p = this.openPoint();
      this.drop(p.x, p.y, rand(0.4, 0.9), 12);
      this.ambientIn = rand(1.2, 3);
    }

    for (const c of this.crumbs) c.age += dt;
    this.crumbs = this.crumbs.filter((c) => c.age < CRUMB_LIFE);
    for (const q of this.quacks) q.age += dt;
    this.quacks = this.quacks.filter((q) => q.age < QUACK_LIFE);

    for (const d of this.ducks) this.stepDuck(d, dt);

    const stats = { ducks: this.ducks.length, crumbs: this.crumbs.length, eaten: this.eaten };
    const key = `${stats.crumbs}/${stats.eaten}`;
    if (key !== this.reported) {
      this.reported = key;
      this.onStats(stats);
    }
  }

  private stepWater() {
    const { cols, rows, cur, prev } = this;
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = y * cols + x;
        const c = cur[i];
        const next =
          2 * c - prev[i] + WAVE_X * (cur[i - 1] + cur[i + 1] - 2 * c) + WAVE_Y * (cur[i - cols] + cur[i + cols] - 2 * c);
        prev[i] = clamp(next * DAMPING, -3, 3);
      }
    }
    this.prev = cur;
    this.cur = prev;
  }

  /** Push the water surface down around a point. */
  private drop(px: number, py: number, strength: number, radius: number) {
    const cx = px / CELL_W;
    const cy = py / CELL_H;
    const rx = radius / CELL_W;
    const ry = radius / CELL_H;
    for (let y = Math.max(1, Math.floor(cy - ry)); y <= Math.min(this.rows - 2, Math.ceil(cy + ry)); y++) {
      for (let x = Math.max(1, Math.floor(cx - rx)); x <= Math.min(this.cols - 2, Math.ceil(cx + rx)); x++) {
        const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
        if (d < 1) this.cur[y * this.cols + x] += strength * (0.5 + 0.5 * Math.cos(Math.PI * d));
      }
    }
  }

  private stepDuck(d: Duck, dt: number) {
    const chick = d.coat === "chick";
    const head = { x: d.x + Math.cos(d.angle) * d.len * 0.4, y: d.y + Math.sin(d.angle) * d.len * 0.4 };

    // Nearest crumb, if any is worth swimming to.
    let food: Crumb | null = null;
    let foodDist = chick ? 260 : Infinity;
    for (const c of this.crumbs) {
      const dist = Math.hypot(c.x - head.x, c.y - head.y);
      if (dist < foodDist) {
        foodDist = dist;
        food = c;
      }
    }

    let target: Vec;
    let speed: number;
    if (food) {
      target = food;
      speed = chick ? 105 : 80;
      if (foodDist < d.len * 0.22 + 7) {
        this.crumbs.splice(this.crumbs.indexOf(food), 1);
        this.eaten++;
        this.drop(food.x, food.y, 0.9, 14);
        if (Math.random() < (chick ? 0.35 : 0.5)) {
          this.quacks.push({ x: head.x, y: head.y - d.len * 0.3, age: 0, text: chick ? "peep!" : "quack!" });
        }
      }
    } else if (d.leader) {
      const l = d.leader;
      const gap = l.len * 0.5 + d.len * 0.55 + 4;
      target = { x: l.x - Math.cos(l.angle) * gap, y: l.y - Math.sin(l.angle) * gap };
      speed = 90;
    } else {
      d.retargetIn -= dt;
      if (d.retargetIn <= 0 || Math.hypot(d.target.x - d.x, d.target.y - d.y) < 30) {
        d.target = this.openPoint();
        d.retargetIn = rand(6, 14);
      }
      target = d.target;
      speed = 34;
    }

    const dx = target.x - d.x;
    const dy = target.y - d.y;
    const dist = Math.hypot(dx, dy) || 1;
    const arrive = d.leader && !food ? clamp(dist / 40, 0, 1.4) : clamp(dist / 60, 0.25, 1);
    let ax = (dx / dist) * speed * arrive - d.vx;
    let ay = (dy / dist) * speed * arrive - d.vy;

    // Ducks keep some distance from each other.
    for (const o of this.ducks) {
      if (o === d) continue;
      const ox = d.x - o.x;
      const oy = d.y - o.y;
      const od = Math.hypot(ox, oy) || 1;
      const min = (d.len + o.len) * 0.42;
      if (od < min) {
        const push = ((min - od) / min) * 160;
        ax += (ox / od) * push;
        ay += (oy / od) * push;
      }
    }

    // Grown-ups shy away from the pointer; ducklings are braver.
    if (this.pointer && !chick && !food) {
      const px = d.x - this.pointer.x;
      const py = d.y - this.pointer.y;
      const pd = Math.hypot(px, py) || 1;
      if (pd < 110) {
        const push = ((110 - pd) / 110) * 120;
        ax += (px / pd) * push;
        ay += (py / pd) * push;
      }
    }

    // Soft walls.
    const m = 30;
    if (d.x < m) ax += (m - d.x) * 4;
    if (d.x > this.w - m) ax -= (d.x - (this.w - m)) * 4;
    if (d.y < m) ay += (m - d.y) * 4;
    if (d.y > this.h - m) ay -= (d.y - (this.h - m)) * 4;

    const maxForce = 140;
    const f = Math.hypot(ax, ay);
    if (f > maxForce) {
      ax = (ax / f) * maxForce;
      ay = (ay / f) * maxForce;
    }
    d.vx += ax * dt;
    d.vy += ay * dt;
    const sp = Math.hypot(d.vx, d.vy);
    const cap = speed * 1.3;
    if (sp > cap) {
      d.vx = (d.vx / sp) * cap;
      d.vy = (d.vy / sp) * cap;
    }
    d.x += d.vx * dt;
    d.y += d.vy * dt;

    if (sp > 4) {
      const want = Math.atan2(d.vy, d.vx);
      let diff = want - d.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      d.angle += diff * Math.min(1, dt * (chick ? 7 : 4));
    }

    // Paddling leaves a wake.
    d.wakeIn -= dt;
    if (sp > 12 && d.wakeIn <= 0) {
      const tail = { x: d.x - Math.cos(d.angle) * d.len * 0.45, y: d.y - Math.sin(d.angle) * d.len * 0.45 };
      this.drop(tail.x, tail.y, clamp(sp / 140, 0.08, 0.45) * (chick ? 0.6 : 1), chick ? 8 : 12);
      d.wakeIn = 0.09;
    }
  }

  // ---------------------------------------------------------------- render

  private render() {
    const { ctx, cols, rows, dpr, palette } = this;
    if (!palette) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${CELL_H - 1}px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`;

    // Water, bucketed by alpha so fillStyle changes rarely.
    const buckets: number[][] = [[], [], [], [], [], []];
    const glyphOf: string[] = [];
    const t = this.time;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const v = Math.abs(this.cur[i]);
        let glyph = "";
        let level = 0;
        if (v > 0.04) {
          const g = clamp(Math.floor(v * 5), 0, WATER_GLYPHS.length - 1);
          glyph = WATER_GLYPHS[g];
          level = clamp(1 + Math.floor(v * 4), 1, 5);
        } else {
          // Faint shimmering texture so the pond reads as water even when calm.
          const n = this.noise[i];
          if (n < 0.045 && Math.sin(t * 0.8 + n * 300) > -0.2) {
            glyph = n < 0.015 ? "~" : ".";
            level = 0;
          }
        }
        if (!glyph) continue;
        buckets[level].push(i);
        glyphOf[i] = glyph;
      }
    }
    const alphas = [0.16, 0.22, 0.32, 0.45, 0.58, 0.72];
    ctx.fillStyle = `rgb(${palette.water.join(",")})`;
    buckets.forEach((cells, level) => {
      ctx.globalAlpha = alphas[level];
      for (const i of cells) this.glyph(i, glyphOf[i]);
    });

    // Crumbs.
    ctx.fillStyle = `rgb(${palette.crumb.join(",")})`;
    for (const c of this.crumbs) {
      ctx.globalAlpha = clamp((CRUMB_LIFE - c.age) / 2, 0, 1) * 0.95;
      ctx.fillText(c.age % 1 < 0.5 ? "o" : "*", c.x, c.y);
    }

    // Ducks, ducklings last so they sit on top of nothing important.
    ctx.globalAlpha = 1;
    for (const d of this.ducks) this.drawDuck(d);

    // Quacks.
    ctx.font = `600 11px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.fillStyle = `rgb(${palette.beak.join(",")})`;
    for (const q of this.quacks) {
      ctx.globalAlpha = clamp(1 - q.age / QUACK_LIFE, 0, 1);
      ctx.fillText(q.text, q.x, q.y - q.age * 18);
    }
    ctx.globalAlpha = 1;
  }

  private glyph(i: number, g: string) {
    const x = i % this.cols;
    const y = (i / this.cols) | 0;
    this.ctx.fillText(g, x * CELL_W + CELL_W / 2, y * CELL_H + CELL_H / 2);
  }

  private drawDuck(d: Duck) {
    const { ctx, palette } = this;
    const L = d.len;
    const wobble = Math.sin(this.time * 3 + d.phase) * 0.05;
    const ang = d.angle + wobble;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const R = L * 0.7;
    const base = d.coat === "yellow" ? palette.yellow : d.coat === "white" ? palette.white : palette.chick;
    const shade = d.coat === "yellow" ? palette.yellowShade : d.coat === "white" ? palette.whiteShade : palette.chickShade;
    const x0 = Math.max(0, Math.floor((d.x - R) / CELL_W));
    const x1 = Math.min(this.cols - 1, Math.ceil((d.x + R) / CELL_W));
    const y0 = Math.max(0, Math.floor((d.y - R) / CELL_H));
    const y1 = Math.min(this.rows - 1, Math.ceil((d.y + R) / CELL_H));
    const chick = d.coat === "chick";
    const under = this.boxes.some((bx) => d.x > bx.left && d.x < bx.right && d.y > bx.top && d.y < bx.bottom);
    ctx.globalAlpha = under ? 0.22 : 1;

    // Cells holding an eye are drawn last, so the body leaves them empty.
    const eyes = new Set<number>();
    const eyeU = chick ? 0.4 : 0.42;
    const eyeV = chick ? 0.13 : 0.1;
    for (const side of [-1, 1]) {
      const ex = d.x + (cos * eyeU - sin * eyeV * side) * L;
      const ey = d.y + (sin * eyeU + cos * eyeV * side) * L;
      const ecx = Math.floor(ex / CELL_W);
      const ecy = Math.floor(ey / CELL_H);
      if (ecx >= 0 && ecy >= 0 && ecx < this.cols && ecy < this.rows) eyes.add(ecy * this.cols + ecx);
    }

    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        if (eyes.has(cy * this.cols + cx)) continue;
        const px = cx * CELL_W + CELL_W / 2;
        const py = cy * CELL_H + CELL_H / 2;
        const dx = px - d.x;
        const dy = py - d.y;
        const u = (dx * cos + dy * sin) / L; // along the body, head is +u
        const v = (-dx * sin + dy * cos) / L; // across the body
        const lit = clamp((-dx * 0.6 - dy * 0.8) / R, -1, 1);

        let glyph = "";
        let color: Rgb = base;

        // Beak.
        const bu = (u - (chick ? 0.6 : 0.58)) / 0.1;
        const bv = v / (chick ? 0.09 : 0.075);
        if (bu * bu + bv * bv < 1) {
          glyph = "#";
          color = palette.beak;
        }

        // Head.
        const hu = u - (chick ? 0.32 : 0.36);
        const hr = Math.hypot(hu, v) / (chick ? 0.25 : 0.19);
        if (!glyph && hr < 1) {
          glyph = BODY_GLYPHS[clamp(Math.round(3 + (1 - hr) * 3 + lit * 2), 3, BODY_GLYPHS.length - 1)];
          color = lit < -0.35 ? shade : base;
        }

        // Body with a pointed tail.
        const eu = (u + 0.05) / (chick ? 0.36 : 0.46);
        const ev = v / (chick ? 0.3 : 0.27);
        const er = Math.hypot(eu, ev);
        const tail = !chick && u < -0.38 && u > -0.62 && Math.abs(v) < (u + 0.62) * 0.55;
        if (!glyph && (er < 1 || tail)) {
          const wing = !chick && u > -0.36 && u < 0.18 && Math.abs(v) > 0.07 && Math.abs(v) < 0.22;
          if (tail && er >= 1) {
            glyph = lineGlyph(ang);
            color = shade;
          } else if (wing) {
            // Feather lines along the body.
            glyph = lineGlyph(ang + (v > 0 ? 0.25 : -0.25));
            color = shade;
          } else {
            glyph = BODY_GLYPHS[clamp(Math.round(2.5 + (1 - er) * 4 + lit * 2), er > 0.88 ? 2 : 3, BODY_GLYPHS.length - 1)];
            color = lit < -0.45 ? shade : base;
          }
        }

        if (!glyph) continue;
        ctx.fillStyle = `rgb(${color.join(",")})`;
        ctx.fillText(glyph, px, py);
      }
    }

    // Eyes go in whichever cells contain them.
    ctx.fillStyle = `rgb(${palette.eye.join(",")})`;
    for (const i of eyes) this.glyph(i, "\u2022");
    ctx.globalAlpha = 1;
  }
}
