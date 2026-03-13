"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Target, Image as ImageIcon, Menu, X, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { InfinityLogo } from "@/components/ui/InfinityLogo";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campañas", icon: Target },
  { href: "/creatives", label: "Anuncios", icon: ImageIcon },
  { href: "/admin/connections", label: "Conexiones", icon: Settings2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-white/[0.06] glass-panel">
        <div className="max-w-[1440px] mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <InfinityLogo size={36} />
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-black tracking-tight text-white uppercase">
                Infinity<span className="text-primary italic">Track</span>
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Advanced Tracking
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Live</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 p-[1px]">
              <div className="w-full h-full bg-black/70 rounded-[6px] flex items-center justify-center text-[10px] font-black text-white">
                BB
              </div>
            </div>
            <button
              className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-40 w-64 glass-panel border-l border-white/[0.06] md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <InfinityLogo size={24} />
                  <span className="text-sm font-black tracking-tight uppercase">Infinity<span className="text-primary italic">Track</span></span>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col gap-1 p-4 flex-1">
                {links.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link key={href} href={href} onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                        active
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      <Icon className="w-4 h-4" />{label}
                    </Link>
                  );
                })}
              </div>
              <div className="p-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 p-[1px]">
                    <div className="w-full h-full bg-black/70 rounded-[6px] flex items-center justify-center text-[10px] font-black text-white">BB</div>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Bryan B.</p>
                    <p className="text-[10px] text-muted-foreground">Agencia Infinity</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
