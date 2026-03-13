import { supabase } from '@/lib/supabase';
import AdAccountSection from './AdAccountSection';
import PixelSection from './PixelSection';
import IntegrationSection from './IntegrationSection';
import { Zap } from 'lucide-react';

export default async function ConnectionsPage() {
  const { data: adAccounts } = await supabase.from('meta_ad_accounts').select('*').order('created_at', { ascending: false });
  const { data: pixels } = await supabase.from('meta_pixels').select('*').order('created_at', { ascending: false });
  const { data: integrations } = await supabase.from('integrations').select('*').order('created_at', { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div>
        <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent italic tracking-tighter">
          Conexiones Globales
        </h1>
        <p className="text-gray-400 mt-2 font-medium">Gestiona tu ecosistema de InfinityTrack de forma desacoplada.</p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
             <Zap className="text-purple-500" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Integraciones</h2>
        </div>
        <IntegrationSection initialIntegrations={integrations || []} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white">Cuentas Publicitarias</h2>
          <AdAccountSection initialAccounts={adAccounts || []} />
        </div>
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white">InfinityPixels</h2>
          <PixelSection initialPixels={pixels || []} />
        </div>
      </div>
    </div>
  );
}
