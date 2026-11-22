import { DUCK_SIDE, DUCK_WATERLINE } from "@/components/koi-pond/duck-shape";
import { DARK, LIGHT, type Palette } from "@/components/koi-pond/renderer";
import { profile } from "@/data/profile";

type Rgb = [number, number, number];

const mix = (a: Rgb, b: Rgb, t: number) => {
    const k = Math.min(1, Math.max(0, t));
    return a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(" ");
};

/**
 * The colour of one pixel of the duckling, shaded the way the pond shades it (see KoiRenderer.drawDucks): down lit
 * from above, brightest on the crown, the wing a little deeper and the underside deeper still.
 */
function pixelColour(palette: Palette, p: string, row: number) {
    const { shade, base, bill, billShade } = palette.duck;
    const lit = Math.max(0, 1 - row / DUCK_WATERLINE);
    switch (p) {
        case "B":
            return mix(billShade, bill, 0.85);
        case "b":
            return billShade.join(" ");
        case "E":
            return palette.eye.join(" ");
        case "G":
            return mix(shade, base, 0.55 + 0.25 * lit);
        case "S":
            return mix(shade, base, 0.3);
        default:
            return mix(shade, base, 0.62 + 0.38 * lit);
    }
}

// The pond's own duckling, pixel for pixel, in the pond's own colours for each theme.
function PixelDuck({ palette, className }: { palette: Palette; className?: string }) {
    const w = DUCK_SIDE[0].length;
    const h = DUCK_SIDE.length;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" aria-hidden="true">
            {DUCK_SIDE.flatMap((row, y) =>
                [...row].map((p, x) =>
                    p === "." ? null : (
                        <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={`rgb(${pixelColour(palette, p, y)})`} />
                    ),
                ),
            )}
        </svg>
    );
}

const duck = "h-5 w-auto origin-bottom transition-transform duration-300 group-hover:-rotate-12 sm:h-6";

/** The header logo: a duckling from the pond beside the name. It dips its head when pointed at. */
export function Logo() {
    return (
        <span className="group flex items-center gap-2">
            <PixelDuck palette={LIGHT} className={`${duck} dark:hidden`} />
            <PixelDuck palette={DARK} className={`${duck} hidden dark:block`} />
            <span className="text-sm font-bold sm:text-base">
                {profile.handle}
                <span className="text-accent">.</span>
            </span>
        </span>
    );
}
