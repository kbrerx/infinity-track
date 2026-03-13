import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { ad_account_id, access_token } = await req.json();

    if (!ad_account_id || !access_token) {
      return NextResponse.json({ error: 'Missing account ID or token' }, { status: 400 });
    }

    // 1. Fetch data from Meta Marketing API
    // (Simulación de fetch a Meta para simplificar el ejemplo, en prod sería un fetch real)
    const mockMetaStats = [
      {
        campaign_id: 'camp_123',
        campaign_name: 'Main Prospecting',
        adset_id: 'as_456',
        adset_name: 'Interest: Tech',
        ad_id: 'ad_789',
        ad_name: 'Video Hook 1',
        spend: 45.5,
        impressions: 1200,
        clicks: 85
      },
      {
        campaign_id: 'camp_123',
        campaign_name: 'Main Prospecting',
        adset_id: 'as_001',
        adset_name: 'Lookalike 1%',
        ad_id: 'ad_002',
        ad_name: 'Image Banner A',
        spend: 32.1,
        impressions: 950,
        clicks: 42
      }
    ];

    // 2. Upsert to Supabase
    const { error } = await supabase
      .from('ad_spend')
      .upsert(mockMetaStats, { onConflict: 'ad_id' });

    if (error) throw error;

    return NextResponse.json({ success: true, count: mockMetaStats.length });
  } catch (error: any) {
    console.error('Meta Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
