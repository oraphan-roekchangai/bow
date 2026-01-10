import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/db';
import { verifyAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';

const unauthorizedResponse = () => {
  const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  response.headers.set('Cache-Control', 'no-store');
  return response;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return unauthorizedResponse();
    }

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch (error) {
      console.error('Invalid auth token:', error);
      return unauthorizedResponse();
    }

    let adminRecord;
    try {
      const admins = await executeQuery(
        `SELECT admin_id, admin_username, admin_fullname, admin_email, admin_phone, profile_image_path, admin_role
         FROM admins
         WHERE admin_id = ?`,
        [payload.adminId]
      );

      if (admins.length === 0) {
        return unauthorizedResponse();
      }

      adminRecord = admins[0];
    } catch (dbError) {
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        const admins = await executeQuery(
          `SELECT admin_id, admin_username, admin_fullname, admin_email, admin_phone
           FROM admins
           WHERE admin_id = ?`,
          [payload.adminId]
        );

        if (admins.length === 0) {
          return unauthorizedResponse();
        }

        adminRecord = { ...admins[0], profile_image_path: null, admin_role: undefined };
      } else {
        throw dbError;
      }
    }

    // Determine role from DB (preferred), otherwise from token, otherwise default
    const roleFromDb = typeof adminRecord.admin_role === 'string' && adminRecord.admin_role.trim()
      ? adminRecord.admin_role.trim()
      : undefined;
    const roleFromToken = typeof payload.role === 'string' && payload.role.trim()
      ? payload.role.trim()
      : undefined;
    const role = roleFromDb || roleFromToken || 'admin';

    const response = NextResponse.json({
      success: true,
      admin: {
        admin_id: adminRecord.admin_id,
        id: adminRecord.admin_id,
        username: adminRecord.admin_username,
        fullName: adminRecord.admin_fullname,
        email: adminRecord.admin_email,
        phoneNumber: adminRecord.admin_phone,
        profileImage: adminRecord.profile_image_path ?? null,
        role,
      },
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Auth me error:', error);
    return unauthorizedResponse();
  }
}
