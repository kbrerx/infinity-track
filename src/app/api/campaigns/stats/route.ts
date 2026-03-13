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

    // 2. Fetch Ad Spend (Meta)
    const { data: spendData, error: sError } = await supabase
      .from('ad_spend')
      .select('campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, spend, impresiones, clicks')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', end ? new Date(end).toISOString() : now.toISOString());

    // 3. Fetch Purchases (Hotmart)
    const { data: purchaseData, error: pError } = await supabase
      .from('purchases')
      .select('campaign_id, adset_id, ad_id, amount, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', end ? new Date(end).toISOString() : now.toISOString());

    // 4. Fetch Events (Traffic Stats)
    const { data: eventData, error: eError } = await supabase
      .from('events')
      .select('campaign_id, adset_id, ad_id, event_type')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', end ? new Date(end).toISOString() : now.toISOString());

    if (sError || pError || eError) throw sError || pError || eError;

    // 5. Agrupar Jerárquicamente (Campaign -> AdSet -> Ad)
    const campaignsMap: Record<string, any> = {};

    spendData?.forEach(s => {
      if (!campaignsMap[s.campaign_id]) {
        campaignsMap[s.campaign_id] = {
          id: s.campaign_id, name: s.campaign_name, status: 'active',
          spend: 0, revenue: 0, roas: 0, leads: 0, cpa: 0, ventas: 0,
          clicks: 0, pageViews: 0, ic: 0, ctr: 0, cpc: 0, cpv: 0,
          impresiones: 0, pvToIc: 0, icToCompra: 0, convRate: 0,
          adSets: {}
        };
      }
      const c = campaignsMap[s.campaign_id];
      c.spend += Number(s.spend) || 0;
      c.clicks += Number(s.clicks) || 0;
      c.impresiones += Number(s.impresiones) || 0;

      if (!c.adSets[s.adset_id]) {
        c.adSets[s.adset_id] = {
          id: s.adset_id, name: s.adset_name, status: 'active',
          spend: 0, revenue: 0, roas: 0, leads: 0, cpa: 0, ventas: 0,
          clicks: 0, pageViews: 0, ic: 0, ctr: 0, cpc: 0, cpv: 0,
          impresiones: 0, pvToIc: 0, icToCompra: 0, convRate: 0,
          ads: {}
        };
      }
      const as = c.adSets[s.adset_id];
      as.spend += Number(s.spend) || 0;
      as.clicks += Number(s.clicks) || 0;
      as.impresiones += Number(s.impresiones) || 0;

      if (!as.ads[s.ad_id]) {
        as.ads[s.ad_id] = {
          id: s.ad_id, name: s.ad_name, status: 'active',
          spend: 0, revenue: 0, roas: 0, ctr: 0, cpa: 0, clicks: 0,
          pageViews: 0, ic: 0, cpc: 0, cpv: 0, ventas: 0, leads: 0,
          impresiones: 0, pvToIc: 0, icToCompra: 0, convRate: 0
        };
      }
      const ad = as.ads[s.ad_id];
      ad.spend += Number(s.spend) || 0;
      ad.clicks += Number(s.clicks) || 0;
      ad.impresiones += Number(s.impresiones) || 0;
    });

    // Añadir Compras
    purchaseData?.forEach(p => {
      if (p.status !== 'APPROVED') return;
      const c = campaignsMap[p.campaign_id];
      if (c) {
        c.revenue += Number(p.amount) || 0;
        c.ventas += 1;
        const as = c.adSets[p.adset_id];
        if (as) {
          as.revenue += Number(p.amount) || 0;
          as.ventas += 1;
          const ad = as.ads[p.ad_id];
          if (ad) {
            ad.revenue += Number(p.amount) || 0;
            ad.ventas += 1;
          }
        }
      }
    });

    // Añadir Eventos (PV, IC, Lead)
    eventData?.forEach(e => {
      const c = campaignsMap[e.campaign_id];
      if (!c) return;
      if (e.event_type === 'PageView') c.pageViews += 1;
      if (e.event_type === 'InitiateCheckout') c.ic += 1;
      if (e.event_type === 'Lead') c.leads += 1;

      const as = c.adSets[e.adset_id];
      if (as) {
        if (e.event_type === 'PageView') as.pageViews += 1;
        if (e.event_type === 'InitiateCheckout') as.ic += 1;
        if (e.event_type === 'Lead') as.leads += 1;
        const ad = as.ads[e.ad_id];
        if (ad) {
          if (e.event_type === 'PageView') ad.pageViews += 1;
          if (e.event_type === 'InitiateCheckout') ad.ic += 1;
          if (e.event_type === 'Lead') ad.leads += 1;
        }
      }
    });

    // Finalizar cálculos (ROAS, CTR, etc.)
    const result = Object.values(campaignsMap).map(c => {
      c.roas = c.spend > 0 ? c.revenue / c.spend : 0;
      c.cpa = c.ventas > 0 ? c.spend / c.ventas : 0;
      c.ctr = c.impresiones > 0 ? (c.clicks / c.impresiones) * 100 : 0;
      c.cpc = c.clicks > 0 ? c.spend / c.clicks : 0;
      c.cpv = c.pageViews > 0 ? c.spend / c.pageViews : 0;
      c.pvToIc = c.pageViews > 0 ? (c.ic / c.pageViews) * 100 : 0;
      c.icToCompra = c.ic > 0 ? (c.ventas / c.ic) * 100 : 0;
      c.convRate = c.clicks > 0 ? (c.ventas / c.clicks) : 0;

      c.adSets = Object.values(c.adSets).map((as: any) => {
        as.roas = as.spend > 0 ? as.revenue / as.spend : 0;
        as.cpa = as.ventas > 0 ? as.spend / as.ventas : 0;
        as.ctr = as.impresiones > 0 ? (as.clicks / as.impresiones) * 100 : 0;
        as.cpc = as.clicks > 0 ? as.spend / as.clicks : 0;
        as.cpv = as.pageViews > 0 ? as.spend / as.pageViews : 0;
        as.pvToIc = as.pageViews > 0 ? (as.ic / as.pageViews) * 100 : 0;
        as.icToCompra = as.ic > 0 ? (as.ventas / as.ic) * 100 : 0;
        as.convRate = as.clicks > 0 ? (as.ventas / as.clicks) : 0;

        as.ads = Object.values(as.ads).map((ad: any) => {
          ad.roas = ad.spend > 0 ? ad.revenue / ad.spend : 0;
          ad.cpa = ad.ventas > 0 ? ad.spend / ad.ventas : 0;
          ad.ctr = ad.impresiones > 0 ? (ad.clicks / ad.impresiones) * 100 : 0;
          ad.cpc = ad.clicks > 0 ? ad.spend / ad.clicks : 0;
          ad.cpv = ad.pageViews > 0 ? ad.spend / ad.pageViews : 0;
          ad.pvToIc = ad.pageViews > 0 ? (ad.ic / ad.pageViews) * 100 : 0;
          ad.icToCompra = ad.ic > 0 ? (ad.ventas / ad.ic) * 100 : 0;
          ad.convRate = ad.clicks > 0 ? (ad.ventas / ad.clicks) : 0;
          return ad;
        });
        return as;
      });
      return c;
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Campaign Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
