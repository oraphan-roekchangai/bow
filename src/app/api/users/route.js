import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

const formatJoinDate = (dateValue) => {
  const date = new Date(dateValue);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatUser = (user) => ({
  id: user.user_id,
  full_name: user.user_fullname,
  username: user.user_username,
  email: user.user_email,
  phone: user.user_phone,
  license_plate: user.user_licenseplate,
  join_date: formatJoinDate(user.user_created),
  status: user.user_status,
});

export async function GET() {
  try {
    const users = await executeQuery(`
      SELECT 
        user_id,
        user_fullname,
        user_username,
        user_email,
        user_phone,
        user_licenseplate,
        user_status,
        user_created
      FROM users 
      ORDER BY user_created DESC
    `);

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

    if (!full_name || !license_plate || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (full_name, license_plate, phone, password)' },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO users (user_fullname, user_email, user_licenseplate, user_phone, user_password, user_status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, email || null, license_plate, phone, password, status]
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

    const fields = [];
    const values = [];

    if (typeof full_name === 'string') {
      fields.push('user_fullname = ?');
      values.push(full_name.trim());
    }

    if (typeof username === 'string') {
      fields.push('user_username = ?');
      values.push(username.trim());
    }

    if (typeof email === 'string') {
      fields.push('user_email = ?');
      values.push(email.trim() || null);
    }

    if (typeof phone === 'string') {
      fields.push('user_phone = ?');
      values.push(phone.trim());
    }

    if (typeof license_plate === 'string') {
      fields.push('user_licenseplate = ?');
      values.push(license_plate.trim());
    }

    if (status && ['regular', 'vip'].includes(status)) {
      fields.push('user_status = ?');
      values.push(status);
    }

    if (typeof password === 'string' && password.trim()) {
      fields.push('user_password = ?');
      values.push(password.trim());
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields provided to update' }, { status: 400 });
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    const result = await executeQuery(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const [updatedUser] = await executeQuery(
      `SELECT user_id, user_fullname, user_username, user_email, user_phone, user_licenseplate, user_status, user_created
       FROM users WHERE user_id = ?`,
      [id]
    );

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

    const result = await executeQuery('DELETE FROM users WHERE user_id = ?', [id]);

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