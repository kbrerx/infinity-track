import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const hottokHeader = req.headers.get('x-hotmart-hottok');
    // 1. SEGURIDAD: Validar el Token de Hotmart dinámicamente
    const { data: activeIntegration } = await supabase
      .from('integrations')
      .select('id')
      .eq('type', 'hotmart')
      .eq('is_active', true)
      .contains('config', { hottok: hottokHeader })
      .maybeSingle();

    const systemHottok = process.env.HOTMART_HOTTOK;
    const isValid = activeIntegration || (systemHottok && hottokHeader === systemHottok);

    if (!isValid) {
      console.warn('Hotmart Webhook: Unauthorized or Inactive HOTTOK');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { event, data } = payload;

    // Solo procesamos eventos relevantes para el dinero o el tracking
    const trackedEvents = [
      'PURCHASE_APPROVED', 
      'PURCHASE_REFUNDED', 
      'PURCHASE_CHARGEBACK', 
      'PURCHASE_CANCELED'
    ];

    if (!trackedEvents.includes(event)) {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const { purchase, buyer, product } = data;
    const { transaction, status, price, origin, buyer_ip } = purchase;
    const { sck, src } = origin || {};

    // 2. Registro inicial de la venta (Garantizar 100% de conteo)
    const purchaseData: any = {
      transaction_id: transaction,
      event_type: event,
      product_name: product.name,
      amount: price.value,
      currency: price.currency_value,
      buyer_name: buyer.name,
      buyer_email: buyer.email,
      buyer_phone: buyer.checkout_phone,
      buyer_country: buyer.address?.country_iso,
      h_sck: sck,
      h_src: src,
      ip_address: buyer_ip,
      status: status,
      raw_data: payload
    };

    // 3. ATRIBUCIÓN (Memoria de Elefante) - Solo para compras aprobadas (ventas)
    let attributionData = null;
    if (event === 'PURCHASE_APPROVED' && sck) {
      const { data: eventMatch } = await supabase
        .from('events')
        .select('visitor_id, fbc, fbp, user_agent, utm_source, utm_medium, utm_campaign, utm_content, utm_term, pixel_id, campaign_id, adset_id, ad_id')
        .eq('visitor_id', sck)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (eventMatch) attributionData = eventMatch;
    }

    // Si encontramos match, enriquecemos la compra
    if (attributionData) {
      Object.assign(purchaseData, {
        visitor_id: attributionData.visitor_id,
        fbc: attributionData.fbc,
        fbp: attributionData.fbp,
        user_agent: attributionData.user_agent,
        utm_source: attributionData.utm_source,
        utm_medium: attributionData.utm_medium,
        utm_campaign: attributionData.utm_campaign,
        utm_content: attributionData.utm_content,
        utm_term: attributionData.utm_term,
        pixel_id: attributionData.pixel_id,
        campaign_id: attributionData.campaign_id,
        adset_id: attributionData.adset_id,
        ad_id: attributionData.ad_id
      });
    }

    // Fallback: si no hay match pero hay 'src' de Hotmart, guardamos el src como utm_campaign (o podemos parsearlo)
    if (!purchaseData.utm_campaign && src) {
      purchaseData.utm_campaign = src; 
    }

    // Guardar o actualizar la compra en Supabase (maneja reembolsos actualizando el registro)
    const { error } = await supabase
      .from('purchases')
      .upsert([purchaseData], { onConflict: 'transaction_id' });

    if (error) {
      console.error('Error saving purchase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. ENVÍO A META CAPI (Solo para compras aprobadas)
    if (event === 'PURCHASE_APPROVED' && purchaseData.pixel_id) {
      // Intentar obtener el token dinámico de la base de datos para este pixel
      const { data: pixelConfig } = await supabase
        .from('meta_pixels')
        .select('access_token')
        .eq('pixel_id', purchaseData.pixel_id)
        .maybeSingle();

      const { sendEventToMetaCAPI } = await import('@/lib/meta/capi');
      
      await sendEventToMetaCAPI({
        eventName: 'Purchase',
        eventTime: Date.now(),
        eventId: transaction,
        pixelId: purchaseData.pixel_id,
        accessToken: pixelConfig?.access_token || process.env.META_ACCESS_TOKEN, // Dinámico > Fallback Env
        userData: {
          email: buyer.email,
          phone: buyer.checkout_phone,
          ip: buyer_ip,
          userAgent: purchaseData.user_agent,
          fbc: purchaseData.fbc,
          fbp: purchaseData.fbp,
          country: buyer.address?.country_iso
        },
        customData: {
          value: price.value,
          currency: price.currency_value,
          orderId: transaction,
          contentName: product.name
        }
      }).catch(err => console.error('Error sending Purchase CAPI:', err));
    }

    return NextResponse.json({ 
      success: true, 
      event: event,
      attributed: !!attributionData 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Hotmart Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Permitir validación de Hotmart (si envían un GET para probar el endpoint)
export async function GET() {
  return NextResponse.json({ status: 'ready' });
}
