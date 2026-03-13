import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendToCapi } from '@/lib/meta/capi';

export async function POST(req: Request) {
  try {
    const hottokHeader = req.headers.get('x-hotmart-hottok');

    // 1. SEGURIDAD: Validar el Token de Hotmart dinámicamente
    const { data: activeIntegration } = await supabase
      .from('integrations')
      .select('id, config')
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

    const body = await req.json();
    const event = body.event;
    const data = body.data;

    // Solo procesar compras (PURCHASE) y reembolsos por ahora
    if (event !== 'PURCHASE_APPROVED' && event !== 'PURCHASE_OUT_OF_BALANCE' && event !== 'PURCHASE_CANCELED' && event !== 'PURCHASE_REFUNDED') {
      return NextResponse.json({ received: true, ignored: true });
    }

    const { buyer, product, purchase, attribution } = data;

    // Estructura para Supabase
    const saleData = {
      hotmart_sale_item_id: purchase.transaction,
      event_type: event,
      amount: purchase.price.value,
      currency: purchase.price.currency_code,
      product_name: product.name,
      buyer_email: buyer.email,
      buyer_name: buyer.name,
      checkout_id: purchase.checkout_country?.iso_code,
      utm_source: attribution.source,
      utm_medium: attribution.medium,
      utm_campaign: attribution.campaign,
      utm_content: attribution.content,
      src: attribution.src,
      pixel_id: purchase.pixel_id, // Importante para CAPI
      status: purchase.status,
      created_at: new Date(purchase.approved_date || purchase.order_date).toISOString(),
    };

    // 2. Guardar en Base de Datos
    const { error: dbError } = await supabase
      .from('sales')
      .upsert([saleData], { onConflict: 'hotmart_sale_item_id' });

    if (dbError) throw dbError;

    // 3. Enviar a Meta CAPI si hay un Pixel ID
    if (saleData.pixel_id) {
       // Buscar el token dinámico en la tabla meta_pixels
       const { data: pixelConfig } = await supabase
         .from('meta_pixels')
         .select('access_token')
         .eq('pixel_id', saleData.pixel_id)
         .maybeSingle();

       if (pixelConfig?.access_token) {
          await sendToCapi({
            eventName: event === 'PURCHASE_APPROVED' ? 'Purchase' : 'Refund',
            pixelId: saleData.pixel_id,
            accessToken: pixelConfig.access_token,
            userData: {
              email: buyer.email,
              name: buyer.name,
              // Hotmart no siempre envía fbc/fbp en el webhook, pero si los tenemos en la venta los usamos
            },
            customData: {
              value: saleData.amount,
              currency: saleData.currency,
              content_name: saleData.product_name,
              transaction_id: purchase.transaction
            },
            eventSourceUrl: `https://${req.headers.get('host')}/checkout`,
          });
       }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Hotmart Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
