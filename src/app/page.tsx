'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: number;
  content: string;
  timestamp: string;
  source: 'websocket' | 'sse';
}

interface Stats {
  messagesReceived: number;
  connectionTime: number;
  averageLatency: number;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export default function Home() {
  const [wsMessages, setWsMessages] = useState<Message[]>([]);
  const [sseMessages, setSseMessages] = useState<Message[]>([]);
  const [wsStats, setWsStats] = useState<Stats>({
    messagesReceived: 0,
    connectionTime: 0,
    averageLatency: 0,
    status: 'disconnected'
  });
  const [sseStats, setSseStats] = useState<Stats>({
    messagesReceived: 0,
    connectionTime: 0,
    averageLatency: 0,
    status: 'disconnected'
  });

  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const wsLatencyTracker = useRef<number[]>([]);
  const sseLatencyTracker = useRef<number[]>([]);

  // WebSocket Connection
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

    wsRef.current.onclose = () => {
      setWsStats(prev => ({ ...prev, status: 'disconnected' }));
    };

    wsRef.current.onerror = () => {
      setWsStats(prev => ({ ...prev, status: 'error' }));
    };
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
    };

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

    eventSourceRef.current.onerror = () => {
      setSseStats(prev => ({ ...prev, status: 'error' }));
    };
  };

  // Disconnect functions
  const disconnectWebSocket = () => {
    wsRef.current?.close();
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
    wsLatencyTracker.current = [];
    setWsStats({
      messagesReceived: 0,
      connectionTime: 0,
      averageLatency: 0,
      status: 'disconnected'
    });
  };

  const resetSSE = () => {
    disconnectSSE();
    setSseMessages([]);
    sseLatencyTracker.current = [];
    setSseStats({
      messagesReceived: 0,
      connectionTime: 0,
      averageLatency: 0,
      status: 'disconnected'
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      eventSourceRef.current?.close();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
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
          Real-time Communication Comparison Demo
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* WebSocket Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-blue-600 flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${getStatusDot(wsStats.status)}`}></div>
                WebSocket
              </h2>
              <span className={`font-medium ${getStatusColor(wsStats.status)}`}>
                {wsStats.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-600">Messages</div>
                <div className="text-lg font-semibold">{wsStats.messagesReceived}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-600">Avg Latency</div>
                <div className="text-lg font-semibold">{wsStats.averageLatency}ms</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-600">Connection Time</div>
                <div className="text-lg font-semibold">{wsStats.connectionTime}ms</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-gray-600">Protocol</div>
                <div className="text-lg font-semibold">Bidirectional</div>
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

            <div className="h-64 overflow-y-auto bg-gray-50 p-3 rounded border">
              <h3 className="font-medium mb-2">Messages:</h3>
              {wsMessages.length === 0 ? (
                <div className="text-gray-500 text-sm">No messages yet...</div>
              ) : (
                wsMessages.map((message) => (
                  <div key={message.id} className="mb-1 text-sm">
                    <span className="text-gray-500">[{message.timestamp}]</span>
                    <span className="ml-2">{message.content}</span>
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
                <div className="text-sm text-gray-600">Messages</div>
                <div className="text-lg font-semibold">{sseStats.messagesReceived}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-600">Avg Latency</div>
                <div className="text-lg font-semibold">{sseStats.averageLatency}ms</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-600">Connection Time</div>
                <div className="text-lg font-semibold">{sseStats.connectionTime}ms</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-gray-600">Protocol</div>
                <div className="text-lg font-semibold">Unidirectional</div>
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

            <div className="h-64 overflow-y-auto bg-gray-50 p-3 rounded border">
              <h3 className="font-medium mb-2">Messages:</h3>
              {sseMessages.length === 0 ? (
                <div className="text-gray-500 text-sm">No messages yet...</div>
              ) : (
                sseMessages.map((message) => (
                  <div key={message.id} className="mb-1 text-sm">
                    <span className="text-gray-500">[{message.timestamp}]</span>
                    <span className="ml-2">{message.content}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Feature</th>
                  <th className="text-left p-3 font-semibold text-blue-600">WebSocket</th>
                  <th className="text-left p-3 font-semibold text-green-600">Server-Sent Events</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">Communication</td>
                  <td className="p-3">Bidirectional</td>
                  <td className="p-3">Unidirectional (Server → Client)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Protocol</td>
                  <td className="p-3">Custom over TCP</td>
                  <td className="p-3">HTTP/HTTPS</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Overhead</td>
                  <td className="p-3">Lower (binary frames)</td>
                  <td className="p-3">Higher (HTTP headers)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Reconnection</td>
                  <td className="p-3">Manual implementation</td>
                  <td className="p-3">Automatic</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Browser Support</td>
                  <td className="p-3">Excellent (modern browsers)</td>
                  <td className="p-3">Excellent (IE10+)</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Use Cases</td>
                  <td className="p-3">Chat apps, gaming, collaborative editing</td>
                  <td className="p-3">Live feeds, notifications, monitoring</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Complexity</td>
                  <td className="p-3">Higher (connection management)</td>
                  <td className="p-3">Lower (simpler implementation)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
