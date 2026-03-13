"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import {
  Target, TrendingUp, DollarSign, BarChart3,
  ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FilterBar from "@/components/dashboard/FilterBar";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 30, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } } };

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 300, damping: 30 });
  const sy = useSpring(my, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(sy, [0, 1], [3, -3]);
  const rotateY = useTransform(sx, [0, 1], [-3, 3]);
  const glow = useTransform([sx, sy], ([x, y]: number[]) =>
    `radial-gradient(250px circle at ${x * 100}% ${y * 100}%, hsla(220,90%,65%,0.08) 0%, transparent 60%)`
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
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={`glass-card cursor-default ${className}`}
    >
      <motion.div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: glow }} />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

type SortKey = "spend" | "revenue" | "roas" | "ventas";
type SortDir = "asc" | "desc" | null;

function roasColor(roas: number) {
  if (roas >= 3) return "text-emerald-400 text-glow-emerald";
  if (roas >= 2) return "text-amber-400 text-glow-amber";
  return "text-rose-400 text-glow-rose";
}

function statusBadge(status: string) {
  return <Badge className="text-[8px] font-black uppercase border-none bg-emerald-500/15 text-emerald-500">Activa</Badge>;
}

export default function CampaignsPage() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async (filters: any = { range: 'today' }) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(filters).toString();
      const res = await fetch(`/api/campaigns/stats?${qs}`);
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const filtered = useMemo(() => {
    const list = Array.isArray(campaigns) ? campaigns : [];
    return list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [campaigns, search]);

  const totals = useMemo(() => {
    const list = Array.isArray(campaigns) ? campaigns : [];
    const spend = list.reduce((s, c) => s + c.spend, 0);
    const rev = list.reduce((s, c) => s + c.revenue, 0);
    return { spend, revenue: rev, roas: spend > 0 ? rev / spend : 0 };
  }, [campaigns]);

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="flex flex-col gap-5 pb-16">
      <motion.div variants={fadeUp} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2 relative z-50">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-glow">Gestión de Campañas</h1>
          <p className="text-sm text-muted-foreground mt-2">Estructura jerárquica Campaña → AdSet → Anuncio</p>
        </div>
        <FilterBar onFilterChange={fetchCampaigns} />
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Gasto" value={totals.spend} prefix="$" icon={<DollarSign className="w-4 h-4" />} />
        <Metric label="Revenue" value={totals.revenue} prefix="$" icon={<TrendingUp className="w-4 h-4" />} valueColor="text-emerald-400" />
        <Metric label="ROAS" value={totals.roas} suffix="x" icon={<BarChart3 className="w-4 h-4" />} valueColor={roasColor(totals.roas)} />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black">Analítica Jerárquica</h3>
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-xs" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[9px] text-muted-foreground uppercase border-b border-white/5">
              <tr>
                <th className="px-6 py-3 w-8"></th>
                <th className="px-2 py-3">Nombre</th>
                <th className="px-4 py-3 text-right">Gasto</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">ROAS</th>
                <th className="px-4 py-3 text-right">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                  <td className="px-6 py-4"><ChevronRight className="w-3.5 h-3.5" /></td>
                  <td className="px-2 py-4"><p className="text-sm font-bold">{c.name}</p></td>
                  <td className="px-4 py-4 text-right font-mono">${c.spend.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-black text-emerald-400">${c.revenue.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-black">{c.roas.toFixed(2)}x</td>
                  <td className="px-4 py-4 text-right font-bold">{c.ventas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function Metric({ label, value, prefix = "", suffix = "", valueColor = "", icon }: any) {
  return (
    <TiltCard>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-black uppercase text-muted-foreground">{label}</span>
          <div className="p-1.5 bg-white/5 rounded-lg">{icon}</div>
        </div>
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} className={`text-2xl font-black ${valueColor}`} />
      </div>
    </TiltCard>
  );
}
