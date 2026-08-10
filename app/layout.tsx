import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cracked",
  description: "Every task, visibly connected to the goal it serves.",
  appleWebApp: {
    capable: true,
    title: "Cracked",
    statusBarStyle: "black-translucent",
  },
  icons: {
    // Explicitly setting `icons` here replaces Next's auto-injected
    // favicon from the app/icon.svg file convention rather than merging
    // with it — so the plain "icon" entry has to be spelled out too.
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#14140f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans bg-canvas text-ink antialiased overscroll-none">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
