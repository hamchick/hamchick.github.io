"use client";

import { useIsHome, useScrolled, useStrip } from "@/components/site";
import KoiPond, { BAND_TRANSITION_MS } from "./koi-pond";

/**
 * The one pond for the whole site, kept in the root layout so the same koi and ducklings swim on from page to page.
 * On the home page it fills the screen. On a content page it is clipped to a strip of water along the top, behind
 * the header; scrolled down, the strip narrows to the header row and fades. Changing page animates the clip, so
 * the pond closes up into the strip, or opens back out of it.
 */
export function Pond() {
    const home = useIsHome();
    const scrolled = useScrolled();
    const strip = useStrip();
    const shown = home ? null : scrolled ? strip.slim : strip.depth;
    const fade = { transitionDuration: `${BAND_TRANSITION_MS}ms` };
    return (
        <>
            {/*
              Above the page content (the header and the home card sit above it in turn) and filled with the page
              colour, so content scrolling up under the strip is hidden by it rather than showing through. It also
              takes clicks, so feeding the koi never clicks a link hidden underneath; outside the clip it takes none.
            */}
            <div
                className="fixed inset-0 z-[5] bg-bg transition-[clip-path] ease-[cubic-bezier(0.65,0,0.35,1)]"
                style={{
                    clipPath: shown === null ? "inset(0 0 0 0)" : `inset(0 0 calc(100% - ${shown}px) 0)`,
                    ...fade,
                }}
            >
                {/*
                  The ducklings' strip has a colour of its own on every page, so it doesn't change colour as you move
                  between them; on a content page it fills the whole strip along the top. On the home page it also
                  casts a soft shadow on the pond below, which fades out on a content page.
                */}
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 bg-(--strip) transition-[height] ease-[cubic-bezier(0.65,0,0.35,1)]"
                    style={{ height: home ? strip.home : strip.depth, ...fade }}
                />
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 h-5 bg-linear-to-b from-(--strip-shadow) to-transparent transition-opacity"
                    style={{ top: strip.home, opacity: home ? 1 : 0, ...fade }}
                />
                {/* Only the koi fade when the page is scrolled, not the strip's backing. */}
                <div className="relative h-full w-full transition-opacity" style={{ opacity: !home && scrolled ? 0.35 : 1, ...fade }}>
                    <KoiPond band={home ? null : strip.depth} duckStrip={home ? strip.home : strip.depth} className="h-full w-full" />
                </div>
            </div>
            {/*
              The edge of the strip: a hairline where the water ends and the page begins. On the home page it stays,
              fainter, as the line between the ducklings' strip of surface and the pond below.
            */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-x-0 top-0 z-[6] border-b border-line/70 transition-[height,opacity] ease-[cubic-bezier(0.65,0,0.35,1)]"
                style={{
                    height: shown ?? strip.home,
                    opacity: home ? 0.6 : 1,
                    ...fade,
                }}
            />
        </>
    );
}
