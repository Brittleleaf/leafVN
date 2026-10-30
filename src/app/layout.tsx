import type { Metadata } from "next";
import { Special_Elite, Barlow } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-typewriter",
});

const barlow = Barlow({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

const headstone = localFont({
  src: "../../public/assets/fonts/Headstone TITLE.ttf",
  variable: "--font-title",
  display: "swap",
});

import I18nInitializer from "@/components/i18n/I18nInitializer";
import { AuthProvider } from "@/lib/firebase/authContext";

export const metadata: Metadata = {
  title: "Leaf VN Studio - Visual Novel Engine",
  description: "Next-Gen Visual Novel Engine & Creative Authoring Studio",
  icons: {
    icon: "/assets/logo/LeafVN.png",
    shortcut: "/assets/logo/LeafVN.png",
    apple: "/assets/logo/LeafVN.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${specialElite.variable} ${headstone.variable} ${barlow.variable} font-sans antialiased min-h-screen relative bg-[#0b0b10] text-gray-100 overflow-x-hidden selection:bg-purple-900 selection:text-white`}
      >
        <I18nInitializer />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
