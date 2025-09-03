# Server-Sent Events (SSE) Flow Documentation

## 📋 Overview

Dokumentasi ini menjelaskan implementasi Server-Sent Events (SSE) dalam aplikasi Next.js dan perbandingannya dengan WebSocket.

## 🏗️ Arsitektur SSE

```
┌─────────────────┐    HTTP Request (GET)    ┌─────────────────┐
│   Browser       │ ───────────────────────► │   Next.js       │
│   EventSource   │                          │   API Route     │
│   API           │ ◄─────────────────────── │   /api/sse      │
└─────────────────┘   text/event-stream      └─────────────────┘
         │                                            │
         │ Persistent HTTP Connection                 │
         │ (Server keeps connection open)             │
         ▼                                            ▼
┌─────────────────┐                          ┌─────────────────┐
│   Event         │                          │   ReadableStream│
│   Listeners     │                          │   Controller    │
│   (onmessage)   │                          │   (Server-side) │
└─────────────────┘                          └─────────────────┘
```

## 🔄 Alur Flow SSE Server

### 1. **API Route Setup**

```typescript
// src/app/api/sse/route.ts - Line 1-2
export async function GET() {
  const encoder = new TextEncoder();
```

**Penjelasan:**
- Next.js API route dengan method GET
- `TextEncoder` untuk convert string ke Uint8Array
- Browser akan request ke endpoint ini

### 2. **ReadableStream Creation**

```typescript
// src/app/api/sse/route.ts - Line 4-6
const customReadable = new ReadableStream({
  start(controller) {
    // Stream logic here
```

**Konsep:**
- `ReadableStream` = Stream yang bisa dibaca oleh client
- `controller` = Interface untuk mengirim data ke stream
- `start()` = Function yang dijalankan saat stream dimulai

### 3. **Initial Message**

```typescript
// src/app/api/sse/route.ts - Line 7-12
const initialMessage = {
  message: "SSE connection established",
  sentAt: Date.now()
};
controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`));
```

**SSE Format:**
- `data: ` prefix wajib untuk SSE
- `\n\n` = delimiter untuk akhir message
- JSON stringify untuk struktured data
- Encode ke bytes menggunakan TextEncoder

### 4. **Periodic Messages**

```typescript
// src/app/api/sse/route.ts - Line 14-22
const interval = setInterval(() => {
  const message = {
    message: `SSE Message ${Math.floor(Math.random() * 1000)}`,
    sentAt: Date.now()
  };
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
}, 2000);
```

**Flow:**
1. `setInterval` jalankan setiap 2 detik
2. Buat message object dengan timestamp
3. Format sesuai SSE protocol
4. Enqueue ke stream controller
5. Browser otomatis terima sebagai event

### 5. **Status Updates**

```typescript
// src/app/api/sse/route.ts - Line 24-37
const statusInterval = setInterval(() => {
  const statuses = [
    "Processing data...",
    "Server load: Normal",
    "Database sync completed",
    // ... more statuses
  ];
  const message = {
    message: statuses[Math.floor(Math.random() * statuses.length)],
    sentAt: Date.now()
  };
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
}, 5000);
```

**Tujuan:**
- Simulasi berbagai sistem events
- Interval berbeda (5 detik) untuk variasi
- Menunjukkan konsistensi streaming

### 6. **Cleanup Management**

```typescript
// src/app/api/sse/route.ts - Line 39-48
const cleanup = () => {
  clearInterval(interval);
  clearInterval(statusInterval);
};

setTimeout(() => {
  cleanup();
  controller.close();
}, 300000); // Close after 5 minutes
```

**Pentingnya:**
- Prevent memory leaks dari intervals
- Auto-close connection setelah timeout
- Proper resource management

### 7. **Response Headers**

```typescript
// src/app/api/sse/route.ts - Line 52-61
return new Response(customReadable, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Cache-Control',
  },
});
```

**Header Explanation:**
- `text/event-stream`: MIME type untuk SSE
- `no-cache`: Prevent caching
- `keep-alive`: Maintain persistent connection
- `Access-Control-*`: CORS headers

## 🌐 Client-Side Integration

### 1. **EventSource Creation**

```typescript
// src/app/page.tsx - Line 82-87
const connectSSE = () => {
  if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

  const startTime = Date.now();
  setSseStats(prev => ({ ...prev, status: 'connecting' }));

  eventSourceRef.current = new EventSource('/api/sse');
```

**Flow:**
1. Check jika sudah ada koneksi aktif
2. Record start time untuk measuring
3. Update UI status ke "connecting"
4. Create EventSource dengan API endpoint

### 2. **Event Handling**

```typescript
// src/app/page.tsx - Line 89-96
eventSourceRef.current.onopen = () => {
  const connectionTime = Date.now() - startTime;
  setSseStats(prev => ({ 
    ...prev, 
    status: 'connected', 
    connectionTime 
  }));
};
```

**onopen Event:**
- Triggered saat koneksi berhasil
- Calculate connection time
- Update UI status ke "connected"

### 3. **Message Processing**

```typescript
// src/app/page.tsx - Line 98-116
eventSourceRef.current.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const latency = Date.now() - data.sentAt;
  
  sseLatencyTracker.current.push(latency);
  const avgLatency = sseLatencyTracker.current.reduce((a, b) => a + b, 0) / sseLatencyTracker.current.length;

  const message: Message = {
    id: Date.now(),
    content: data.message,
    timestamp: new Date().toLocaleTimeString(),
    source: 'sse'
  };

  setSseMessages(prev => [...prev.slice(-9), message]);
  setSseStats(prev => ({
    ...prev,
    messagesReceived: prev.messagesReceived + 1,
    averageLatency: Math.round(avgLatency)
  }));
};
```

**Process:**
1. Parse JSON dari event data
2. Calculate latency (current time - sentAt)
3. Track latency untuk average calculation
4. Create message object
5. Update messages state (keep last 10)
6. Update statistics

### 4. **Error Handling**

```typescript
// src/app/page.tsx - Line 118-120
eventSourceRef.current.onerror = () => {
  setSseStats(prev => ({ ...prev, status: 'error' }));
};
```

**Auto-Reconnection:**
- EventSource otomatis reconnect saat error
- Browser handle reconnection logic
- Update UI status untuk user feedback

## 🔄 SSE Protocol Details

### Message Format

```
data: {"message": "Hello World", "sentAt": 1234567890}

data: {"message": "Another message", "sentAt": 1234567891}

```

**Rules:**
- Each message starts with `data: `
- Message ends with double newline `\n\n`
- Multiple lines supported dengan multiple `data: ` lines

### Advanced SSE Features

```
// Custom event types
event: notification
data: {"type": "info", "message": "System update"}

// Message ID (for reconnection)
id: 123
data: {"message": "Important message"}

// Retry interval
retry: 3000
data: {"message": "Will retry in 3 seconds if disconnected"}

```

## ⚖️ WebSocket vs SSE Comparison

### Protocol Level

| Aspect | WebSocket | SSE |
|--------|-----------|-----|
| **Protocol** | Custom over TCP | HTTP/HTTPS |
| **Connection** | Full duplex | Half duplex |
| **Overhead** | Low (after handshake) | Higher (HTTP headers) |
| **Data Format** | Binary + Text | Text only |

### Implementation

| Aspect | WebSocket | SSE |
|--------|-----------|-----|
| **Server Setup** | Separate server needed | Next.js API route |
| **Reconnection** | Manual implementation | Automatic |
| **CORS** | Not applicable | Standard HTTP CORS |
| **Authentication** | Custom headers/query | Standard HTTP auth |

### Use Cases

**WebSocket Ideal:**
- Chat applications
- Gaming (real-time moves)
- Collaborative editing
- Trading platforms
- When client needs to send data

**SSE Ideal:**
- Live feeds (news, social media)
- Monitoring dashboards
- Progress updates
- Notifications
- When only server sends data

## 🚀 Performance Considerations

### Memory Usage

```typescript
// Limit message history
setSseMessages(prev => [...prev.slice(-9), message]); // Keep only 10 messages

// Clear intervals on cleanup
const cleanup = () => {
  clearInterval(interval);
  clearInterval(statusInterval);
};
```

### Connection Management

```typescript
// Check connection state
if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

// Proper cleanup
useEffect(() => {
  return () => {
    eventSourceRef.current?.close();
  };
}, []);
```

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   ```
   Access to fetch blocked by CORS policy
   ```
   **Solution:** Add proper CORS headers di API route

2. **Connection Timeout**
   ```
   EventSource failed to connect
   ```
   **Solution:** Check API route dan network connectivity

3. **Memory Leaks**
   ```
   High memory usage over time
   ```
   **Solution:** Proper cleanup intervals dan limit message history

### Debug Tips

```javascript
// Monitor EventSource state
console.log('ReadyState:', eventSource.readyState);
// 0: CONNECTING, 1: OPEN, 2: CLOSED

// Track connection events
eventSource.addEventListener('open', () => console.log('Connected'));
eventSource.addEventListener('error', () => console.log('Error occurred'));
```

## 🎯 Production Considerations

### Scalability
- SSE connections consume server resources
- Consider connection limits
- Implement proper load balancing
- Use CDN untuk static content

### Security
- Validate input data
- Implement rate limiting
- Use HTTPS in production
- Proper authentication

### Monitoring
- Track connection count
- Monitor memory usage
- Log error rates
- Performance metrics

Dokumentasi ini memberikan pemahaman mendalam tentang SSE implementation dan perbandingannya dengan WebSocket! 🚀
