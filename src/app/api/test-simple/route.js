import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    // ทดสอบ query ง่าย ๆ ก่อน
    const result = await executeQuery('SELECT 1 as test');
    
    return Response.json({ 
      success: true, 
      message: 'Database connection successful',
      data: result
    });
  } catch (error) {
    console.error('Database error:', error);
    return Response.json(
      { 
        success: false, 
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}