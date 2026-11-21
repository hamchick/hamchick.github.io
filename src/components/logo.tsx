import { DUCK_SIDE } from "@/components/koi-pond/duck-shape";

// The pond's own duckling, pixel for pixel, in its own colours.
const DUCK_COLOURS: Record<string, string> = {
    W: "rgb(var(--duck-yellow))",
    G: "rgb(var(--duck-yellow-shade))",
    S: "rgb(var(--duck-yellow-shade))",
    B: "rgb(var(--duck-beak))",
    b: "rgb(var(--duck-beak) / 0.7)",
    E: "rgb(var(--duck-eye))",
};

function PixelDuck({ className }: { className?: string }) {
    const w = DUCK_SIDE[0].length;
    const h = DUCK_SIDE.length;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" aria-hidden="true">
            {DUCK_SIDE.flatMap((row, y) =>
                [...row].map((p, x) =>
                    DUCK_COLOURS[p] ? <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={DUCK_COLOURS[p]} /> : null,
                ),
            )}
        </svg>
    );
}

/** The header logo: a duckling from the pond beside the name. It dips its head when pointed at. */
export function Logo() {
    return (
        <span className="group flex items-center gap-2">
            <PixelDuck className="h-5 w-auto origin-bottom transition-transform duration-300 group-hover:-rotate-12 sm:h-6" />
            <span className="text-sm font-bold sm:text-base">
                hamchick<span className="text-accent">.</span>
            </span>
        </span>
    );
}
