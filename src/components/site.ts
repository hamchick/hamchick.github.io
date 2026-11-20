"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SCALED_FROM_PX, STRIP } from "@/components/strip";

/** The current path without its trailing slash, so "/about/" and "/about" compare equal. */
export function usePath() {
    const path = usePathname() ?? "/";
    return path.length > 1 ? path.replace(/\/$/, "") : path;
}

/** The home page is the pond itself; every other page is content with the pond as a strip along the top. */
export function useIsHome() {
    return usePath() === "/";
}

/** The strip's sizes for this screen: the four-fifths sizes on a wider screen, full size on a phone. */
export function useStrip() {
    const [wide, setWide] = useState(false);
    useEffect(() => {
        const query = window.matchMedia(`(min-width: ${SCALED_FROM_PX}px)`);
        const read = () => setWide(query.matches);
        read();
        query.addEventListener("change", read);
        return () => query.removeEventListener("change", read);
    }, []);
    return wide ? STRIP.wide : STRIP.phone;
}

/** True once the page has scrolled past `threshold` pixels. */
export function useScrolled(threshold = 8) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const read = () => setScrolled(window.scrollY > threshold);
        read();
        window.addEventListener("scroll", read, { passive: true });
        return () => window.removeEventListener("scroll", read);
    }, [threshold]);
    return scrolled;
}
