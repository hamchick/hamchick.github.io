import type { Metadata, Viewport } from "next";
import { Pond } from "@/components/koi-pond/pond";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const description = "Hsin-En Huang — LLM engineer at a bank, with a background in computer science and economics.";

export const metadata: Metadata = {
  // Lets the link preview image be given as a full address, which link previews need.
  metadataBase: new URL("https://hamchick.github.io"),
  title: "Hsin-En Huang",
  description,
  icons: { icon: "/images/duck.jpg" },
  openGraph: {
    type: "website",
    siteName: "Hsin-En Huang",
    title: "Hsin-En Huang",
    description,
    // A screenshot of the home page in the dark theme, kept in public/.
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Hsin-En Huang: CS × Economics" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#11141c" },
  ],
};

// Sets the theme before first paint so there is no flash of the wrong colours.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans">
        {/* Shared by every page, so the pond and its koi carry on from one page to the next. */}
        <Pond />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
