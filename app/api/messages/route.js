// تخزين مؤقت في الذاكرة (لاحظ أن Vercel Serverless Functions قد تعيد ضبط هذه البيانات)
let messagesStore = [];
let clients = [];

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
    
    // تخزين آخر 50 رسالة فقط
    messagesStore = [event, ...messagesStore].slice(0, 50);
    
    // إرسال الحدث لجميع المتصفحات المتصلة
    clients.forEach(client => {
      try {
        client.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (e) {
        console.error('خطأ في الإرسال للمتصفح:', e);
      }
    });
    
    return Response.json({ success: true, event });
    
  } catch (error) {
    console.error('خطأ:', error);
    return Response.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      const client = {
        id: Date.now(),
        write: (data) => controller.enqueue(encoder.encode(data))
      };
      
      clients.push(client);
      
      // إرسال آخر 10 رسائل للمتصفح الجديد
      const lastMessages = messagesStore.slice(0, 10);
      for (const msg of lastMessages.reverse()) {
        client.write(`data: ${JSON.stringify(msg)}\n\n`);
      }
      
      // تنظيف الاتصال عند الإغلاق
      request.signal.addEventListener('abort', () => {
        clients = clients.filter(c => c.id !== client.id);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
