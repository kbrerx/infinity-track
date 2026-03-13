import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils";
import Navbar from "../components/Navbar";
import { StatusTicker } from "@/components/ui/StatusTicker";
import { FloatingParticles } from "@/components/ui/FloatingParticles";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "INFINITYTRACK — Attribution Engine",
  description: "Plataforma de atribución server-side con Meta CAPI y tracking avanzado.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={cn("dark font-sans", inter.variable)}>
      <body className={cn(
        inter.className,
        "min-h-screen bg-background antialiased text-foreground selection:bg-primary/25 relative overflow-x-hidden"
      )}>
        {/* === LAYER 0: Neon Mesh Grid === */}
        <div className="neon-grid" />

        {/* === LAYER 1: Aurora Animated Gradient + Hue Rotate === */}
        <div className="aurora-bg">
          <div className="aurora-layer-3" />
        </div>

        {/* === LAYER 2: SVG Floating Particles === */}
        <FloatingParticles count={30} />

        {/* === LAYER 3: Film grain texture === */}
        <div className="noise-overlay" />

        {/* === CONTENT === */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-14">
            {children}
          </main>
        </div>

        {/* === STATUS TICKER === */}
        <StatusTicker />
      </body>
    </html>
  );
}
