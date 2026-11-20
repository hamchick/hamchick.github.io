// Plain constants, importable from server and client components alike.

/** Screens at least this wide get the site at four-fifths size; matches the media query in globals.css. */
export const SCALED_FROM_PX = 768;
export const SITE_SCALE = 0.8;

/**
 * On the content pages, how deep the strip of pond along the top is (the header row plus water below it), and the
 * header row alone, which is all of it that shows once the page is scrolled. Phone sizes, then wider screens; they
 * match --strip-depth and --strip-slim in globals.css.
 */
export const STRIP = {
    phone: { depth: 120, slim: 56 },
    wide: { depth: 96, slim: 45 },
};

export const navLinks = [
    { href: "/about/", label: "About" },
    { href: "/work/", label: "Work" },
];
