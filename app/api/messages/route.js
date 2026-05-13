// تخزين مؤقت للرسائل (في الذاكرة)
let messagesStore = [];
let clients = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { deviceId, clickType, message } = body;
    
    // التحقق من صحة البيانات
    if (!deviceId || !clickType) {
      return Response.json({ 
        error: 'بيانات ناقصة', 
        required: ['deviceId', 'clickType', 'message'] 
      }, { status: 400 });
    }
    
    // إنشاء حدث جديد
    const event = {
      id: `${Date.now()}-${deviceId}-${Math.random()}`,
      deviceId: deviceId.toString(),
      clickType: parseInt(clickType),
      message: message || `ضغطة ${clickType}`,
      timestamp: new Date().toISOString(),
      serverReceived: Date.now()
    };
    
    console.log(`📨 استلمت من ${deviceId}: ${event.message}`);
    
    // تخزين آخر 100 رسالة فقط
    messagesStore = [event, ...messagesStore].slice(0, 100);
    
    // إرسال الحدث لجميع المتصفحات المتصلة
    const eventData = `data: ${JSON.stringify(event)}\n\n`;
    clients.forEach(client => {
      try {
        client.write(eventData);
      } catch (error) {
        console.error('خطأ في الإرسال للمتصفح:', error);
      }
    });
    
    // إرجاع رد ناجح
    return Response.json({ 
      success: true, 
      message: 'تم استلام الرسالة بنجاح',
      event: event
    });
    
  } catch (error) {
    console.error('خطأ في معالجة الطلب:', error);
    return Response.json({ 
      error: 'خطأ داخلي في الخادم',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  const encoder = new TextEncoder();
  
  // إنشاء دفق للأحداث
  const stream = new ReadableStream({
    start(controller) {
      // إضافة عميل جديد
      const clientId = Date.now();
      const client = {
        id: clientId,
        write: (data) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error(`خطأ في الكتابة للعميل ${clientId}:`, error);
          }
        },
        close: () => {
          try {
            controller.close();
          } catch (error) {
            // تجاهل أخطاء الإغلاق
          }
        }
      };
      
      clients.push(client);
      console.log(`✅ عميل جديد متصل: ${clientId} - المجموع: ${clients.length}`);
      
      // إرسال آخر 20 رسالة للعميل الجديد
      const recentMessages = messagesStore.slice(0, 20);
      for (const msg of recentMessages.reverse()) {
        try {
          client.write(`data: ${JSON.stringify(msg)}\n\n`);
        } catch (error) {
          console.error('خطأ في إرسال الرسائل القديمة:', error);
        }
      }
      
      // إرسال رسالة ترحيب
      const welcomeMessage = {
        type: 'connection',
        message: 'مرحباً! تم الاتصال بالخادم بنجاح',
        timestamp: new Date().toISOString(),
        clientsConnected: clients.length
      };
      client.write(`data: ${JSON.stringify(welcomeMessage)}\n\n`);
      
      // تنظيف الاتصال عند الإغلاق
      const cleanup = () => {
        clients = clients.filter(c => c.id !== clientId);
        console.log(`🔌 عميل قطع الاتصال: ${clientId} - المتبقي: ${clients.length}`);
      };
      
      // مراقبة إغلاق الاتصال
      if (request.signal) {
        request.signal.addEventListener('abort', cleanup);
        request.signal.addEventListener('close', cleanup);
      }
    },
    cancel() {
      // تنظيف عند إلغاء الدفق
      console.log('📡 تم إلغاء دفق الاتصال');
    }
  });
  
  // إرجاع دفق الأحداث
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    },
  });
}
