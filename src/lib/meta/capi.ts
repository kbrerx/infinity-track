import crypto from 'crypto';

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// Meta CAPI requires SHA-256 hashing for PII data
function hashData(data: string | undefined): string | null {
  if (!data) return null;
  const cleanData = data.trim().toLowerCase();
  return crypto.createHash('sha256').update(cleanData).digest('hex');
}

interface MetaEventParams {
  eventName: string;
  eventTime: number; // Unix timestamp in seconds
  eventId?: string;
  pixelId?: string;
  accessToken?: string;
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    ip?: string;
    userAgent?: string;
    fbc?: string;
    fbp?: string;
    country?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    orderId?: string;
    contentName?: string;
  };
}

export async function sendEventToMetaCAPI({ eventName, eventTime, userData, customData, pixelId, accessToken, eventId }: MetaEventParams) {
  const targetPixelId = pixelId || PIXEL_ID;
  const targetAccessToken = accessToken || ACCESS_TOKEN;

  if (!targetPixelId || !targetAccessToken) {
    console.warn('Meta CAPI: Missing Pixel ID or Access Token');
    return null;
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(eventTime / 1000), // Convert to seconds
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

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Meta CAPI Request Error:', error);
    return { error };
  }
}
