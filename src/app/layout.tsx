import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "oto — notes for your music",
  description: "A quiet place for the stories behind your songs.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0c0c0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-bg text-fg font-sans antialiased">
        <SessionProvider>
          <div className="mx-auto max-w-lg">{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}
