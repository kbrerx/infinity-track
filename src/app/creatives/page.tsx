"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
  Eye, Rocket, Shield, AlertTriangle, Pause, Image as ImageIcon, Play, ArrowUpRight, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import FilterBar from "@/components/dashboard/FilterBar";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 30, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } } };

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 250, damping: 25 });
  const sy = useSpring(my, { stiffness: 250, damping: 25 });
  const rotateX = useTransform(sy, [0, 1], [5, -5]);
  const rotateY = useTransform(sx, [0, 1], [-5, 5]);
  const glow = useTransform([sx, sy], ([x, y]: number[]) =>
    `radial-gradient(200px circle at ${x * 100}% ${y * 100}%, hsla(220,90%,65%,0.12) 0%, transparent 60%)`
  );
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }, [mx, my]);
  const onLeave = () => { mx.set(0.5); my.set(0.5); };

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} variants={fadeUp}
      style={{ rotateX, rotateY, transformPerspective: 700 }}
      className={`glass-card cursor-default group ${className}`}
    >
      <motion.div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: glow }} />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function FatigueRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color = value < 30 ? "hsl(160,60%,45%)" : value < 60 ? "hsl(35,92%,60%)" : "hsl(350,89%,60%)";
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsla(220,20%,100%,0.06)" strokeWidth="3" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 }}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize="8" fontWeight="900" transform={`rotate(90, ${size / 2}, ${size / 2})`}>{value}%</text>
    </svg>
  );
}

export default function CreativesPage() {
  const [filter, setFilter] = useState<"all" | "video" | "image">("all");
  const [creatives, setCreatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilters, setGlobalFilters] = useState<any>({ range: '7d' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/creatives/stats?${new URLSearchParams(globalFilters)}`);
      const data = await res.json();
      setCreatives(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [globalFilters]);

  const filtered = useMemo(() => {
    const list = Array.isArray(creatives) ? creatives : [];
    return filter === "all" ? list : list.filter(c => c.type === filter);
  }, [creatives, filter]);

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="flex flex-col gap-5 pb-16">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-glow">Anuncios & Fatiga</h1>
          <p className="text-sm text-muted-foreground mt-2">Detección de saturación por anuncio</p>
        </div>
        <FilterBar onFilterChange={setGlobalFilters} />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <TiltCard key={item.id}>
            <div className="h-40 bg-black/60 relative flex items-center justify-center rounded-t-2xl">
              {item.thumbnail ? <img src={item.thumbnail} className="w-full h-full object-cover opacity-50" /> : <Play className="w-8 h-8 opacity-20" />}
              <Badge className="absolute top-3 left-3 bg-black/40 uppercase text-[8px]">{item.type}</Badge>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-black mb-4 truncate">{item.name}</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[9px] text-muted-foreground uppercase font-black">ROAS</p><p className="text-lg font-black">{item.roas.toFixed(2)}x</p></div>
                <div><p className="text-[9px] text-muted-foreground uppercase font-black">Ventas</p><p className="text-lg font-black text-emerald-400">{item.ventas}</p></div>
                <div className="flex flex-col items-center"><p className="text-[9px] text-muted-foreground uppercase font-black">Fatiga</p><FatigueRing value={item.fatigue} /></div>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>
    </motion.div>
  );
}
