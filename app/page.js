'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [devices, setDevices] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('جاري الاتصال...');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // الاتصال بـ Server-Sent Events
    const eventSource = new EventSource('/api/messages');
    
    eventSource.onopen = () => {
      setConnectionStatus('✅ متصل');
      console.log('✅ تم الاتصال بالخادم');
    };
    
    eventSource.onerror = (error) => {
      setConnectionStatus('❌ انقطع الاتصال، جاري إعادة المحاولة...');
      console.error('خطأ في الاتصال:', error);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        console.log('📩 استلمت رسالة جديدة:', newMessage);
        
        // تحديث قائمة الرسائل
        setMessages(prev => [newMessage, ...prev].slice(0, 100));
        
        // تحديث معلومات الأجهزة
        setDevices(prev => {
          const deviceInfo = prev[newMessage.deviceId] || {
            lastMessage: '',
            messageCount: 0,
            firstSeen: newMessage.timestamp,
            lastSeen: ''
          };
          
          return {
            ...prev,
            [newMessage.deviceId]: {
              lastMessage: newMessage.message,
              messageCount: deviceInfo.messageCount + 1,
              firstSeen: deviceInfo.firstSeen,
              lastSeen: newMessage.timestamp
            }
          };
        });
        
        setLastUpdate(new Date());
      } catch (error) {
        console.error('خطأ في معالجة الرسالة:', error);
      }
    };
    
    // تنظيف الاتصال عند إغلاق الصفحة
    return () => {
      eventSource.close();
      console.log('🔌 تم قطع الاتصال');
    };
  }, []);
  
  const getMessageStyle = (clickType) => {
    const styles = {
      1: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' },
      2: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' },
      3: { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }
    };
    return styles[clickType] || { background: '#95a5a6', color: 'white' };
  };
  
  const getClickName = (clickType) => {
    const names = {
      1: '🖱️ ضغطة واحدة',
      2: '🖱️🖱️ ضغطة مزدوجة',
      3: '🖱️🖱️🖱️ ثلاث ضغطات'
    };
    return names[clickType] || 'غير معروف';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* الهيدر */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px 20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '2.5em' }}>🎮 لوحة تحكم ESP</h1>
          <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
            نظام مراقبة الأزرار عن بعد - يدعم ESP8266 و ESP32
          </p>
        </div>
      </div>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* بطاقات الإحصائيات */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>📡</div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>حالة الاتصال</div>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', marginTop: '5px' }}>{connectionStatus}</div>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>📱</div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>الأجهزة المتصلة</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', marginTop: '5px' }}>{Object.keys(devices).length}</div>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>💬</div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>إجمالي الرسائل</div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', marginTop: '5px' }}>{messages.length}</div>
          </div>
          
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>🕐</div>
            <div style={{ fontSize: '0.9em', color: '#666' }}'>آخر تحديث</div>
            <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginTop: '5px' }}>{lastUpdate.toLocaleTimeString('ar-EG')}</div>
          </div>
        </div>
        
        {/* المحتوى الرئيسي */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '30px'
        }}>
          {/* قائمة الأجهزة */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333', borderBottom: '3px solid #667eea', paddingBottom: '10px' }}>
              💻 الأجهزة
            </h2>
            {Object.keys(devices).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                ⏳ في انتظار وصول أول جهاز...
              </div>
            ) : (
              Object.entries(devices).map(([deviceId, info]) => (
                <div key={deviceId} style={{
                  background: '#f8f9fa',
                  marginBottom: '15px',
                  padding: '15px',
                  borderRadius: '10px',
                  borderRight: '4px solid #667eea',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px', color: '#333' }}>{deviceId}</strong>
                    <span style={{
                      background: '#667eea',
                      color: 'white',
                      padding: '2px 10px',
                      borderRadius: '20px',
                      fontSize: '12px'
                    }}>
                      {info.messageCount} رسالة
                    </span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    <div>📨 آخر رسالة: {info.lastMessage}</div>
                    <div>🕐 آخر ظهور: {new Date(info.lastSeen).toLocaleString('ar-EG')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* سجل الرسائل */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333', borderBottom: '3px solid #f5576c', paddingBottom: '10px' }}>
              📝 سجل الرسائل
            </h2>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                🔄 في انتظار وصول أول رسالة...
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={msg.id || index} style={{
                  ...getMessageStyle(msg.clickType),
                  marginBottom: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  animation: 'slideIn 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '14px' }}>{msg.deviceId}</strong>
                      <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
                        {getClickName(msg.clickType)}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', textAlign: 'right' }}>
                      {new Date(msg.timestamp).toLocaleTimeString('ar-EG')}
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
