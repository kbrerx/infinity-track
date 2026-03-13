import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// La sincronización ahora es totalmente dinámica y lee de la tabla 'meta_ad_accounts'

export async function GET(req: Request) {
  try {
    // 1. Obtener todas las cuentas activas de Meta (Gasto)
    const { data: accounts, error: accError } = await supabase
      .from('meta_ad_accounts')
      .select('*')
      .eq('is_active', true);

    if (accError) throw accError;

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No active Meta accounts found in database' });
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || yesterday;

    let totalSynced = 0;
    const results = [];

    for (const account of accounts) {
      console.log(`Sincronizando cuenta: ${account.name} para: ${date}`);

      // Llamada a Meta Graph API para esta cuenta específica
      const url = `https://graph.facebook.com/v19.0/${account.ad_account_id}/insights?` + 
        new URLSearchParams({
          level: 'ad',
          // Añadimos ad_name y ad_id (usaremos ad_id para pedir el thumbnail en una llamada aparte o vía field expansion)
          fields: 'campaign_id,campaign_name,adset_id,ad_id,ad_name,spend,impressions,clicks',
          time_range: JSON.stringify({ since: date, until: date }),
          access_token: account.access_token
        });

      const response = await fetch(url);
      const result = await response.json();

      if (result.error) {
        console.error(`Error in account ${account.name}:`, result.error.message);
        results.push({ account: account.name, status: 'error', error: result.error.message });
        continue;
      }

      const insights = result.data || [];
      
      if (insights.length > 0) {
        // Obtenemos los thumbnails de los anuncios en este batch para no hacer 1000 llamadas
        const adIds = insights.map((i: any) => i.ad_id).join(',');
        const thumbUrl = `https://graph.facebook.com/v19.0/?ids=${adIds}&fields=ad_name,creative{thumbnail_url}&access_token=${account.access_token}`;
        const thumbRes = await fetch(thumbUrl);
        const thumbData = await thumbRes.json();

        const spendData = insights.map((item: any) => {
          const creativeInfo = thumbData[item.ad_id]?.creative;
          return {
            date: date,
            campaign_id: item.campaign_id,
            campaign_name: item.campaign_name,
            adset_id: item.adset_id,
            ad_id: item.ad_id,
            ad_name: item.ad_name || thumbData[item.ad_id]?.ad_name || 'Anuncio sin nombre',
            thumbnail_url: creativeInfo?.thumbnail_url || null,
            spend: parseFloat(item.spend),
            impresiones: parseInt(item.impressions),
            clicks: parseInt(item.clicks),
            platform: 'facebook'
          };
        });

        const { error: dbError } = await supabase
          .from('ad_spend')
          .upsert(spendData, { onConflict: 'date, campaign_id, ad_id' });

        if (dbError) throw dbError;

        // También actualizamos la tabla de metadatos de anuncios para persistencia a largo plazo
        if (spendData.length > 0) {
          const adMetadata = spendData.map((s: any) => ({
            id: s.ad_id,
            name: s.ad_name,
            thumbnail_url: s.thumbnail_url,
            last_updated: new Date().toISOString()
          }));

          const { error: metaError } = await supabase
            .from('meta_ads_metadata')
            .upsert(adMetadata, { onConflict: 'id' });
          
          if (metaError) console.error('Error saving ad metadata:', metaError.message);
        }

        totalSynced += spendData.length;
        results.push({ account: account.name, status: 'success', synced: spendData.length });
      } else {
        results.push({ account: account.name, status: 'no_data' });
      }
    }

    return NextResponse.json({ 
      success: true, 
      date, 
      total_synced_records: totalSynced,
      accounts: results
    });

  } catch (error: any) {
    console.error('Meta Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
