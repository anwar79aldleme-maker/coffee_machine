'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [devices, setDevices] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('جاري الاتصال...');

  useEffect(() => {
    const eventSource = new EventSource('/api/messages');
    
    eventSource.onopen = () => {
      setConnectionStatus('✅ متصل');
    };
    
    eventSource.onerror = () => {
      setConnectionStatus('❌ انقطع الاتصال، جاري إعادة المحاولة...');
    };
    
    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      
      // تحديث قائمة الرسائل
      setMessages(prev => [newMessage, ...prev].slice(0, 50));
      
      // تحديث معلومات الأجهزة
      setDevices(prev => {
        const deviceInfo = prev[newMessage.deviceId] || {
          lastMessage: '',
          messageCount: 0,
          lastSeen: ''
        };
        
        return {
          ...prev,
          [newMessage.deviceId]: {
            lastMessage: newMessage.message,
            messageCount: deviceInfo.messageCount + 1,
            lastSeen: newMessage.timestamp
          }
        };
      });
    };
    
    return () => eventSource.close();
  }, []);
  
  const getMessageStyle = (clickType) => {
    const styles = {
      1: { background: '#e3f2fd', border: '1px solid #2196f3' },
      2: { background: '#fff3e0', border: '1px solid #ff9800' },
      3: { background: '#ffebee', border: '1px solid #f44336' }
    };
    return styles[clickType] || { background: '#f5f5f5', border: '1px solid #ccc' };
  };
  
  const getClickIcon = (clickType) => {
    const icons = {
      1: '🖱️',
      2: '🖱️🖱️',
      3: '🖱️🖱️🖱️'
    };
    return icons[clickType] || '📍';
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        background: '#4CAF50', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0 }}>🎮 لوحة التحكم - نظام الأزرار</h1>
        <p style={{ margin: '10px 0 0 0' }}>
          حالة الاتصال: {connectionStatus}
        </p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          background: '#f0f0f0', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3>📊 إحصائيات</h3>
          <p>الأجهزة المتصلة: <strong>{Object.keys(devices).length}</strong></p>
          <p>إجمالي الرسائل: <strong>{messages.length}</strong></p>
        </div>
        
        <div style={{ 
          background: '#f0f0f0', 
          padding: '15px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3>🎯 أنواع الضغطات</h3>
          <p>🖱️ ضغطة واحدة | 🖱️🖱️ ضغطة مزدوجة | 🖱️🖱️🖱️ ثلاث ضغطات</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* قائمة الأجهزة */}
        <div>
          <h2 style={{ 
            background: '#2196f3', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px',
            margin: '0 0 15px 0'
          }}>💻 الأجهزة المتصلة</h2>
          {Object.keys(devices).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              لا توجد رسائل بعد
            </div>
          ) : (
            Object.entries(devices).map(([deviceId, info]) => (
              <div key={deviceId} style={{
                background: 'white',
                marginBottom: '10px',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRight: '4px solid #4CAF50'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '16px' }}>{deviceId}</strong>
                  <span style={{ 
                    background: '#4CAF50', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {info.messageCount} رسالة
                  </span>
                </div>
                <div style={{ marginTop: '8px', color: '#666' }}>
                  <div>📱 آخر رسالة: {info.lastMessage}</div>
                  <div>🕐 آخر ظهور: {new Date(info.lastSeen).toLocaleString('ar-EG')}</div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* سجل الرسائل */}
        <div>
          <h2 style={{ 
            background: '#ff9800', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px',
            margin: '0 0 15px 0'
          }}>📝 سجل الرسائل</h2>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              انتظر وصول أول رسالة...
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={{
                ...getMessageStyle(msg.clickType),
                marginBottom: '10px',
                padding: '12px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{getClickIcon(msg.clickType)}</span>
                  <div style={{ flex: 1 }}>
                    <strong>{msg.deviceId}</strong>
                    <span style={{ marginLeft: '10px', fontSize: '14px' }}>→ {msg.message}</span>
                  </div>
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#666', 
                  marginTop: '5px',
                  textAlign: 'left'
                }}>
                  {new Date(msg.timestamp).toLocaleString('ar-EG')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
