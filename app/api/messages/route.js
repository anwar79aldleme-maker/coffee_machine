import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function POST(request) {
  try {
    const { deviceId, clickType, message } = await request.json();
    
    if (!deviceId || !clickType) {
      return Response.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }
    
    const event = {
      id: `${Date.now()}-${deviceId}`,
      deviceId,
      clickType,
      message,
      timestamp: new Date().toISOString(),
    };
    
    await redis.lpush('messages', JSON.stringify(event));
    await redis.ltrim('messages', 0, 199); // الاحتفاظ بآخر 200 رسالة
    
    await redis.publish('messages', JSON.stringify(event));
    
    return Response.json({ success: true, event });
    
  } catch (error) {
    console.error('❌ خطأ في الخادم:', error);
    return Response.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
