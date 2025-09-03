export async function GET() {
  const encoder = new TextEncoder();
  let messageCounter = 0;

  // Create readable stream for SSE
  const customReadable = new ReadableStream({
    start(controller) {
      // Send welcome message
      const welcomeMessage = {
        id: ++messageCounter,
        text: "SSE connection established - Server to client only",
        timestamp: new Date().toISOString(),
        type: 'welcome'
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(welcomeMessage)}\n\n`));

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

      // Auto cleanup after 10 minutes
      setTimeout(() => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (error) {
          // Client already disconnected
        }
      }, 600000);
    },
  });

  // Return response with proper SSE headers
  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
