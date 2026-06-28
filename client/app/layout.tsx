import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Postman Clone",
  description: "A browser-based API client",
};

// Injected before React hydrates to prevent a flash of wrong theme.
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('pm-theme');
    if (t === 'light') document.documentElement.classList.add('light');
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      {/* Flash-prevention: runs synchronously before first paint */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-screen overflow-hidden bg-pm-bg text-pm-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
