'use client';

import { deleteConnection } from './actions';
import { Trash2 } from 'lucide-react';

export default function ConnectionList({ initialAccounts }: { initialAccounts: any[] }) {
  if (initialAccounts.length === 0) {
    return (
      <div className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-3xl">
        <p className="text-gray-500">No hay cuentas conectadas aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {initialAccounts.map((acc) => (
        <div key={acc.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group hover:border-purple-500/50 transition-all">
          <div>
            <h3 className="text-lg font-bold text-white">{acc.name}</h3>
            <div className="flex gap-4 mt-1">
              <span className="text-xs text-gray-400">Pixel: <span className="text-gray-300">{acc.pixel_id}</span></span>
              <span className="text-xs text-gray-400">Ad Account: <span className="text-gray-300">{acc.ad_account_id}</span></span>
              {acc.domain_filter && (
                <span className="text-xs text-gray-400">Domain: <span className="text-gray-300">{acc.domain_filter}</span></span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase rounded-full border border-green-500/20">
               Conectado
             </div>
             <button 
                onClick={async () => {
                  if(confirm('¿Eliminar esta conexión?')) {
                    await deleteConnection(acc.id);
                  }
                }}
                className="p-2 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
             >
                <Trash2 size={16} />
             </button>
          </div>
        </div>
      ))}
    </div>
  );
}
