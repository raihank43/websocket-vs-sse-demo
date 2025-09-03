export async function GET() {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial message
      const initialMessage = {
        message: "SSE connection established",
        sentAt: Date.now()
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`));

      // Send periodic messages
      const interval = setInterval(() => {
        const message = {
          message: `SSE Message ${Math.floor(Math.random() * 1000)}`,
          sentAt: Date.now()
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
      }, 2000);

      // Send random status updates
      const statusInterval = setInterval(() => {
        const statuses = [
          "Processing data...",
          "Server load: Normal",
          "Database sync completed",
          "Cache refreshed",
          "Monitoring active",
          "System health: Good"
        ];
        const message = {
          message: statuses[Math.floor(Math.random() * statuses.length)],
          sentAt: Date.now()
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
      }, 5000);

      // Clean up on close
      const cleanup = () => {
        clearInterval(interval);
        clearInterval(statusInterval);
      };

      // Note: In a real application, you'd want to handle client disconnection
      // This is a simplified example
      setTimeout(() => {
        cleanup();
        controller.close();
      }, 300000); // Close after 5 minutes
    },
  });

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
}
