# WebSocket vs Server-Sent Events (SSE) Comparison Demo

Aplikasi Next.js yang mendemonstrasikan perbandingan antara WebSocket dan Server-Sent Events (SSE) untuk komunikasi real-time.

## 🚀 Fitur

- **Perbandingan Real-time**: Melihat perbedaan performa antara WebSocket dan SSE secara side-by-side
- **Monitoring Statistik**: Melacak jumlah pesan, latensi rata-rata, dan waktu koneksi
- **UI Interaktif**: Kontrol koneksi dengan tombol connect, disconnect, dan reset
- **Visualisasi Status**: Indikator status koneksi real-time dengan warna dan animasi
- **Tabel Perbandingan**: Dokumentasi lengkap perbedaan fitur antara kedua teknologi

## 🔧 Teknologi yang Digunakan

- **Next.js 15** - Framework React dengan App Router
- **TypeScript** - Type safety dan development experience yang lebih baik
- **Tailwind CSS** - Styling dan responsive design
- **WebSocket (ws)** - Library WebSocket untuk Node.js
- **Server-Sent Events** - Native browser API untuk streaming data

## 🛠️ Cara Menjalankan

### Prerequisites

- Node.js (versi 18 atau lebih baru)
- npm atau yarn

### Installation

1. Clone repository:
\`\`\`bash
git clone <repository-url>
cd sse-vs-websocket
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Jalankan aplikasi (Next.js dan WebSocket server secara bersamaan):
\`\`\`bash
npm run dev:all
\`\`\`

Atau jalankan secara terpisah:

**Terminal 1** - Next.js development server:
\`\`\`bash
npm run dev
\`\`\`

**Terminal 2** - WebSocket server:
\`\`\`bash
npm run ws-server
\`\`\`

4. Buka browser dan akses [http://localhost:3000](http://localhost:3000)

## 📊 Cara Menggunakan Demo

1. **WebSocket Section (Kiri)**:
   - Klik tombol "Connect" untuk koneksi ke WebSocket server (port 3001)
   - Lihat pesan real-time dan statistik performa
   - Gunakan tombol "Disconnect" dan "Reset" untuk kontrol koneksi

2. **SSE Section (Kanan)**:
   - Klik tombol "Connect" untuk memulai SSE stream
   - Monitor pesan dan statistik performa
   - Gunakan kontrol yang sama untuk manajemen koneksi

3. **Perbandingan**:
   - Amati perbedaan latensi dan waktu koneksi
   - Lihat tabel perbandingan fitur di bawah
   - Perhatikan perbedaan perilaku reconnection

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

## 📚 Dokumentasi Teknis

Untuk pemahaman yang lebih mendalam tentang implementasi:

- **[WebSocket Flow Documentation](docs/websocket-flow.md)** - Penjelasan lengkap alur kerja WebSocket server, arsitektur, dan integrasi dengan Next.js
- **[SSE Flow Documentation](docs/sse-flow.md)** - Detail implementasi Server-Sent Events, protokol, dan perbandingan dengan WebSocket

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

- WebSocket server berjalan di port 3001
- SSE endpoint tersedia di `/api/sse`
- Pesan dikirim setiap 2-3 detik untuk demonstrasi
- Latensi dihitung berdasarkan timestamp pengiriman
- Automatic reconnection hanya tersedia untuk SSE

## 🤝 Kontribusi

Silakan buat issue atau pull request untuk perbaikan dan penambahan fitur.

## 📄 License

MIT License - lihat file LICENSE untuk detail lengkap.
