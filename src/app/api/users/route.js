import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

const USER_COLUMN_CANDIDATES = {
  id: ['user_id', 'id'],
  full_name: ['user_fullname', 'full_name', 'fullname', 'name'],
  username: ['user_username', 'username'],
  email: ['user_email', 'email'],
  phone: ['user_phone', 'phone', 'phone_number'],
  license_plate: ['user_licenseplate', 'user_license_plate', 'license_plate', 'plate_number'],
  status: ['user_status', 'status'],
  password: ['user_password', 'password_hash', 'password'],
  created: ['user_created', 'created_at', 'created', 'join_date'],
};

const formatJoinDate = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatUser = (user) => ({
  id: user.user_id,
  full_name: user.user_fullname,
  username: user.user_username ?? null,
  email: user.user_email,
  phone: user.user_phone,
  license_plate: user.user_licenseplate,
  join_date: formatJoinDate(user.user_created),
  status: user.user_status ?? 'regular',
});

const quoteIdentifier = (identifier) => `\`${String(identifier).replace(/`/g, '')}\``;

const pickColumn = (availableColumns, candidates) =>
  candidates.find((name) => availableColumns.has(name.toLowerCase())) ?? null;

const toSelectExpr = (columnName, alias) =>
  columnName ? `${quoteIdentifier(columnName)} AS ${alias}` : `NULL AS ${alias}`;

async function getUsersColumnMap() {
  const columns = await executeQuery('SHOW COLUMNS FROM users');
  const available = new Set(
    columns
      .map((col) => String(col.Field || col.field || '').trim().toLowerCase())
      .filter(Boolean)
  );

  return {
    id: pickColumn(available, USER_COLUMN_CANDIDATES.id),
    full_name: pickColumn(available, USER_COLUMN_CANDIDATES.full_name),
    username: pickColumn(available, USER_COLUMN_CANDIDATES.username),
    email: pickColumn(available, USER_COLUMN_CANDIDATES.email),
    phone: pickColumn(available, USER_COLUMN_CANDIDATES.phone),
    license_plate: pickColumn(available, USER_COLUMN_CANDIDATES.license_plate),
    status: pickColumn(available, USER_COLUMN_CANDIDATES.status),
    password: pickColumn(available, USER_COLUMN_CANDIDATES.password),
    created: pickColumn(available, USER_COLUMN_CANDIDATES.created),
  };
}

function getMissingRequiredColumns(columnMap) {
  return ['id'].filter((key) => !columnMap[key]);
}

function buildBaseUserSelect(columnMap) {
  return [
    toSelectExpr(columnMap.id, 'user_id'),
    toSelectExpr(columnMap.full_name, 'user_fullname'),
    toSelectExpr(columnMap.username, 'user_username'),
    toSelectExpr(columnMap.email, 'user_email'),
    toSelectExpr(columnMap.phone, 'user_phone'),
    toSelectExpr(columnMap.license_plate, 'user_licenseplate'),
    toSelectExpr(columnMap.status, 'user_status'),
    toSelectExpr(columnMap.created, 'user_created'),
  ].join(',\n        ');
}

async function queryUsers(columnMap) {
  const selectClause = buildBaseUserSelect(columnMap);
  const orderByColumn = columnMap.created || columnMap.id;
  const orderByClause = orderByColumn ? ` ORDER BY ${quoteIdentifier(orderByColumn)} DESC` : '';

  return await executeQuery(`
      SELECT
        ${selectClause}
      FROM users${orderByClause}
    `);
}

async function queryUserById(columnMap, id) {
  const selectClause = buildBaseUserSelect(columnMap);
  const users = await executeQuery(
    `SELECT
      ${selectClause}
     FROM users
     WHERE ${quoteIdentifier(columnMap.id)} = ?`,
    [id]
  );
  return users[0];
}

export async function GET() {
  try {
    const columnMap = await getUsersColumnMap();
    const missingColumns = getMissingRequiredColumns(columnMap);
    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Users table schema is missing required columns',
          details: `Missing: ${missingColumns.join(', ')}`,
        },
        { status: 500 }
      );
    }

    const users = await queryUsers(columnMap);

    const formatted = users.map(formatUser);

    return NextResponse.json({ 
      success: true, 
      data: formatted,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { full_name, email, license_plate, phone, password, status = 'regular' } = await request.json();

    const columnMap = await getUsersColumnMap();

    const requiredPayloadChecks = [
      !full_name ? 'full_name' : null,
      !phone ? 'phone' : null,
      !password ? 'password' : null,
      columnMap.license_plate && !license_plate ? 'license_plate' : null,
    ].filter(Boolean);

    if (requiredPayloadChecks.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields (${requiredPayloadChecks.join(', ')})` },
        { status: 400 }
      );
    }

    const requiredColumns = ['full_name', 'license_plate', 'phone', 'password'];
    const missingColumns = requiredColumns.filter((key) => key !== 'license_plate' && !columnMap[key]);
    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Users table schema is missing required columns for create',
          details: `Missing: ${missingColumns.join(', ')}`,
        },
        { status: 500 }
      );
    }

    const insertColumns = [
      columnMap.full_name,
      columnMap.email,
      columnMap.license_plate,
      columnMap.phone,
      columnMap.password,
      columnMap.status,
    ].filter(Boolean);

    const payloadByColumn = {
      [columnMap.full_name]: full_name,
      [columnMap.email]: email || null,
      [columnMap.license_plate]: license_plate,
      [columnMap.phone]: phone,
      [columnMap.password]: password,
      [columnMap.status]: status,
    };

    const values = insertColumns.map((columnName) => payloadByColumn[columnName]);

    const result = await executeQuery(
      `INSERT INTO users (${insertColumns.map((name) => quoteIdentifier(name)).join(', ')})
       VALUES (${insertColumns.map(() => '?').join(', ')})`,
      values
    );

    return NextResponse.json({ 
      success: true, 
      message: 'User created successfully',
      id: result.insertId 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, error: 'Duplicate entry: Email, phone, or license plate already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, full_name, username, email, phone, license_plate, status, password } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const columnMap = await getUsersColumnMap();
    if (!columnMap.id) {
      return NextResponse.json(
        { success: false, error: 'Users table schema is missing required id column' },
        { status: 500 }
      );
    }

    const fields = [];
    const values = [];

    if (typeof full_name === 'string' && columnMap.full_name) {
      fields.push(`${quoteIdentifier(columnMap.full_name)} = ?`);
      values.push(full_name.trim());
    }

    if (typeof username === 'string' && columnMap.username) {
      fields.push(`${quoteIdentifier(columnMap.username)} = ?`);
      values.push(username.trim());
    }

    if (typeof email === 'string' && columnMap.email) {
      fields.push(`${quoteIdentifier(columnMap.email)} = ?`);
      values.push(email.trim() || null);
    }

    if (typeof phone === 'string' && columnMap.phone) {
      fields.push(`${quoteIdentifier(columnMap.phone)} = ?`);
      values.push(phone.trim());
    }

    if (typeof license_plate === 'string' && columnMap.license_plate) {
      fields.push(`${quoteIdentifier(columnMap.license_plate)} = ?`);
      values.push(license_plate.trim());
    }

    if (status && ['regular', 'vip'].includes(status) && columnMap.status) {
      fields.push(`${quoteIdentifier(columnMap.status)} = ?`);
      values.push(status);
    }

    if (typeof password === 'string' && password.trim() && columnMap.password) {
      fields.push(`${quoteIdentifier(columnMap.password)} = ?`);
      values.push(password.trim());
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields provided to update' }, { status: 400 });
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE ${quoteIdentifier(columnMap.id)} = ?`;
    const result = await executeQuery(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await queryUserById(columnMap, id);

    return NextResponse.json({ success: true, data: formatUser(updatedUser) });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, error: 'Duplicate entry: email, phone, or license plate already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const columnMap = await getUsersColumnMap();
    if (!columnMap.id) {
      return NextResponse.json(
        { success: false, error: 'Users table schema is missing required id column' },
        { status: 500 }
      );
    }

    const result = await executeQuery(
      `DELETE FROM users WHERE ${quoteIdentifier(columnMap.id)} = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}