import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { signAuthToken, AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const ADMIN_COLUMN_CANDIDATES = {
  id: ['admin_id', 'id'],
  username: ['admin_username', 'username'],
  password: ['admin_password', 'password_hash', 'password'],
  fullName: ['admin_fullname', 'full_name', 'fullname', 'name'],
  email: ['admin_email', 'email'],
  phone: ['admin_phone', 'phone', 'phone_number'],
  role: ['admin_role', 'role'],
};

const quoteIdentifier = (identifier) => `\`${String(identifier).replace(/`/g, '')}\``;

const pickColumn = (availableColumns, candidates) =>
  candidates.find((name) => availableColumns.has(name.toLowerCase())) ?? null;

async function getAdminColumnMap() {
  const columns = await executeQuery('SHOW COLUMNS FROM admins');
  const available = new Set(
    columns
      .map((col) => String(col.Field || col.field || '').trim().toLowerCase())
      .filter(Boolean)
  );

  return {
    id: pickColumn(available, ADMIN_COLUMN_CANDIDATES.id),
    username: pickColumn(available, ADMIN_COLUMN_CANDIDATES.username),
    password: pickColumn(available, ADMIN_COLUMN_CANDIDATES.password),
    fullName: pickColumn(available, ADMIN_COLUMN_CANDIDATES.fullName),
    email: pickColumn(available, ADMIN_COLUMN_CANDIDATES.email),
    phone: pickColumn(available, ADMIN_COLUMN_CANDIDATES.phone),
    role: pickColumn(available, ADMIN_COLUMN_CANDIDATES.role),
  };
}

async function verifyPassword(inputPassword, storedPassword) {
  if (!storedPassword || typeof storedPassword !== 'string') {
    return false;
  }

  const hashLike = /^\$2[abxy]?\$\d{2}\$/.test(storedPassword);
  if (hashLike) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  return inputPassword === storedPassword;
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';

    // Validate input
    if (!normalizedUsername || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const columnMap = await getAdminColumnMap();
    if (!columnMap.username || !columnMap.password || !columnMap.id) {
      return NextResponse.json(
        { error: 'Admins table schema is missing required login columns' },
        { status: 500 }
      );
    }

    const selectColumns = [
      `${quoteIdentifier(columnMap.id)} AS admin_id`,
      `${quoteIdentifier(columnMap.username)} AS admin_username`,
      `${quoteIdentifier(columnMap.password)} AS admin_password`,
      columnMap.fullName ? `${quoteIdentifier(columnMap.fullName)} AS admin_fullname` : 'NULL AS admin_fullname',
      columnMap.email ? `${quoteIdentifier(columnMap.email)} AS admin_email` : 'NULL AS admin_email',
      columnMap.phone ? `${quoteIdentifier(columnMap.phone)} AS admin_phone` : 'NULL AS admin_phone',
      columnMap.role ? `${quoteIdentifier(columnMap.role)} AS admin_role` : 'NULL AS admin_role',
    ];

    // Query admin from database
    const admins = await executeQuery(
      `SELECT ${selectColumns.join(', ')}
       FROM admins
       WHERE ${quoteIdentifier(columnMap.username)} = ?
       LIMIT 1`,
      [normalizedUsername]
    );

    if (admins.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const admin = admins[0];

    // Compare password with hashed password
    const isPasswordValid = await verifyPassword(password, admin.admin_password);

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
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
