import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sin-En Huang",
  description: "Sin-En Huang — computer science and economics. Machine learning, data and web development.",
  icons: { icon: "/images/duck.jpg" },
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
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
