import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { signAuthToken, AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

        // Query admin from database
    const admins = await executeQuery(
      'SELECT * FROM admins WHERE admin_username = ?',
      [username]
    );

    if (admins.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

  const admin = admins[0];

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.admin_password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Determine role (fallback to 'admin' if column doesn't exist)
    const role = typeof admin.admin_role === 'string' && admin.admin_role.trim()
      ? admin.admin_role.trim()
      : 'admin';

    const token = signAuthToken({ adminId: admin.admin_id, role });

    const response = NextResponse.json({
      success: true,
      admin: {
        admin_id: admin.admin_id,
        id: admin.admin_id,
        username: admin.admin_username,
        fullName: admin.admin_fullname,
        email: admin.admin_email,
        phoneNumber: admin.admin_phone,
        role,
      },
    });

    response.cookies.set(
      AUTH_COOKIE_NAME,
      token,
      getAuthCookieOptions()
    );

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
