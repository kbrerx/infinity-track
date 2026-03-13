import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'today';
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // 1. Calcular rango de fechas
    const now = new Date();
    let startDate = new Date();

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'custom' && start) {
      startDate = new Date(start);
    }

    // 2. Fetch Ad Spend por Anuncio
    const { data: spendData, error: sError } = await supabase
      .from('ad_spend')
      .select('ad_id, ad_name, thumbnail_url, spend, impresiones, clicks')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', end ? new Date(end).toISOString() : now.toISOString());

    // 3. Fetch Purchases por Anuncio
    const { data: purchaseData, error: pError } = await supabase
      .from('purchases')
      .select('ad_id, amount, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', end ? new Date(end).toISOString() : now.toISOString());

    if (sError || pError) throw sError || pError;

    // 4. Agrupar datos por Anuncio
    const creativesMap: Record<string, any> = {};

    spendData?.forEach(s => {
      if (!creativesMap[s.ad_id]) {
        creativesMap[s.ad_id] = {
          id: s.ad_id,
          name: s.ad_name || 'Anuncio sin nombre',
          thumbnail: s.thumbnail_url || null,
          type: "video", // Por defecto
          spend: 0,
          revenue: 0,
          roas: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          ventas: 0,
          status: "active",
          fatigue: 0,
          fatigueHistory: [],
          relevance: 0,
          frequency: 0
        };
      }
      const cr = creativesMap[s.ad_id];
      cr.spend += Number(s.spend) || 0;
      cr.impressions += Number(s.impresiones) || 0;
      cr.clicks += Number(s.clicks) || 0;
    });

    purchaseData?.forEach(p => {
      if (p.status !== 'APPROVED') return;
      const cr = creativesMap[p.ad_id];
      if (cr) {
        cr.revenue += Number(p.amount) || 0;
        cr.ventas += 1;
      }
    });

    // 5. Cálculos Finales
    const result = Object.values(creativesMap).map(cr => {
      cr.roas = cr.spend > 0 ? cr.revenue / cr.spend : 0;
      cr.ctr = cr.impressions > 0 ? (cr.clicks / cr.impressions) * 100 : 0;
      cr.cpc = cr.clicks > 0 ? cr.spend / cr.clicks : 0;
      
      // Lógica de Status Simple
      if (cr.roas >= 3) cr.status = "scaling";
      else if (cr.roas >= 1.5) cr.status = "active";
      else cr.status = "warning";
      
      return cr;
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Creative Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
