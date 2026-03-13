'use client';

import { addPixel, deletePixel, updatePixel } from './actions';
import { Trash2, Plus, Copy, Check, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';

export default function PixelSection({ initialPixels }: { initialPixels: any[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const copyScript = (pixel_id: string) => {
    const domain = window.location.origin;
    const script = `<!-- InfinityPixel by InfinityTrack -->
<script src="${domain}/tracker.js" data-pixel-id="${pixel_id}"></script>
<!-- End InfinityPixel -->`;
    
    navigator.clipboard.writeText(script);
    setCopiedId(pixel_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdate = async (id: string) => {
    await updatePixel(id, editValue);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <form action={async (formData) => { await addPixel(formData); }} className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" placeholder="Nombre (ej: Brand A)" required className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none" />
          <input name="pixel_id" placeholder="Pixel ID" required className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none" />
        </div>
        <input name="access_token" type="password" placeholder="CAPI Access Token" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none" />
        <input name="domain_filter" placeholder="Dominio (Opcional si solo usas un pixel)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none" />
        <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
          <Plus size={16} /> Añadir InfinityPixel
        </button>
      </form>

      <div className="space-y-3">
        {initialPixels.map((px) => (
          <div key={px.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{px.name}</p>
                <div className="flex gap-3 items-center flex-wrap">
                  <p className="text-xs text-gray-500">ID: {px.pixel_id}</p>
                  
                  {editingId === px.id ? (
                    <div className="flex items-center gap-2 mt-1 w-full max-w-sm">
                      <input 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="dominios.com, otro.site"
                        className="flex-1 bg-black/40 border border-purple-500/50 rounded-lg px-2 py-1 text-[10px] text-white outline-none"
                      />
                      <button onClick={() => handleUpdate(px.id)} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg"><Save size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-white/5 rounded-lg"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-purple-400 font-mono">
                        {px.domain_filter || "Todos los dominios"}
                      </p>
                      <button 
                        onClick={() => { setEditingId(px.id); setEditValue(px.domain_filter || ""); }}
                        className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => confirm('¿Eliminar?') && deletePixel(px.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
            
            <button 
              onClick={() => copyScript(px.pixel_id)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {copiedId === px.pixel_id ? (
                <><Check size={12} className="text-green-500" /> ¡Copiado!</>
              ) : (
                <><Copy size={12} /> Copiar Script para Landing</>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
