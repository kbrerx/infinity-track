"use client";

import { motion } from "framer-motion";

const events = [
  { label: "CAPI PURCHASE", value: "$297.00", status: "✓ MATCH 9.8/10", color: "text-emerald-400" },
  { label: "META SYNC", value: "Ads Manager", status: "OK 2MIN", color: "text-primary" },
  { label: "SUPABASE DB", value: "0ms latency", status: "CONNECTED", color: "text-emerald-400" },
  { label: "ULTIMO WEBHOOK", value: "Hotmart", status: "RECEIVED 14:58", color: "text-primary" },
  { label: "CAPI LEAD", value: "email+ip+fbc", status: "✓ EMQ 9.5/10", color: "text-emerald-400" },
  { label: "PIXEL SERVER", value: "trackerapp.io/track", status: "LIVE", color: "text-emerald-400" },
  { label: "RETRASO INTELIGENTE", value: "15 min activo", status: "PROCESSING", color: "text-yellow-400" },
  { label: "EVENT DEDUP", value: "event_id valid", status: "NO DUPLICADOS", color: "text-emerald-400" },
];

const tickerContent = events.map(e =>
  `${e.label}: ${e.value} - ${e.status}`
).join("    .    ");

export function StatusTicker() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-8 flex items-center overflow-hidden bg-black/80 backdrop-blur-md border-t border-white/5">
      <div className="flex items-center gap-2 px-4 border-r border-white/10 h-full shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">LIVE</span>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <motion.div
          className="flex items-center gap-0 whitespace-nowrap text-[10px] font-mono font-semibold text-muted-foreground"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 35, ease: "linear", repeat: Infinity }}
        >
          <span className="pr-8">{tickerContent}</span>
          <span className="pr-8">{tickerContent}</span>
        </motion.div>
      </div>

      <div className="px-4 border-l border-white/10 h-full flex items-center shrink-0">
        <span className="text-[9px] font-mono text-muted-foreground/60">
          {new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} CST
        </span>
      </div>
    </div>
  );
}
