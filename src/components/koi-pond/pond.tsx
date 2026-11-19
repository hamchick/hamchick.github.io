"use client";

import { useState } from "react";
import KoiPond, { type PondStats } from "./koi-pond";

/** Fixed full-viewport koi pond behind the page, with a small hint. Click open water to feed the koi. */
export function Pond() {
  const [stats, setStats] = useState<PondStats>({ koi: 0, pellets: 0 });
  return (
    <>
      <KoiPond onStats={setStats} className="fixed inset-0 -z-10 h-full w-full" />
      <div
        data-pond-ignore
        className="pointer-events-none fixed bottom-4 right-4 z-20 rounded-full border border-line bg-card/80 px-3 py-1.5 font-mono text-xs text-muted shadow-sm backdrop-blur"
      >
        {stats.pellets > 0 ? `pellets: ${stats.pellets}` : "click the water to feed the koi"}
      </div>
    </>
  );
}
