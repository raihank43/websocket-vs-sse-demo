# Simple WebSocket vs SSE Implementation Guide

## 🎯 Tujuan
Dokumentasi ini menjelaskan implementasi sederhana untuk membandingkan WebSocket (menggunakan Socket.IO) dengan Server-Sent Events (SSE) dalam aplikasi Next.js.

## 🏗️ Arsitektur Sederhana

```
Browser (localhost:3000)
├── WebSocket Client (Socket.IO)  ──►  Socket.IO Server (Port 3001)
└── SSE Client (EventSource)      ──►  Next.js API Route (/api/sse)
```

## 🔌 WebSocket Implementation (Socket.IO)

### Server Side - `websocket-server.ts`

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';

// 1. Buat HTTP server dan Socket.IO server
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000" }
});

// 2. Handle koneksi client
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // 3. Kirim welcome message
  socket.emit('message', {
    text: 'Welcome! Connected successfully',
    type: 'welcome'
  });

  // 4. Kirim pesan berkala (setiap 3 detik)
  const interval = setInterval(() => {
    socket.emit('message', {
      text: 'WebSocket periodic message',
      type: 'data'
    });
  }, 3000);

  // 5. Handle pesan dari client (bidirectional)
  socket.on('client-message', (data) => {
    socket.emit('message', {
      text: `Echo: ${data.text}`,
      type: 'echo'
    });
  });

  // 6. Cleanup saat disconnect
  socket.on('disconnect', () => {
    clearInterval(interval);
  });
});

httpServer.listen(3001);
```

### Client Side - `page.tsx`

```typescript
import { io, Socket } from 'socket.io-client';

const connectWebSocket = () => {
  // 1. Koneksi ke Socket.IO server
  socketRef.current = io('http://localhost:3001');

  // 2. Handle koneksi berhasil
  socketRef.current.on('connect', () => {
    setStatus('connected');
  });

  // 3. Handle pesan dari server
  socketRef.current.on('message', (data) => {
    setMessages(prev => [...prev, data]);
  });
};

// 4. Kirim pesan ke server (bidirectional demo)
const sendMessage = () => {
  socketRef.current.emit('client-message', { text: 'Hello Server!' });
};
```

## 📡 SSE Implementation

### Server Side - `src/app/api/sse/route.ts`

```typescript
export async function GET() {
  const encoder = new TextEncoder();

  // 1. Buat ReadableStream untuk SSE
  const stream = new ReadableStream({
    start(controller) {
      // 2. Kirim welcome message
      const welcome = {
        text: "SSE connection established",
        type: 'welcome'
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(welcome)}\n\n`));

      // 3. Kirim pesan berkala (setiap 4 detik)
      const interval = setInterval(() => {
        const message = {
          text: "SSE periodic message",
          type: 'data'
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
      }, 4000);

      // 4. Auto cleanup setelah 10 menit
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 600000);
    }
  });

  // 5. Return dengan proper SSE headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### Client Side - `page.tsx`

```typescript
const connectSSE = () => {
  // 1. Buat EventSource connection
  eventSourceRef.current = new EventSource('/api/sse');

  // 2. Handle koneksi berhasil
  eventSourceRef.current.onopen = () => {
    setStatus('connected');
  };

  // 3. Handle pesan dari server (unidirectional)
  eventSourceRef.current.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setMessages(prev => [...prev, data]);
  };
};

// Note: SSE tidak bisa kirim pesan balik ke server
// Hanya bisa terima dari server
```

## 📊 Perbedaan Utama

### WebSocket (Socket.IO)
```typescript
// ✅ Bidirectional - bisa kirim dan terima
socket.emit('client-message', data);        // Client → Server
socket.on('message', (data) => {...});      // Server → Client

// ✅ Real-time events
socket.on('connect', () => {...});
socket.on('disconnect', () => {...});

// ✅ Custom events
socket.on('chat-message', (data) => {...});
socket.on('user-joined', (data) => {...});
```

### SSE (Server-Sent Events)
```typescript
// ❌ Unidirectional - hanya terima dari server
eventSource.onmessage = (event) => {...};   // Server → Client only

// ✅ Automatic reconnection
// Browser otomatis reconnect jika koneksi putus

// ✅ Simple HTTP-based
// Menggunakan protokol HTTP standar
```

## 🔧 Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan kedua server
npm run dev:all

# 3. Buka browser
http://localhost:3000
```

## 🎮 Demo Features

### WebSocket Panel (Kiri)
- **Connect**: Koneksi ke Socket.IO server
- **Send Message**: Kirim pesan ke server (bidirectional demo)
- **Disconnect**: Putus koneksi manual
- **Reset**: Clear semua data

### SSE Panel (Kanan)
- **Connect**: Mulai SSE stream
- **Send Message**: Disabled (unidirectional)
- **Disconnect**: Stop SSE stream
- **Reset**: Clear semua data

## 🧪 Experiment Ideas

1. **Connection Test**:
   - Koneksi WebSocket, lalu matikan server → lihat error handling
   - Koneksi SSE, lalu matikan server → lihat auto-reconnection

2. **Bidirectional Test**:
   - WebSocket: klik "Send Message" → lihat echo response
   - SSE: tombol "Send Message" disabled → unidirectional only

3. **Performance Test**:
   - Bandingkan connection time
   - Lihat perbedaan message frequency (3s vs 4s)

## 💡 Use Case Examples

### Kapan Pakai WebSocket:
```typescript
// Chat Application
socket.emit('send-message', { room: 'general', text: 'Hello!' });
socket.on('new-message', (data) => addToChat(data));

// Real-time Collaboration
socket.emit('cursor-move', { x: 100, y: 200 });
socket.on('user-cursor', (data) => updateCursor(data));

// Gaming
socket.emit('player-move', { direction: 'up' });
socket.on('game-state', (data) => updateGame(data));
```

### Kapan Pakai SSE:
```typescript
// Live News Feed
eventSource.onmessage = (event) => {
  const news = JSON.parse(event.data);
  addNewsItem(news);
};

// Monitoring Dashboard
eventSource.onmessage = (event) => {
  const metrics = JSON.parse(event.data);
  updateDashboard(metrics);
};

// Progress Updates
eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  updateProgressBar(progress.percentage);
};
```

## 🚀 Key Takeaways

1. **Socket.IO** = Ideal untuk aplikasi interaktif (chat, gaming, collaboration)
2. **SSE** = Perfect untuk streaming data (feeds, notifications, monitoring)
3. **Bidirectional vs Unidirectional** = Pilih sesuai kebutuhan komunikasi
4. **Complexity** = SSE lebih simple, WebSocket lebih powerful
5. **Reconnection** = SSE otomatis, WebSocket manual

Implementasi ini memberikan pemahaman dasar yang solid tentang perbedaan dan use case masing-masing teknologi! 🎯
