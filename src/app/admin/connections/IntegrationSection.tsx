'use client';

import { addIntegration, deleteIntegration } from './actions';
import { Trash2, Plus, Zap, Power, ExternalLink, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

const INTEGRATION_TYPES = [
  { 
    id: 'hotmart', 
    name: 'Hotmart', 
    logo: '🔥',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    description: 'Ventas y suscripciones' 
  },
  { 
    id: 'stripe', 
    name: 'Stripe', 
    logo: '💳',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'Pagos internacionales (Próximamente)',
    disabled: true
  },
  { 
    id: 'shopify', 
    name: 'Shopify', 
    logo: '🛍️',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    description: 'E-commerce tracking (Próximamente)',
    disabled: true
  }
];

export default function IntegrationSection({ initialIntegrations }: { initialIntegrations: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState('hotmart');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhooks/hotmart`);
    }
  }, []);

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Integración (Marketplace style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INTEGRATION_TYPES.map((type) => (
          <button
            key={type.id}
            disabled={type.disabled}
            onClick={() => {
              setSelectedType(type.id);
              setShowForm(true);
            }}
            className={`p-5 rounded-3xl border transition-all text-left group relative overflow-hidden ${
              type.disabled 
                ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/[0.02]' 
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07] active:scale-95'
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-4 border ${type.color}`}>
              {type.logo}
            </div>
            <h3 className="font-bold text-white text-sm">{type.name}</h3>
            <p className="text-[10px] text-gray-500 mt-1">{type.description}</p>
            {!type.disabled && (
              <Plus size={14} className="absolute top-5 right-5 text-gray-600 group-hover:text-white transition-colors" />
            )}
          </button>
        ))}
      </div>

      {/* Formulario de Configuración */}
      {showForm && (
        <div className="p-6 bg-white/5 border border-purple-500/30 rounded-3xl space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Zap className="text-purple-400" size={18} />
              <h3 className="font-bold text-white uppercase tracking-wider text-xs">Configurar {selectedType === 'hotmart' ? 'Hotmart' : selectedType}</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xs">Cerrar</button>
          </div>

          <div className="space-y-4">
            {/* URL para copiar */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">URL de Webhook (Postback)</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={webhookUrl}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-gray-400 outline-none"
                />
                <button 
                  onClick={copyUrl}
                  className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  {copiedUrl ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                </button>
              </div>
            </div>

            <form action={async (formData) => { await addIntegration(formData); setShowForm(false); }} className="space-y-4">
              <input type="hidden" name="type" value={selectedType} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Nombre de la cuenta</label>
                    <input name="name" placeholder="ej: Cuenta Principal Hotmart" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">HOTTOK Secreto</label>
                    <input name="hottok" placeholder="Copia el token de Hotmart" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none" />
                 </div>
              </div>
              <button type="submit" className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                Activar Integración <ExternalLink size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Integraciones Activas */}
      <div className="space-y-3">
        {initialIntegrations.length === 0 && !showForm && (
          <div className="py-12 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-gray-600">
            <Zap size={24} className="mb-2 opacity-20" />
            <p className="text-xs font-medium italic">No hay integraciones activas. Conecta una fuente para empezar a recibir ventas.</p>
          </div>
        )}
        {initialIntegrations.map((item) => (
          <div key={item.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:border-purple-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                {INTEGRATION_TYPES.find(t => t.id === item.type)?.logo || '🔌'}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{item.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">{item.type}</span>
                  <div className="w-1 h-1 bg-gray-700 rounded-full" />
                  <span className="text-[10px] text-gray-500">Activo desde {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase rounded-full border border-green-500/20 flex items-center gap-2">
                <Power size={10} /> Live
              </div>
              <button 
                onClick={() => confirm('¿Eliminar esta integración?') && deleteIntegration(item.id)}
                className="p-2.5 hover:bg-red-500/20 rounded-xl text-gray-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
