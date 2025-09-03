# WebSocket Server Flow Documentation

## 📋 Overview

File `websocket-server.ts` adalah implementasi server WebSocket standalone yang berjalan terpisah dari Next.js server. Dokumentasi ini menjelaskan alur kerja lengkap dan cara integrasinya dengan aplikasi Next.js.

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐    HTTP Request     ┌─────────────────┐
│   Browser       │ ──────────────────► │   Next.js       │
│   (localhost:   │                     │   Server        │
│    3000)        │ ◄────────────────── │   (Port 3000)   │
└─────────────────┘    HTML/CSS/JS      └─────────────────┘
         │                                       │
         │ WebSocket Connection                  │ SSE Connection
         │ ws://localhost:3001                   │ /api/sse
         ▼                                       ▼
┌─────────────────┐                     ┌─────────────────┐
│   WebSocket     │                     │   SSE API       │
│   Server        │                     │   Route         │
│   (Port 3001)   │                     │   (Next.js)     │
└─────────────────┘                     └─────────────────┘
```

## 🔄 Alur Flow WebSocket Server

### 1. **Server Initialization**

```typescript
// websocket-server.ts - Line 1-5
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });
```

**Apa yang terjadi:**
- Import dependencies yang diperlukan
- Buat HTTP server menggunakan Node.js built-in
- Attach WebSocket server ke HTTP server
- Server siap menerima koneksi di port 3001

### 2. **Connection Handling**

```typescript
// websocket-server.ts - Line 7-11
wss.on('connection', function connection(ws) {
  console.log('New WebSocket client connected');
  
  // Send welcome message
  const welcomeMessage = {
    message: "WebSocket connection established",
    sentAt: Date.now()
  };
  ws.send(JSON.stringify(welcomeMessage));
```

**Flow:**
1. Browser membuat koneksi `new WebSocket('ws://localhost:3001')`
2. Server menerima event `'connection'`
3. Callback function dijalankan dengan parameter `ws` (WebSocket instance)
4. Log koneksi baru ke console
5. Kirim pesan welcome ke client

### 3. **Message Broadcasting System**

```typescript
// websocket-server.ts - Line 18-25
const interval = setInterval(() => {
  if (ws.readyState === ws.OPEN) {
    const message = {
      message: `WebSocket Message ${Math.floor(Math.random() * 1000)}`,
      sentAt: Date.now()
    };
    ws.send(JSON.stringify(message));
  }
}, 2000);
```

**Penjelasan:**
- `setInterval`: Jalankan fungsi setiap 2 detik
- `ws.readyState === ws.OPEN`: Cek apakah koneksi masih aktif
- `sentAt`: Timestamp untuk menghitung latency di frontend
- `JSON.stringify`: Convert object ke string (WebSocket hanya kirim string/binary)

### 4. **Status Updates**

```typescript
// websocket-server.ts - Line 27-38
const statusInterval = setInterval(() => {
  if (ws.readyState === ws.OPEN) {
    const statuses = [
      "Real-time sync active",
      "WebSocket health: Excellent", 
      "Low latency confirmed",
      // ... more statuses
    ];
    const message = {
      message: statuses[Math.floor(Math.random() * statuses.length)],
      sentAt: Date.now()
    };
    ws.send(JSON.stringify(message));
  }
}, 3000);
```

**Tujuan:**
- Simulasi berbagai jenis pesan sistem
- Menunjukkan konsistensi koneksi WebSocket
- Interval berbeda (3 detik) untuk variasi

### 5. **Connection Cleanup**

```typescript
// websocket-server.ts - Line 40-50
ws.on('close', function close() {
  console.log('WebSocket client disconnected');
  clearInterval(interval);
  clearInterval(statusInterval);
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
  clearInterval(interval);
  clearInterval(statusInterval);
});
```

**Pentingnya Cleanup:**
- Prevent memory leaks
- Stop timer yang tidak terpakai
- Log disconnection untuk monitoring

### 6. **Bidirectional Communication**

```typescript
// websocket-server.ts - Line 52-61
ws.on('message', function message(data) {
  console.log('Received:', data.toString());
  
  // Echo back with timestamp
  const response = {
    message: `Echo: ${data.toString()}`,
    sentAt: Date.now()
  };
  ws.send(JSON.stringify(response));
});
```

**Demonstrasi:**
- Terima pesan dari client
- Process pesan (dalam hal ini echo back)
- Kirim response kembali ke client

## 🌐 Integrasi dengan Next.js Frontend

### 1. **Client-Side Connection**

```typescript
// src/app/page.tsx - Line 35-50
const connectWebSocket = () => {
  if (wsRef.current?.readyState === WebSocket.OPEN) return;

  const startTime = Date.now();
  setWsStats(prev => ({ ...prev, status: 'connecting' }));

  wsRef.current = new WebSocket('ws://localhost:3001');

  wsRef.current.onopen = () => {
    const connectionTime = Date.now() - startTime;
    setWsStats(prev => ({ 
      ...prev, 
      status: 'connected', 
      connectionTime 
    }));
  };
```

**Flow Client:**
1. User klik tombol "Connect" di UI
2. Function `connectWebSocket()` dipanggil
3. Browser buat koneksi ke `ws://localhost:3001`
4. Update UI status ke "connecting"
5. Saat koneksi berhasil, update ke "connected"

### 2. **Message Handling**

```typescript
// src/app/page.tsx - Line 52-70
wsRef.current.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const latency = Date.now() - data.sentAt;
  
  wsLatencyTracker.current.push(latency);
  const avgLatency = wsLatencyTracker.current.reduce((a, b) => a + b, 0) / wsLatencyTracker.current.length;

  const message: Message = {
    id: Date.now(),
    content: data.message,
    timestamp: new Date().toLocaleTimeString(),
    source: 'websocket'
  };

  setWsMessages(prev => [...prev.slice(-9), message]);
  setWsStats(prev => ({
    ...prev,
    messagesReceived: prev.messagesReceived + 1,
    averageLatency: Math.round(avgLatency)
  }));
};
```

**Process Message:**
1. Parse JSON dari server
2. Hitung latency (sekarang - sentAt)
3. Track latency untuk rata-rata
4. Buat message object untuk UI
5. Update state React untuk re-render
6. Update statistik (count, average latency)

## 🚀 Cara Menjalankan

### Development Mode

```bash
# Terminal 1: Next.js Server
npm run dev

# Terminal 2: WebSocket Server  
npm run ws-server

# Atau jalankan bersamaan:
npm run dev:all
```

### Production Mode

```bash
# Build Next.js
npm run build

# Start servers
npm start &          # Next.js di background
npm run ws-server &   # WebSocket di background
```

## 🔧 Configuration Options

### WebSocket Server Port

```typescript
// websocket-server.ts - Line 65-68
const port = 3001;
server.listen(port, () => {
  console.log(`WebSocket server listening on port ${port}`);
});
```

### Message Intervals

```typescript
// Ubah interval sesuai kebutuhan
}, 2000);  // Pesan reguler setiap 2 detik
}, 3000);  // Status update setiap 3 detik
```

### Client Connection URL

```typescript
// Frontend - ubah sesuai deployment
wsRef.current = new WebSocket('ws://localhost:3001');
// Production: ws://your-domain.com:3001
```

## 🛠️ Troubleshooting

### Common Issues

1. **EADDRINUSE Error**
   ```bash
   Error: listen EADDRINUSE: address already in use :::3001
   ```
   **Solution:** Kill process di port 3001 atau ubah port

2. **Connection Refused**
   ```
   WebSocket connection failed
   ```
   **Solution:** Pastikan WebSocket server running di port 3001

3. **CORS Issues**
   ```
   Cross-origin WebSocket blocked
   ```
   **Solution:** WebSocket tidak ada CORS, tapi pastikan URL benar

### Debug Commands

```bash
# Cek port yang digunakan
netstat -ano | findstr :3001

# Kill process di port tertentu (Windows)
taskkill /PID <PID> /F

# Test WebSocket connection
wscat -c ws://localhost:3001
```

## 📊 Performance Considerations

### Memory Management
- Cleanup intervals saat disconnect
- Limit message history di frontend
- Monitor connection count

### Scalability
- Use clustering untuk multiple cores
- Implement Redis untuk multi-server
- Load balancer dengan sticky sessions

### Security
- Implement authentication
- Rate limiting
- Input validation
- WSS (secure WebSocket) untuk production

## 🎯 Production Deployment

### Docker Setup

```dockerfile
# Dockerfile untuk WebSocket server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY websocket-server.ts ./
RUN npm install -g tsx
EXPOSE 3001
CMD ["tsx", "websocket-server.ts"]
```

### Environment Variables

```bash
# .env.local
WEBSOCKET_PORT=3001
WEBSOCKET_HOST=0.0.0.0
NODE_ENV=production
```

Dokumentasi ini memberikan pemahaman lengkap tentang bagaimana WebSocket server bekerja dan terintegrasi dengan aplikasi Next.js! 🚀
