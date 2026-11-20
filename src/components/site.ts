"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** The current path without its trailing slash, so "/about/" and "/about" compare equal. */
export function usePath() {
    const path = usePathname() ?? "/";
    return path.length > 1 ? path.replace(/\/$/, "") : path;
}

/** The home page is the pond itself; every other page is content with the pond as a strip along the top. */
export function useIsHome() {
    return usePath() === "/";
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
