import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DataBrix — AI-Powered Data Intelligence",
  description:
    "Transform your data into strategic intelligence with AI-powered analysis, stunning visualizations, and actionable insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${outfit.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <TooltipProvider>
          <AuthProvider>{children}</AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
