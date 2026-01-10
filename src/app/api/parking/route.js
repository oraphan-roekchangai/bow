import { executeQuery } from '@/lib/db';

export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const status = searchParams.get('status'); // 'parked', 'exited', or null for all
    const date = searchParams.get('date'); // Filter by specific date (YYYY-MM-DD)
    
    let query = `
      SELECT 
        record_id as id,
        detected_plate,
        check_in_time as entry_time,
        check_out_time as exit_time,
        fee as parking_fee
      FROM parking_records
    `;
    
    const conditions = [];
    
    // Filter by date if provided
    if (date) {
      conditions.push(`DATE(check_in_time) = '${date}'`);
    }
    
    // Filter by status if provided
    if (status === 'parked') {
      conditions.push('check_out_time IS NULL');
    } else if (status === 'exited') {
      conditions.push('check_out_time IS NOT NULL');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY check_in_time DESC LIMIT ${parseInt(limit)}`;
    
    const records = await executeQuery(query);

    return Response.json({ 
      success: true, 
      data: records,
      count: records.length
    });
  } catch (error) {
    console.error('Error fetching parking records:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch parking records' },
      { status: 500 }
    );
  }
}

// Keep POST method for backward compatibility if needed
export async function POST(request) {
  try {
    const { action, detected_plate, entry_time, exit_time, parking_fee } = await request.json();

    if (action === 'create') {
      // Create new parking record
      const result = await executeQuery(
        `INSERT INTO parking_records (detected_plate, check_in_time) 
         VALUES (?, ?)`,
        [detected_plate, entry_time || new Date()]
      );

      return Response.json({ 
        success: true, 
        message: 'Parking record created successfully',
        id: result.insertId
      });

    } else if (action === 'update_exit') {
      // Update exit time and fee
      await executeQuery(
        `UPDATE parking_records 
         SET check_out_time = ?, fee = ?
         WHERE detected_plate = ? AND check_out_time IS NULL
         ORDER BY check_in_time DESC
         LIMIT 1`,
        [exit_time || new Date(), parking_fee, detected_plate]
      );

      return Response.json({ 
        success: true, 
        message: 'Parking record updated successfully'
      });
    }

    return Response.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating parking record:', error);
    return Response.json(
      { success: false, error: 'Failed to update parking record' },
      { status: 500 }
    );
  }
}