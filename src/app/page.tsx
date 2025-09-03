'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  text: string;
  timestamp: string;
  type: string;
  source: 'websocket' | 'sse';
}

interface Stats {
  messagesReceived: number;
  connectionTime: number;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export default function Home() {
  const [wsMessages, setWsMessages] = useState<Message[]>([]);
  const [sseMessages, setSseMessages] = useState<Message[]>([]);
  const [wsStats, setWsStats] = useState<Stats>({
    messagesReceived: 0,
    connectionTime: 0,
    status: 'disconnected'
  });
  const [sseStats, setSseStats] = useState<Stats>({
    messagesReceived: 0,
    connectionTime: 0,
    status: 'disconnected'
  });

  const socketRef = useRef<Socket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const wsMessagesRef = useRef<HTMLDivElement>(null);
  const sseMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll function
  const scrollToBottom = (elementRef: React.RefObject<HTMLDivElement | null>) => {
    if (elementRef.current) {
      elementRef.current.scrollTop = elementRef.current.scrollHeight;
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom(wsMessagesRef);
  }, [wsMessages]);

  useEffect(() => {
    scrollToBottom(sseMessagesRef);
  }, [sseMessages]);

  // WebSocket (Socket.IO) Connection
  const connectWebSocket = () => {
    if (socketRef.current?.connected) return;

    const startTime = Date.now();
    setWsStats(prev => ({ ...prev, status: 'connecting' }));

    // Connect to Socket.IO server
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('connect', () => {
      const connectionTime = Date.now() - startTime;
      setWsStats(prev => ({ 
        ...prev, 
        status: 'connected', 
        connectionTime 
      }));
      console.log('✅ Socket.IO connected');
    });

    socketRef.current.on('message', (data) => {
      const message: Message = {
        ...data,
        source: 'websocket'
      };

      setWsMessages(prev => [...prev.slice(-9), message]);
      setWsStats(prev => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1
      }));
    });

    socketRef.current.on('disconnect', () => {
      setWsStats(prev => ({ ...prev, status: 'disconnected' }));
      console.log('❌ Socket.IO disconnected');
    });

    socketRef.current.on('connect_error', () => {
      setWsStats(prev => ({ ...prev, status: 'error' }));
      console.log('🔥 Socket.IO connection error');
    });
  };

  // Send message to WebSocket (demonstrating bidirectional)
  const sendWebSocketMessage = () => {
    if (socketRef.current?.connected) {
      const message = `Hello from client at ${new Date().toLocaleTimeString()}`;
      socketRef.current.emit('client-message', { text: message });
    }
  };

  // SSE Connection
  const connectSSE = () => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    const startTime = Date.now();
    setSseStats(prev => ({ ...prev, status: 'connecting' }));

    eventSourceRef.current = new EventSource('/api/sse');

    eventSourceRef.current.onopen = () => {
      const connectionTime = Date.now() - startTime;
      setSseStats(prev => ({ 
        ...prev, 
        status: 'connected', 
        connectionTime 
      }));
      console.log('✅ SSE connected');
    };

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const message: Message = {
        ...data,
        source: 'sse'
      };

      setSseMessages(prev => [...prev.slice(-9), message]);
      setSseStats(prev => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1
      }));
    };

    eventSourceRef.current.onerror = () => {
      setSseStats(prev => ({ ...prev, status: 'error' }));
      console.log('🔥 SSE connection error');
    };
  };

  // Disconnect functions
  const disconnectWebSocket = () => {
    socketRef.current?.disconnect();
    setWsStats(prev => ({ ...prev, status: 'disconnected' }));
  };

  const disconnectSSE = () => {
    eventSourceRef.current?.close();
    setSseStats(prev => ({ ...prev, status: 'disconnected' }));
  };

  // Reset functions
  const resetWS = () => {
    disconnectWebSocket();
    setWsMessages([]);
    setWsStats({
      messagesReceived: 0,
      connectionTime: 0,
      status: 'disconnected'
    });
  };

  const resetSSE = () => {
    disconnectSSE();
    setSseMessages([]);
    setSseStats({
      messagesReceived: 0,
      connectionTime: 0,
      status: 'disconnected'
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      eventSourceRef.current?.close();
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          WebSocket vs Server-Sent Events
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Simple Comparison Demo - Socket.IO vs SSE
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* WebSocket Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-blue-600 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${getStatusDot(wsStats.status)}`}></div>
                WebSocket (Socket.IO)
              </h2>
              <span className={`font-medium ${getStatusColor(wsStats.status)}`}>
                {wsStats.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-700">Messages Received</div>
                <div className="text-lg font-semibold text-gray-800">{wsStats.messagesReceived}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-700">Connection Time</div>
                <div className="text-lg font-semibold text-gray-800">{wsStats.connectionTime}ms</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-700">Communication</div>
                <div className="text-lg font-semibold text-gray-800">Bidirectional</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-700">Protocol</div>
                <div className="text-lg font-semibold text-gray-800">Socket.IO</div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={connectWebSocket}
                disabled={wsStats.status === 'connected' || wsStats.status === 'connecting'}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
              <button
                onClick={sendWebSocketMessage}
                disabled={wsStats.status !== 'connected'}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Message
              </button>
              <button
                onClick={disconnectWebSocket}
                disabled={wsStats.status === 'disconnected'}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>
              <button
                onClick={resetWS}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Reset
              </button>
            </div>

            <div ref={wsMessagesRef} className="h-64 overflow-y-auto bg-gray-50 p-3 rounded border">
              <h3 className="font-medium mb-2 text-gray-800">Messages (Bidirectional):</h3>
              {wsMessages.length === 0 ? (
                <div className="text-gray-600 text-sm">No messages yet...</div>
              ) : (
                wsMessages.map((message) => (
                  <div key={`ws-${message.id}`} className="mb-2 p-2 bg-white rounded border-l-4 border-blue-400 shadow-sm">
                    <div className="text-xs text-gray-600 mb-1 font-medium">
                      [{new Date(message.timestamp).toLocaleTimeString()}] - {message.type}
                    </div>
                    <div className="text-sm text-gray-800">{message.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SSE Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-green-600 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${getStatusDot(sseStats.status)}`}></div>
                Server-Sent Events
              </h2>
              <span className={`font-medium ${getStatusColor(sseStats.status)}`}>
                {sseStats.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-700">Messages Received</div>
                <div className="text-lg font-semibold text-gray-800">{sseStats.messagesReceived}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-700">Connection Time</div>
                <div className="text-lg font-semibold text-gray-800">{sseStats.connectionTime}ms</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-700">Communication</div>
                <div className="text-lg font-semibold text-gray-800">Unidirectional</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-700">Protocol</div>
                <div className="text-lg font-semibold text-gray-800">HTTP Stream</div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={connectSSE}
                disabled={sseStats.status === 'connected' || sseStats.status === 'connecting'}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
              <button
                disabled={true}
                className="bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed"
                title="SSE is unidirectional - server to client only"
              >
                Send Message (N/A)
              </button>
              <button
                onClick={disconnectSSE}
                disabled={sseStats.status === 'disconnected'}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disconnect
              </button>
              <button
                onClick={resetSSE}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Reset
              </button>
            </div>

            <div ref={sseMessagesRef} className="h-64 overflow-y-auto bg-gray-50 p-3 rounded border">
              <h3 className="font-medium mb-2 text-gray-800">Messages (Server → Client only):</h3>
              {sseMessages.length === 0 ? (
                <div className="text-gray-600 text-sm">No messages yet...</div>
              ) : (
                sseMessages.map((message) => (
                  <div key={`sse-${message.id}`} className="mb-2 p-2 bg-white rounded border-l-4 border-green-400 shadow-sm">
                    <div className="text-xs text-gray-600 mb-1 font-medium">
                      [{new Date(message.timestamp).toLocaleTimeString()}] - {message.type}
                    </div>
                    <div className="text-sm text-gray-800">{message.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Simple Comparison Table */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Quick Comparison</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">WebSocket (Socket.IO)</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Bidirectional communication</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Real-time messaging</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Lower latency</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">More complex setup</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Manual reconnection handling</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3">Server-Sent Events</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Simple HTTP-based</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Automatic reconnection</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Easy to implement</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Server to client only</span>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">Higher overhead</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}