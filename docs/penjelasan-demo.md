# 🎯 Penjelasan Demo WebSocket vs SSE - Step by Step

Halo! Mari kita bahas bagaimana demo ini bekerja, mulai dari WebSocket server sampai ke UI-nya. Gue akan jelasin per baris kode biar kalian paham banget gimana cara kerjanya.

## 🚀 Part 1: WebSocket Server (`websocket-server.ts`)

Oke, pertama-tama kita lihat dulu WebSocket server-nya. Ini adalah file terpisah yang berjalan di port 3001.

### Import Dependencies

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
```

Jadi pertama-tama disini kita **import dulu library-nya**:
- `createServer` dari Node.js HTTP module buat bikin HTTP server
- `Server` dari Socket.IO buat handle WebSocket connections

### Create HTTP Server

```typescript
// Create HTTP server
const httpServer = createServer();
```

Nah disini kita **bikin HTTP server dulu**. Kenapa? Soalnya Socket.IO butuh HTTP server sebagai dasarnya. Socket.IO itu upgrade dari HTTP connection jadi WebSocket connection.

### Setup Socket.IO Server

```typescript
// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
```

Terus kita **setup Socket.IO server**:
- `io` ini adalah instance Socket.IO server kita
- `cors` kita set biar bisa diakses dari `localhost:3000` (Next.js app kita)
- Kenapa perlu CORS? Karena WebSocket server (port 3001) dan Next.js app (port 3000) beda domain

### Message Counter & Global Broadcast

```typescript
// Simple message counter
let messageCounter = 0;

// Global broadcast interval (so all clients get the same message)
const globalBroadcastInterval = setInterval(() => {
  io.emit('message', {
    id: ++messageCounter,
    text: `Global broadcast #${messageCounter} - All clients receive this`,
    timestamp: new Date().toISOString(),
    type: 'global-broadcast'
  });
}, 5000); // Every 5 seconds
```

Ini bagian **global broadcast**:
- `messageCounter` buat tracking ID message
- `setInterval` buat kirim message **setiap 5 detik**
- `io.emit()` → ini yang penting! Kirim ke **SEMUA CLIENT** yang terkoneksi
- Jadi kalau ada 5 browser yang connect, semua dapat message yang sama di waktu yang sama

### Connection Handling

```typescript
// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
```

Nah ini **event listener untuk koneksi baru**:
- Setiap ada client yang connect, fungsi ini jalan
- `socket` adalah representasi satu client connection
- `socket.id` adalah unique ID untuk client ini

### Welcome Message

```typescript
  // Send welcome message to this specific client
  socket.emit('message', {
    id: ++messageCounter,
    text: `Welcome! You are connected with ID: ${socket.id.substring(0, 8)}`,
    timestamp: new Date().toISOString(),
    type: 'welcome'
  });
```

Ini **welcome message** yang dikirim cuma ke client yang baru connect:
- `socket.emit()` → kirim **hanya ke client ini**, bukan ke semua
- Bedanya sama `io.emit()` yang tadi kirim ke semua

### Personal Messages Interval

```typescript
  // Send individual messages to this client every 4 seconds
  const individualInterval = setInterval(() => {
    socket.emit('message', {
      id: ++messageCounter,
      text: `Personal message for ${socket.id.substring(0, 8)} - #${messageCounter}`,
      timestamp: new Date().toISOString(),
      type: 'personal'
    });
  }, 4000);
```

Ini **personal message** yang dikirim **setiap 4 detik** ke masing-masing client:
- Tiap client punya interval sendiri-sendiri
- Makanya message ID-nya beda-beda per client
- Ini buat demo perbedaan personal vs broadcast message

### Bidirectional Communication

```typescript
  // Handle messages from client (bidirectional demo)
  socket.on('client-message', (data) => {
    console.log(`📨 Received from client: ${data.text}`);
    
    // Broadcast message to ALL connected clients (including sender)
    io.emit('message', {
      id: ++messageCounter,
      text: `[Broadcast] ${data.text}`,
      timestamp: new Date().toISOString(),
      type: 'broadcast'
    });
    
    // Also send echo back to sender
    socket.emit('message', {
      id: ++messageCounter,
      text: `Echo: ${data.text}`,
      timestamp: new Date().toISOString(),
      type: 'echo'
    });
  });
```

Ini yang **paling keren** - bidirectional communication:
- `socket.on('client-message')` → **listen** message dari client
- Ketika ada client yang kirim message:
  1. **Broadcast** ke semua client (`io.emit`) - semua browser lihat message ini
  2. **Echo** balik ke pengirim (`socket.emit`) - konfirmasi ke yang kirim

Ini yang bikin WebSocket powerful - bisa **dua arah**!

### Cleanup on Disconnect

```typescript
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    clearInterval(individualInterval);
  });
```

Ketika client **disconnect** (tutup browser, refresh, dll):
- Stop interval personal message biar gak memory leak
- Log di console buat debugging

### Start Server

```typescript
const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});

export {};
```

**Start server** di port 3001 dan ready menerima connections!

---

## 📡 Part 2: SSE Implementation (`src/app/api/sse/route.ts`)

Sekarang kita bahas SSE (Server-Sent Events). Ini lebih simpel tapi tetap powerful.

### GET Function Export

```typescript
export async function GET() {
```

Ini **Next.js API route**. Ketika ada request ke `/api/sse`, fungsi ini jalan.

### Setup Encoder & Counter

```typescript
  const encoder = new TextEncoder();
  let messageCounter = 0;
```

- `TextEncoder` buat convert string jadi bytes
- `messageCounter` buat tracking message ID (per connection)

### Create ReadableStream

```typescript
  // Create readable stream for SSE
  const customReadable = new ReadableStream({
    start(controller) {
```

**ReadableStream** adalah core dari SSE:
- Browser native support untuk streaming data
- `controller` buat push data ke stream

### Welcome Message

```typescript
      // Send welcome message
      const welcomeMessage = {
        id: ++messageCounter,
        text: "SSE connection established - Server to client only",
        timestamp: new Date().toISOString(),
        type: 'welcome'
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(welcomeMessage)}\n\n`));
```

**Welcome message** untuk SSE:
- `controller.enqueue()` buat push data ke stream
- Format SSE: `data: <json>\n\n`
- **Important**: Harus ada `\n\n` di akhir!

### Periodic Messages

```typescript
      // Send periodic messages every 4 seconds
      const interval = setInterval(() => {
        const message = {
          id: ++messageCounter,
          text: `SSE message #${messageCounter} - One-way streaming`,
          timestamp: new Date().toISOString(),
          type: 'data'
        };
        
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        } catch (error) {
          console.log('SSE client disconnected');
          clearInterval(interval);
        }
      }, 4000);
```

**Periodic messages** setiap 4 detik:
- Beda sama WebSocket yang bisa broadcast ke semua client
- SSE ini **per connection** - tiap browser punya stream sendiri
- `try-catch` buat handle kalau client disconnect

### Auto Cleanup

```typescript
      // Auto cleanup after 10 minutes
      setTimeout(() => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (error) {
          // Client already disconnected
        }
      }, 600000);
```

**Cleanup otomatis** setelah 10 menit biar gak memory leak.

### Return Response

```typescript
  // Return response with proper SSE headers
  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
```

**Return response** dengan headers SSE yang proper:
- `text/event-stream` → browser tau ini SSE
- `no-cache` → jangan di-cache
- `keep-alive` → keep connection open

---

## 🎨 Part 3: Frontend Implementation (`src/app/page.tsx`)

Sekarang kita ke frontend - ini yang user lihat dan interact.

### State Management

```typescript
const [wsMessages, setWsMessages] = useState<Message[]>([]);
const [sseMessages, setSseMessages] = useState<Message[]>([]);
const [wsStats, setWsStats] = useState<Stats>({ ... });
const [sseStats, setSseStats] = useState<Stats>({ ... });
```

**State management** buat:
- `wsMessages` → daftar message dari WebSocket
- `sseMessages` → daftar message dari SSE
- `wsStats` & `sseStats` → statistik connection (status, timing, count)

### Refs for Auto-scroll

```typescript
const socketRef = useRef<Socket | null>(null);
const eventSourceRef = useRef<EventSource | null>(null);
const wsMessagesRef = useRef<HTMLDivElement>(null);
const sseMessagesRef = useRef<HTMLDivElement>(null);
```

**Refs** buat:
- `socketRef` → Socket.IO connection object
- `eventSourceRef` → SSE connection object
- `wsMessagesRef` & `sseMessagesRef` → DOM elements buat auto-scroll

### Auto-scroll Function

```typescript
const scrollToBottom = (elementRef: React.RefObject<HTMLDivElement | null>) => {
  if (elementRef.current) {
    elementRef.current.scrollTop = elementRef.current.scrollHeight;
  }
};

useEffect(() => {
  scrollToBottom(wsMessagesRef);
}, [wsMessages]);

useEffect(() => {
  scrollToBottom(sseMessagesRef);
}, [sseMessages]);
```

**Auto-scroll** setiap ada message baru:
- Set `scrollTop` ke `scrollHeight` → scroll ke paling bawah
- `useEffect` trigger setiap ada message baru

### WebSocket Connection

```typescript
const connectWebSocket = () => {
  if (socketRef.current?.connected) return;

  const startTime = Date.now();
  setWsStats(prev => ({ ...prev, status: 'connecting' }));

  // Connect to Socket.IO server
  socketRef.current = io('http://localhost:3001');
```

**Connect ke WebSocket**:
- Check kalau belum connected
- Track start time buat hitung connection time
- Update status jadi 'connecting'
- Create Socket.IO connection ke port 3001

### WebSocket Event Listeners

```typescript
  socketRef.current.on('connect', () => {
    const connectionTime = Date.now() - startTime;
    setWsStats(prev => ({ 
      ...prev, 
      status: 'connected', 
      connectionTime 
    }));
  });

  socketRef.current.on('message', (data) => {
    const message: Message = { ...data, source: 'websocket' };
    setWsMessages(prev => [...prev.slice(-9), message]);
    setWsStats(prev => ({
      ...prev,
      messagesReceived: prev.messagesReceived + 1
    }));
  });
```

**Event listeners**:
- `connect` → update status dan hitung connection time
- `message` → terima message dari server, add ke state
- `.slice(-9)` → cuma simpan 10 message terakhir biar gak overflow

### Send Message Function

```typescript
const sendWebSocketMessage = () => {
  if (socketRef.current?.connected) {
    const message = `Hello from client at ${new Date().toLocaleTimeString()}`;
    socketRef.current.emit('client-message', { text: message });
  }
};
```

**Send message** ke server:
- Check kalau connected
- Emit 'client-message' event dengan text
- Server akan broadcast ini ke semua client

### SSE Connection

```typescript
const connectSSE = () => {
  if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

  const startTime = Date.now();
  setSseStats(prev => ({ ...prev, status: 'connecting' }));

  eventSourceRef.current = new EventSource('/api/sse');
```

**Connect ke SSE**:
- Check kalau connection belum open
- Track start time
- Create `EventSource` ke `/api/sse`

### SSE Event Listeners

```typescript
  eventSourceRef.current.onopen = () => {
    const connectionTime = Date.now() - startTime;
    setSseStats(prev => ({ 
      ...prev, 
      status: 'connected', 
      connectionTime 
    }));
  };

  eventSourceRef.current.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const message: Message = { ...data, source: 'sse' };
    setSseMessages(prev => [...prev.slice(-9), message]);
    setSseStats(prev => ({
      ...prev,
      messagesReceived: prev.messagesReceived + 1
    }));
  };
```

**SSE event listeners**:
- `onopen` → connection established
- `onmessage` → receive message dari server
- Parse JSON dari `event.data`

---

## 🎭 Part 4: UI Components

### Connection Status

```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected': return 'text-green-600';
    case 'connecting': return 'text-yellow-600';
    case 'error': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getStatusDot = (status: string) => {
  switch (status) {
    case 'connected': return 'bg-green-500';
    case 'connecting': return 'bg-yellow-500 animate-pulse';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
```

**Visual indicators** buat status connection:
- Color coding buat text dan dot
- Animation untuk connecting status

### Message Display

```tsx
{wsMessages.map((message) => (
  <div key={`ws-${message.id}`} className="mb-2 p-2 bg-white rounded border-l-4 border-blue-400 shadow-sm">
    <div className="text-xs text-gray-600 mb-1 font-medium">
      [{new Date(message.timestamp).toLocaleTimeString()}] - {message.type}
    </div>
    <div className="text-sm text-gray-800">{message.text}</div>
  </div>
))}
```

**Message display** dengan:
- Timestamp yang readable
- Message type indicator
- Color coding untuk WebSocket (blue) vs SSE (green)

---

## 🔥 Kesimpulan

Jadi intinya:

### WebSocket (Socket.IO):
- **Bidirectional** ↔️ → bisa kirim dan terima
- **Multi-client broadcast** 📡 → satu client kirim, semua client terima
- **Multiple message types** 🎯 → global, personal, broadcast, echo
- **Real-time sync** ⚡ → semua client lihat data yang sama

### SSE (Server-Sent Events):
- **Unidirectional** ↘️ → cuma server ke client
- **Individual streams** 📊 → setiap client punya stream sendiri
- **Simple setup** 🎯 → cuma API route di Next.js
- **Auto-reconnection** 🔄 → browser handle sendiri

### Kapan Pakai Yang Mana?

**WebSocket** kalau butuh:
- Chat app, gaming, collaborative editing
- User interaction yang real-time
- Sync data antar multiple users

**SSE** kalau butuh:
- Live feed, notification, monitoring
- Update data dari server doang
- Simple streaming data

Gitu deh penjelasannya! Kalau ada yang kurang jelas, tanya aja ya! 🚀
