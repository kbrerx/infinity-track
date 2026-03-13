'use client';

import { motion } from "framer-motion";
import { Calendar, ChevronDown, LayoutGrid, Package } from "lucide-react";
import { useState } from "react";

export type TimeRange = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom';

interface FilterBarProps {
  onFilterChange: (filters: any) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [range, setRange] = useState<TimeRange>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const ranges = [
    { id: 'today', label: 'Hoy' },
    { id: 'yesterday', label: 'Ayer' },
    { id: '7d', label: 'Últimos 7 días' },
    { id: 'month', label: 'Este mes' },
    { id: 'custom', label: 'Personalizado' },
  ];

  const applyFilters = () => {
    onFilterChange({
      range,
      start: range === 'custom' ? customStart : undefined,
      end: range === 'custom' ? customEnd : undefined
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl relative z-50"
    >
      <div className="relative group z-30">
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 group">
          <Calendar size={14} className="text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {ranges.find(r => r.id === range)?.label}
          </span>
          <ChevronDown size={14} className="text-muted-foreground group-hover:rotate-180 transition-transform" />
        </button>
        
        <div className="absolute top-full left-0 mt-2 w-48 bg-[#0a0c10] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] p-1">
          {ranges.map((r) => (
            <button 
              key={r.id}
              onClick={() => {
                setRange(r.id as TimeRange);
                if (r.id !== 'custom') {
                  onFilterChange({ range: r.id });
                }
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-[11px] font-bold transition-colors ${range === r.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-gray-400'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl animate-in fade-in slide-in-from-left-2">
          <input 
            type="date" 
            className="bg-transparent text-[10px] font-bold text-white outline-none [color-scheme:dark]" 
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <span className="text-muted-foreground text-[10px]">-</span>
          <input 
            type="date" 
            className="bg-transparent text-[10px] font-bold text-white outline-none [color-scheme:dark]"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
        </div>
      )}

      <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block" />

      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10">
        <LayoutGrid size={14} className="text-blue-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Cuentas</span>
      </button>

      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 text-muted-foreground">
        <Package size={14} className="text-purple-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Productos</span>
      </button>

      <div className="flex-1" />

      <button 
        onClick={applyFilters}
        className="px-5 py-2 bg-primary hover:bg-primary-hover rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-[0_0_20px_hsla(220,90%,60%,0.3)] hover:shadow-[0_0_30px_hsla(220,90%,60%,0.5)]"
      >
        Filtrar Inteligencia
      </button>
    </motion.div>
  );
}
