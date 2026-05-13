'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [devices, setDevices] = useState({});

  useEffect(() => {
    const eventSource = new EventSource('/api/messages/stream');
    
    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      
      setMessages(prev => [newMessage, ...prev].slice(0, 100));
      
      setDevices(prev => ({
        ...prev,
        [newMessage.deviceId]: {
          lastMessage: newMessage.message,
          lastSeen: newMessage.timestamp,
          clickCount: (prev[newMessage.deviceId]?.clickCount || 0) + 1
        }
      }));
    };
    
    return () => eventSource.close();
  }, []);
  
  const getClickTypeName = (type) => {
    const types = { 1: 'ضغطة واحدة 🖱️', 2: 'ضغطة مزدوجة 🖱️🖱️', 3: 'ثلاث ضغطات 🖱️🖱️🖱️' };
    return types[type] || 'غير معروف';
  };
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>📊 لوحة التحكم المركزية</h1>
      <p>عدد الأجهزة المتصلة: {Object.keys(devices).length}</p>
      <p>عدد الرسائل المستلمة: {messages.length}</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h2>💻 ملخص الأجهزة</h2>
          {Object.entries(devices).map(([deviceId, info]) => (
            <div key={deviceId} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd' }}>
              <strong>{deviceId}</strong>
              <div>آخر رسالة: {info.lastMessage}</div>
              <div>عدد الرسائل: {info.clickCount}</div>
              <div>آخر ظهور: {new Date(info.lastSeen).toLocaleString()}</div>
            </div>
          ))}
        </div>
        
        <div>
          <h2>📋 آخر الأحداث</h2>
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: '10px', padding: '10px', background: '#f5f5f5' }}>
              <strong>{msg.deviceId}</strong>: {msg.message}
              <div style={{ fontSize: '12px', color: '#666' }}>
                {getClickTypeName(msg.clickType)} - {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
