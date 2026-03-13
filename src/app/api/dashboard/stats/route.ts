import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'today';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const accountId = searchParams.get('accountId');
    const productId = searchParams.get('productId');

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

    // 2. Querybase para cálculos agregados
    const { data: purchases, error: pError } = await supabase
      .from('purchases')
      .select('amount, status, created_at, product_name, fbc, fbp, buyer_email, ip_address, utm_campaign')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', end ? new Date(end).toISOString() : now.toISOString());

    const { data: spend, error: sError } = await supabase
      .from('ad_spend')
      .select('spend, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', end ? new Date(end).toISOString() : now.toISOString());

    if (pError || sError) throw pError || sError;

    // 3. Procesar Métricas
    const totalRevenue = purchases?.reduce((acc, p) => acc + (p.status === 'APPROVED' ? Number(p.amount) : 0), 0) || 0;
    const totalSpend = spend?.reduce((acc, s) => acc + Number(s.spend), 0) || 0;
    const salesCount = purchases?.filter(p => p.status === 'APPROVED').length || 0;
    const roas = totalSpend > 0 ? (totalRevenue / totalSpend) : 0;
    const profit = totalRevenue - totalSpend;
    const cpa = salesCount > 0 ? (totalSpend / salesCount) : 0;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // 4. Desglose por Producto
    const productStats: Record<string, { name: string, quantity: number, revenue: number }> = {};
    purchases?.forEach(p => {
      if (p.status !== 'APPROVED') return;
      if (!productStats[p.product_name]) {
        productStats[p.product_name] = { name: p.product_name, quantity: 0, revenue: 0 };
      }
      productStats[p.product_name].quantity += 1;
      productStats[p.product_name].revenue += Number(p.amount);
    });

    const products = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .map(p => ({
        n: p.name,
        q: p.quantity,
        r: p.revenue,
        p: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
        main: false
      }));

    if (products.length > 0) products[0].main = true;

    // 5. Calcular Match Quality Real (EMQ)
    let totalSignals = 0;
    let possibleSignals = purchases?.length ? purchases.length * 5 : 0;
    
    purchases?.forEach(p => {
      if (p.status !== 'APPROVED') return;
      if (p.fbc) totalSignals++;
      if (p.fbp) totalSignals++;
      if (p.buyer_email) totalSignals++;
      if (p.ip_address) totalSignals++;
      if (p.utm_campaign) totalSignals++;
    });

    const realMatchQuality = possibleSignals > 0 ? Number(((totalSignals / possibleSignals) * 10).toFixed(1)) : 0;

    return NextResponse.json({
      revenue: totalRevenue,
      spend: totalSpend,
      profit: profit,
      roas: roas,
      sales: salesCount,
      cpa: cpa,
      margin: margin,
      matchQuality: realMatchQuality || 0,
      pending: 0,
      sources: [
        { label: 'Meta Ads', pct: 100, color: 'hsl(220,90%,60%)' }
      ],
      products: products
    });

  } catch (error: any) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
