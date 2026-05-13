import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const recentMessages = await redis.lrange('messages', 0, 49);
      for (const message of recentMessages.reverse()) {
        controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      }
      
      const listener = async (message) => {
        controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      };
      
      await redis.subscribe('messages', listener);
      
      request.signal.addEventListener('abort', () => {
        redis.unsubscribe('messages', listener);
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
