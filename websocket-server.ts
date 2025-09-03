import { createServer } from 'http';
import { Server } from 'socket.io';

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  // Send welcome message to this specific client
  socket.emit('message', {
    id: ++messageCounter,
    text: `Welcome! You are connected with ID: ${socket.id.substring(0, 8)}`,
    timestamp: new Date().toISOString(),
    type: 'welcome'
  });

  // Send individual messages to this client every 4 seconds
  const individualInterval = setInterval(() => {
    socket.emit('message', {
      id: ++messageCounter,
      text: `Personal message for ${socket.id.substring(0, 8)} - #${messageCounter}`,
      timestamp: new Date().toISOString(),
      type: 'personal'
    });
  }, 4000);

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

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    clearInterval(individualInterval);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});

export {};
