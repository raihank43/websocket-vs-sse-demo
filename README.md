# WebSocket vs Server-Sent Events (SSE) Simple Comparison

Aplikasi Next.js sederhana yang mendemonstrasikan perbedaan antara **WebSocket (Socket.IO)** dan **Server-Sent Events (SSE)** untuk pembelajaran dan perbandingan teknologi real-time.

## 🎯 Tujuan Pembelajaran

- **Memahami perbedaan fundamental** antara WebSocket dan SSE
- **Melihat implementasi praktis** kedua teknologi
- **Mendemonstrasikan use case** yang tepat untuk masing-masing
- **Perbandingan langsung** fitur dan karakteristik

## 🚀 Fitur Demo

### WebSocket (Socket.IO) Panel
- ✅ **Bidirectional Communication**: Client bisa kirim dan terima pesan
- ✅ **Multi-Client Broadcast**: Message yang dikirim satu client terlihat di semua client
- ✅ **Real-time Connection**: Status koneksi live dengan multiple message types
- ✅ **Send Message Button**: Demo komunikasi dua arah dengan broadcast
- ✅ **Connection Management**: Connect, disconnect, reset
- ✅ **Multiple Message Types**: Global broadcast, personal, echo, dan user broadcast

### SSE (Server-Sent Events) Panel  
- ✅ **Unidirectional Streaming**: Server ke client only
- ✅ **Automatic Reconnection**: Browser handle reconnection
- ✅ **Simple HTTP Protocol**: Menggunakan standard HTTP
- ✅ **Periodic Updates**: Server mengirim update setiap 4 detik
- ❌ **Send Message Disabled**: Untuk menunjukkan limitation unidirectional

## 🔧 Teknologi

- **Next.js 15** - Framework React dengan App Router
- **Socket.IO** - WebSocket library yang powerful dan mudah
- **Server-Sent Events** - Native browser API
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## 🛠️ Cara Menjalankan

### Quick Start

```bash
# 1. Clone dan install
git clone <repository-url>
cd sse-vs-websocket
npm install

# 2. Jalankan aplikasi (Next.js + Socket.IO server)
npm run dev:all

# 3. Buka browser
http://localhost:3000
```

### Manual Start (Separate Terminals)

```bash
# Terminal 1: Next.js development server
npm run dev

# Terminal 2: Socket.IO server  
npm run ws-server
```

## 📊 Cara Menggunakan Demo

### 1. WebSocket Test (Multi-Client)
1. **Buka 2 browser tabs/windows** ke `http://localhost:3000`
2. Di **kedua browser**, klik **"Connect"** di panel WebSocket (kiri)
3. Amati **4 jenis message** yang akan muncul:
   - 🟢 **Global Broadcast**: Setiap 5 detik ke semua client
   - 🟠 **Personal**: Setiap 4 detik ke masing-masing client
   - 🟦 **Welcome**: Saat koneksi pertama
4. **Test Broadcast**: Di satu browser, klik **"Send Message"**
5. Lihat message muncul di **kedua browser**:
   - 🔵 **[Broadcast]**: User message yang dikirim ke semua client
   - ⚪ **Echo**: Konfirmasi hanya di browser pengirim

### 2. SSE Test  
1. Klik **"Connect"** di panel SSE (kanan)
2. Lihat periodic messages setiap 4 detik dari server
3. Perhatikan **"Send Message"** button disabled (unidirectional)
4. Test auto-reconnection dengan refresh page

### 3. Multi-Client Comparison
- **Buka aplikasi di 2+ browser/tab**
- Bandingkan **connection time** dan **message synchronization**
- Test **WebSocket broadcast** vs **SSE individual streams**
- Perhatikan perbedaan **bidirectional vs unidirectional** behavior

## 📁 Struktur Kode

```
src/
├── app/
│   ├── api/sse/route.ts         # SSE endpoint dengan ReadableStream
│   └── page.tsx                 # UI dengan Socket.IO client integration
├── docs/
│   └── simple-implementation-guide.md  # Detailed code explanation
└── websocket-server.ts          # Socket.IO server dengan broadcast features
```

### WebSocket Server Implementation (`websocket-server.ts`)

**Penjelasan Detail:**

1. **Global Broadcast Interval** - `globalBroadcastInterval`:
```typescript
const globalBroadcastInterval = setInterval(() => {
  io.emit('message', { ... }); // Kirim ke SEMUA client bersamaan
}, 5000);
```
- **Fungsi**: Mengirim message yang **sama** ke **semua client** secara bersamaan
- **Interval**: Setiap 5 detik
- **Tujuan**: Mendemonstrasikan broadcast synchronization
- **Visible**: Semua browser yang terkoneksi akan melihat message ini di waktu yang sama

2. **Individual Interval** - Per client:
```typescript
const individualInterval = setInterval(() => {
  socket.emit('message', { ... }); // Kirim hanya ke client ini
}, 4000);
```
- **Fungsi**: Message personal untuk setiap client
- **Interval**: Setiap 4 detik  
- **Tujuan**: Menunjukkan perbedaan personal vs broadcast
- **Visible**: Hanya browser yang bersangkutan

3. **User Message Broadcast** - On-demand:
```typescript
socket.on('client-message', (data) => {
  // Broadcast ke SEMUA client (termasuk pengirim)
  io.emit('message', {
    text: `[Broadcast] ${data.text}`,
    type: 'broadcast'
  });
  
  // Echo khusus ke pengirim
  socket.emit('message', {
    text: `Echo: ${data.text}`,
    type: 'echo'
  });
});
```
- **Trigger**: Ketika user klik "Send Message"
- **Broadcast**: `io.emit()` → ke semua client
- **Echo**: `socket.emit()` → hanya ke pengirim

## 🔍 Perbedaan Utama

### WebSocket
- ✅ **Bidirectional**: Komunikasi dua arah
- ✅ **Low Latency**: Overhead minimal setelah handshake
- ✅ **Binary Support**: Mendukung data binary
- ❌ **Manual Reconnection**: Perlu implementasi manual
- ❌ **Kompleksitas**: Lebih kompleks untuk setup

### Server-Sent Events (SSE)
- ✅ **Automatic Reconnection**: Reconnection otomatis
- ✅ **Simplicity**: Implementasi lebih sederhana
- ✅ **HTTP Based**: Menggunakan protokol HTTP standar
- ❌ **Unidirectional**: Hanya server ke client
- ❌ **Text Only**: Hanya mendukung data text

## 📁 Struktur Proyek

\`\`\`
src/
├── app/
│   ├── api/
│   │   └── sse/
│   │       └── route.ts          # SSE endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main demo page
├── docs/                        # Documentation
│   ├── websocket-flow.md        # WebSocket server flow documentation
│   └── sse-flow.md              # SSE implementation documentation
└── websocket-server.ts          # WebSocket server
\`\`\`

## 📚 Dokumentasi Kode

Untuk memahami implementasi secara detail:

- **[Simple Implementation Guide](docs/simple-implementation-guide.md)** - Penjelasan kode step-by-step, perbandingan implementasi, dan use case examples

## 🔍 Perbedaan Utama (Quick Reference)

| Aspek | WebSocket (Socket.IO) | SSE |
|-------|----------------------|-----|
| **Communication** | ↕️ Bidirectional | ↘️ Server → Client only |
| **Multi-Client** | ✅ Broadcast to all clients | ❌ Individual streams |
| **Setup Complexity** | Medium (separate server) | Simple (API route) |
| **Reconnection** | Manual implementation | Automatic |
| **Protocol** | WebSocket over TCP | HTTP/HTTPS |
| **Message Types** | Multiple (broadcast, personal, echo) | Single stream |
| **Real-time Sync** | ✅ All clients see same data | ❌ Each client independent |
| **Use Case** | Chat, Gaming, Collaboration | Feeds, Notifications, Monitoring |

## 💡 Learning Points

### WebSocket Multi-Client Features:
```typescript
// Global broadcast (semua client)
io.emit('message', data); // 🟢 Global Broadcast

// Personal message (satu client)
socket.emit('message', data); // 🟠 Personal Message

// Broadcast kecuali pengirim
socket.broadcast.emit('message', data); // 🔵 Broadcast to Others

// User interaction broadcast
socket.on('client-message', (data) => {
  io.emit('message', `[Broadcast] ${data.text}`); // 🔵 User Broadcast
  socket.emit('message', `Echo: ${data.text}`);   // ⚪ Echo Response
});
```

### SSE Single Stream:
```typescript
// Individual stream per client connection
const stream = new ReadableStream({
  start(controller) {
    const interval = setInterval(() => {
      controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
    }, 4000);
  }
});
```

## 🧪 Experiment Ideas

1. **Test Multi-Client Broadcast**: 
   - Buka aplikasi di 2+ browser/tab
   - Connect WebSocket di semua browser
   - Kirim message dari satu browser → lihat broadcast di semua browser
   
2. **Test Reconnection Behavior**: 
   - Refresh page → SSE auto-reconnects, WebSocket perlu manual connect
   
3. **Message Type Comparison**:
   - WebSocket: 4 jenis message (Global, Personal, Broadcast, Echo)
   - SSE: 1 jenis message stream
   
4. **Performance & Synchronization**:
   - Bandingkan connection time
   - Test message sync antar browser (WebSocket)
   - Compare SSE individual streams vs WebSocket broadcast

5. **Network Behavior**:
   - Disconnect network → reconnection behavior
   - Multiple tabs → resource usage comparison

## 🎯 Use Cases

### Kapan Menggunakan WebSocket:
- Aplikasi chat real-time
- Game online multiplayer
- Collaborative editing (Google Docs style)
- Trading platforms
- Aplikasi yang memerlukan komunikasi dua arah

### Kapan Menggunakan SSE:
- Live feeds (Twitter, news)
- Notifikasi real-time
- Dashboard monitoring
- Progress updates
- Live sports scores
- Server status monitoring

## 🚀 Deployment

Untuk production deployment:

1. Build aplikasi:
\`\`\`bash
npm run build
\`\`\`

2. Start production server:
\`\`\`bash
npm start
\`\`\`

3. Deploy WebSocket server terpisah atau gunakan platform yang mendukung WebSocket.

## 📝 Catatan Pengembangan

### WebSocket Server Features
- **Global Broadcast Interval**: `globalBroadcastInterval` mengirim message setiap 5 detik ke **semua client** yang terkoneksi secara bersamaan
- **Individual Intervals**: Setiap client memiliki interval personal untuk demo perbedaan message types
- **Port Configuration**: WebSocket server berjalan di port 3001, Next.js di port 3000
- **CORS Setup**: Configured untuk akses dari localhost:3000

### Message Types & Timing
- **🟢 Global Broadcast**: Setiap 5 detik (semua client)
- **🟠 Personal Message**: Setiap 4 detik (per client)
- **🔵 User Broadcast**: On-demand saat user kirim message (semua client)
- **⚪ Echo Response**: Langsung ke pengirim setelah kirim message
- **SSE Stream**: Setiap 4 detik (per client, individual)

## 🤝 Kontribusi

Silakan buat issue atau pull request untuk perbaikan dan penambahan fitur.

## 📄 License

MIT License - lihat file LICENSE untuk detail lengkap.
