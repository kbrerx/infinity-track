'use client';

import { addAdAccount, deleteAdAccount } from './actions';
import { Trash2, Plus } from 'lucide-react';

export default function AdAccountSection({ initialAccounts }: { initialAccounts: any[] }) {
  return (
    <div className="space-y-6">
      <form action={async (formData) => { await addAdAccount(formData); }} className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" placeholder="Nombre (ej: Perfil 1)" required className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none" />
          <input name="ad_account_id" placeholder="act_ID_DE_CUENTA" required className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none" />
        </div>
        <input name="access_token" type="password" placeholder="System User Access Token" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none" />
        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
          <Plus size={16} /> Añadir Cuenta de Gasto
        </button>
      </form>

      <div className="space-y-3">
        {initialAccounts.map((acc) => (
          <div key={acc.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
            <div>
              <p className="font-bold text-white text-sm">{acc.name}</p>
              <p className="text-xs text-gray-500">{acc.ad_account_id}</p>
            </div>
            <button onClick={() => confirm('¿Eliminar?') && deleteAdAccount(acc.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
