import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // 2. Fetch Data (Queries paralelas)
    const [
      { data: spendData, error: sErr },
      { data: salesData, error: slErr },
      { data: eventsData, error: eErr }
    ] = await Promise.all([
      supabase.from('ad_spend').select('spend').gte('created_at', startDate.toISOString()),
      supabase.from('purchases').select('amount, status, utm_source').gte('created_at', startDate.toISOString()),
      supabase.from('events').select('pixel_id').gte('created_at', startDate.toISOString())
    ]);

    if (sErr || slErr || eErr) throw sErr || slErr || eErr;

    // 3. Procesar Atribución (Sources)
    const sourcesMap: Record<string, number> = {};
    const approvedSales = salesData?.filter(s => s.status === 'APPROVED') || [];
    
    approvedSales.forEach(s => {
      const src = s.utm_source || 'Unknown';
      sourcesMap[src] = (sourcesMap[src] || 0) + 1;
    });

    const totalSalesCount = approvedSales.length;
    const sources = Object.entries(sourcesMap).map(([label, count]) => ({
      label,
      pct: totalSalesCount > 0 ? Math.round((count / totalSalesCount) * 100) : 0,
      color: label.toLowerCase().includes('facebook') ? '#0668E1' : '#6366f1'
    })).sort((a, b) => b.pct - a.pct).slice(0, 4);

    // 4. Totales Globales
    const totalRevenue = approvedSales.reduce((acc, s) => acc + (s.amount || 0), 0);
    const totalSpend = spendData?.reduce((acc, s) => acc + (s.spend || 0), 0) || 0;
    const profit = totalRevenue - totalSpend;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const cpa = totalSalesCount > 0 ? totalSpend / totalSalesCount : 0;

    return NextResponse.json({
      revenue: totalRevenue,
      spend: totalSpend,
      profit: profit,
      roas: roas,
      margin: margin,
      sales: totalSalesCount,
      cpa: cpa,
      pending: 0,
      sources: sources,
      matchQuality: 8.4, // Placeholder
      products: [
        { n: "Legacy Full Course", main: true, r: totalRevenue * 0.7, q: Math.round(totalSalesCount * 0.7) },
        { n: "E-book: Scaling Ads", main: false, r: totalRevenue * 0.3, q: Math.round(totalSalesCount * 0.3) }
      ]
    });

  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
