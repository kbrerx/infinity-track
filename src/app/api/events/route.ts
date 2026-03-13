import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Helper to get real IP
function getIP(req: Request) {
  const fallbacks = [
    req.headers.get('x-forwarded-for'),
    req.headers.get('x-real-ip'),
    req.headers.get('cf-connecting-ip'),
  ]
  return fallbacks.find(ip => ip !== null) || 'unknown'
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      event_type,
      session_id,
      visitor_id,
      page_url,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
      fbc,
      fbp,
      user_agent,
      event_id,
      metadata
    } = data;

    if (!event_type || !session_id || !visitor_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const currentHostname = new URL(page_url).hostname;
    const { data: pixels } = await supabase
      .from('meta_pixels')
      .select('pixel_id, access_token, domain_filter');
    
    const activePixel = pixels?.find(px => {
      if (!px.domain_filter) return false;
      const filters = px.domain_filter.split(',').map((f: string) => f.trim().toLowerCase());
      const host = currentHostname.toLowerCase();
      
      return filters.some((f: string) => host === f || host.endsWith('.' + f));
    }) || pixels?.[0];

    const pixel_id = activePixel?.pixel_id;
    const access_token = activePixel?.access_token;

    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const country = req.headers.get('x-vercel-ip-country') || 'Unknown';

    const { error } = await supabase
      .from('events')
      .insert([
        {
          event_type,
          session_id,
          visitor_id,
          page_url,
          pixel_id,
          referrer,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          utm_term,
          fbclid,
          fbc,
          fbp,
          user_agent,
          ip_address,
          country,
          event_id,
          campaign_id: metadata?.campaign_id,
          adset_id: metadata?.adset_id,
          ad_id: metadata?.ad_id,
          metadata: metadata || {}
        }
      ]);

    if (error) throw error;

    if (['PageView', 'InitiateCheckout', 'Lead'].includes(event_type)) {
      const { sendEventToMetaCAPI } = await import('@/lib/meta/capi');
      
      sendEventToMetaCAPI({
        eventName: event_type,
        eventTime: Date.now(),
        eventId: event_id,
        pixelId: pixel_id,
        accessToken: access_token,
        userData: {
          ip: ip_address,
          userAgent: user_agent,
          fbc: fbc,
          fbp: fbp,
          country: country
        },
        customData: {
          contentName: page_url,
          ...metadata
        }
      }).catch(err => console.error('Error sending behavioral CAPI:', err));
    }

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return NextResponse.json({ success: true }, { status: 201, headers });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new NextResponse('OK', { status: 200, headers });
}
