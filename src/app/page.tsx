"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, useCallback, useEffect, useState } from "react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3, Target, ShieldCheck,
  Package, Share2, Clock, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FilterBar from "@/components/dashboard/FilterBar";

// ---- Animation variants ----
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 30, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } } };

// ==========================================
// 3D TILT GLOW CARD
// ==========================================
function TiltCard({ children, className = "", accent = false }: { children: React.ReactNode; className?: string; accent?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const smoothX = useSpring(mx, { stiffness: 300, damping: 30 });
  const smoothY = useSpring(my, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(smoothY, [0, 1], [4, -4]);
  const rotateY = useTransform(smoothX, [0, 1], [-4, 4]);

  const glowX = useTransform(smoothX, [0, 1], [0, 100]);
  const glowY = useTransform(smoothY, [0, 1], [0, 100]);
  const glowBg = useTransform(
    [glowX, glowY],
    ([x, y]: number[]) =>
      `radial-gradient(300px circle at ${x}% ${y}%, hsla(220,90%,65%,0.1) 0%, transparent 60%)`
  );

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }, [mx, my]);

  const handleLeave = useCallback(() => {
    mx.set(0.5);
    my.set(0.5);
  }, [mx, my]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      variants={fadeUp}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={`relative cursor-default ${accent ? "glass-card-accent" : "glass-card"} ${className}`}
    >
      <motion.div className="absolute inset-0 rounded-2xl pointer-events-none z-0" style={{ background: glowBg }} />
      <div className="absolute top-0 left-0 right-0 h-[1px]">
        <div className={accent
          ? "h-full edge-glow-blue opacity-60"
          : "h-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"}
        />
      </div>
      {accent && <div className="card-scan-line" />}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ==========================================
// METRIC CARD
// ==========================================
interface MetricProps {
  label: string; value: number; prefix?: string; suffix?: string; decimals?: number;
  delta?: string; deltaUp?: boolean;
  icon: React.ReactNode; accent?: boolean; valueColor?: string;
}

function Metric({ label, value, prefix = "", suffix = "", decimals = 2, delta, deltaUp, icon, accent, valueColor = "" }: MetricProps) {
  return (
    <TiltCard accent={accent}>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground block">{label}</span>
            {delta && (
              <div className="flex items-center gap-1.5">
                {deltaUp ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                <span className={`text-[10px] font-bold ${deltaUp ? "text-emerald-500" : "text-rose-400"}`}>{delta}</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-xl ${accent ? "bg-primary/15 shadow-[0_0_12px_hsla(220,90%,60%,0.15)]" : "bg-white/5"}`}>
            {icon}
          </div>
        </div>
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals}
          className={`text-3xl font-black tracking-tighter leading-none text-glow ${valueColor}`}
        />
      </div>
    </TiltCard>
  );
}

function SourceBar({ label, pct, color, delay = 0 }: { label: string; pct: number; color: string; delay?: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
    </div>
  );
}

function GlowRing({ value, max = 10, size = 80 }: { value: number; max?: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value / max;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="transform -rotate-90">
        <defs>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsla(220,20%,100%,0.06)" strokeWidth="4" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#ringGrad)" strokeWidth="4" strokeLinecap="round"
          filter="url(#ringGlow)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(220,90%,60%)" />
            <stop offset="100%" stopColor="hsl(160,60%,45%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedCounter value={value} decimals={1} className="text-lg font-black text-glow-primary" />
        <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">/{max}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (filters: any = { range: 'today' }) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/dashboard/stats?${qs}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="flex flex-col gap-6 pb-16">
      <motion.div variants={fadeUp} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2 relative z-50">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-glow leading-none">
            Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            INFINITYTRACK · Atribución Server-Side · CAPI v16.0
          </p>
        </div>
        <FilterBar onFilterChange={fetchStats} />
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-12 gap-4">
        <div className="col-span-2 md:col-span-5">
          <Metric label="Facturación Neta" value={stats?.revenue || 0} prefix="$"
            delta={loading ? "" : "+12.4% vs ayer"} deltaUp
            icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
            valueColor="text-emerald-400 text-glow-emerald" accent
          />
        </div>
        <div className="col-span-1 md:col-span-3">
          <Metric label="ROAS Real" value={stats?.roas || 0} suffix="x" decimals={2}
            delta="BE: 1.8x" deltaUp
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            valueColor="text-primary text-glow-primary"
          />
        </div>
        <div className="col-span-1 md:col-span-4">
          <Metric label="Ganancia" value={stats?.profit || 0} prefix="$"
            delta="+18.2%" deltaUp
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
            valueColor="text-emerald-400 text-glow-emerald"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-12 gap-4">
        <div className="col-span-1 md:col-span-3">
          <Metric label="Gasto Anuncios" value={stats?.spend || 0} prefix="$"
            icon={<BarChart3 className="w-4 h-4 text-primary" />}
          />
        </div>
        <div className="col-span-1 md:col-span-3">
          <TiltCard className="h-full">
            <div className="p-5 flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Margen</span>
              <AnimatedCounter value={stats?.margin || 0} suffix="%" decimals={1}
                className="text-3xl font-black tracking-tighter text-glow"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-bold"><span>0%</span><span>Target 75%</span></div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${stats?.margin || 0}%` }}
                  transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
              </div>
            </div>
          </TiltCard>
        </div>
        <div className="col-span-1 md:col-span-2">
          <Metric label="Total Ventas" value={stats?.sales || 0} decimals={0}
            delta="+3 hoy" deltaUp
            icon={<Target className="w-4 h-4 text-emerald-500" />} valueColor="text-emerald-400"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <Metric label="CPA" value={stats?.cpa || 0} prefix="$"
            icon={<Zap className="w-4 h-4 text-primary" />}
          />
        </div>
        <div className="col-span-2 md:col-span-2">
          <Metric label="Pendientes" value={stats?.pending || 0} prefix="$"
            delta="0 boletos" deltaUp={false}
            icon={<Clock className="w-4 h-4 text-amber-400" />}
            valueColor="text-amber-400 text-glow-amber"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <motion.div variants={fadeUp} className="md:col-span-4">
          <div className="glass-card p-6 h-full">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-primary/10 rounded-xl"><Share2 className="w-4 h-4 text-primary" /></div>
              <div><h3 className="text-sm font-black">Ventas por Fuente</h3><p className="text-[10px] text-muted-foreground">Atribución CAPI</p></div>
            </div>
            <div className="space-y-4">
              {stats?.sources?.map((s: any, i: number) => (
                <SourceBar key={i} label={s.label} pct={s.pct} color={s.color} delay={0.3 + i * 0.1} />
              )) || (
                <p className="text-[10px] text-muted-foreground italic">Sin datos de fuentes...</p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="md:col-span-6">
          <div className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl"><Package className="w-4 h-4 text-primary" /></div>
                <div><h3 className="text-sm font-black">Ventas por Producto</h3><p className="text-[10px] text-muted-foreground">Desglose funnel</p></div>
              </div>
            </div>
            <div className="space-y-1">
              {stats?.products?.length > 0 ? (
                stats.products.map((prod: any, i: number) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl group transition-colors ${prod.main ? "bg-primary/[0.06] border border-primary/15" : "hover:bg-white/[0.02]"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-bold truncate ${prod.main ? "" : "text-muted-foreground"}`}>{prod.n}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black">${prod.r.toLocaleString()}</span>
                      <p className="text-[9px] text-muted-foreground">{prod.q} uds</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50 grayscale">
                  <Package className="w-8 h-8 mb-2" />
                  <p className="text-[10px] uppercase font-black tracking-widest">Sin Ventas Registradas</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="md:col-span-2">
          <div className="glass-card p-5 h-full flex flex-col items-center justify-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Match Quality</span>
            <GlowRing value={stats?.matchQuality || 0} max={10} size={90} />
            <Badge className="bg-emerald-500/15 text-emerald-500 border-none text-[9px] font-black uppercase">
              EMQ Superior
            </Badge>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
