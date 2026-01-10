import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return Response.json({ 
        success: true, 
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      return Response.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}