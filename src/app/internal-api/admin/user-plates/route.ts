import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

type PlateRow = Record<string, unknown>;

function pickUserId(row: PlateRow): string | null {
  const raw = row.user_id ?? row.userId ?? row.member_id ?? row.memberId ?? row.id_user;
  if (raw === undefined || raw === null) return null;
  return String(raw);
}

function pickPlate(row: PlateRow): string {
  const raw = row.license_plate ?? row.licensePlate ?? row.plate_number ?? row.plateNumber ?? row.plate;
  return String(raw ?? '').trim();
}

export async function GET() {
  try {
    const rows = await executeQuery('SELECT * FROM user_plates');
    const list = Array.isArray(rows) ? (rows as PlateRow[]) : [];

    const grouped = new Map<string, Set<string>>();
    for (const row of list) {
      const userId = pickUserId(row);
      const plate = pickPlate(row);
      if (!userId || !plate) continue;
      if (!grouped.has(userId)) grouped.set(userId, new Set());
      grouped.get(userId)?.add(plate);
    }

    const data: Record<string, string> = {};
    for (const [userId, plates] of grouped.entries()) {
      data[userId] = Array.from(plates).join(', ');
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /internal-api/admin/user-plates failed:', error);
    return NextResponse.json({ success: false, error: 'FAILED_TO_FETCH_USER_PLATES' }, { status: 500 });
  }
}
