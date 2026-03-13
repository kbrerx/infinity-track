import crypto from 'crypto';

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

function hashData(data: string | undefined): string | null {
  if (!data) return null;
  const cleanData = data.trim().toLowerCase();
  return crypto.createHash('sha256').update(cleanData).digest('hex');
}

export async function sendEventToMetaCAPI({ 
  eventName, 
  userData, 
  customData, 
  pixelId, 
  accessToken, 
  eventId
}: {
  eventName: string;
  userData: any;
  customData?: any;
  pixelId?: string;
  accessToken?: string;
  eventId?: string;
}) {
  const eventTime = Date.now();
  const targetPixelId = pixelId || PIXEL_ID;
  const targetAccessToken = accessToken || ACCESS_TOKEN;

  if (!targetPixelId || !targetAccessToken) return null;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(eventTime / 1000),
        event_id: eventId,
        action_source: 'website',
        user_data: {
          em: hashData(userData.email),
          ph: hashData(userData.phone),
          fn: hashData(userData.firstName),
          ln: hashData(userData.lastName),
          client_ip_address: userData.ip,
          client_user_agent: userData.userAgent,
          fbc: userData.fbc,
          fbp: userData.fbp,
          country: hashData(userData.country),
        },
        custom_data: {
          value: customData?.value,
          currency: customData?.currency || 'USD',
          order_id: customData?.orderId,
          content_name: customData?.contentName,
        },
      },
    ],
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${targetPixelId}/events?access_token=${targetAccessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    return { error };
  }
}
