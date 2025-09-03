import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', function connection(ws) {
  console.log('New WebSocket client connected');

  // Send welcome message
  const welcomeMessage = {
    message: "WebSocket connection established",
    sentAt: Date.now()
  };
  ws.send(JSON.stringify(welcomeMessage));

  // Send periodic messages
  const interval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      const message = {
        message: `WebSocket Message ${Math.floor(Math.random() * 1000)}`,
        sentAt: Date.now()
      };
      ws.send(JSON.stringify(message));
    }
  }, 2000);

  // Send random status updates
  const statusInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      const statuses = [
        "Real-time sync active",
        "WebSocket health: Excellent", 
        "Low latency confirmed",
        "Bidirectional ready",
        "Connection stable",
        "Data stream flowing"
      ];
      const message = {
        message: statuses[Math.floor(Math.random() * statuses.length)],
        sentAt: Date.now()
      };
      ws.send(JSON.stringify(message));
    }
  }, 3000);

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

  // Handle incoming messages (demonstrating bidirectional capability)
  ws.on('message', function message(data) {
    console.log('Received:', data.toString());
    
    // Echo back with timestamp
    const response = {
      message: `Echo: ${data.toString()}`,
      sentAt: Date.now()
    };
    ws.send(JSON.stringify(response));
  });
});

const port = 3001;
server.listen(port, () => {
  console.log(`WebSocket server listening on port ${port}`);
});

export {};
