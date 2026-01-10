import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import bcrypt from 'bcryptjs';

const formatAdmin = (admin) => {
  const date = new Date(admin.admin_created);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return {
    id: admin.admin_id,
    fullName: admin.admin_fullname,
    username: admin.admin_username,
    email: admin.admin_email,
    phoneNumber: admin.admin_phone,
    password: '********',
    joinDate: `${day}/${month}/${year}`,
    role: admin.role ?? 'admin',
  };
};

export async function GET(request) {
  try {
    // Query all admins from database
    const admins = await executeQuery(
      `SELECT 
        admin_id,
        admin_username,
        admin_email,
        admin_phone,
        admin_created,
        admin_fullname,
        'admin' as role
       FROM admins 
       ORDER BY admin_created DESC`
    );

    // Format the data for frontend
      const formattedAdmins = admins.map(formatAdmin);

    return NextResponse.json({
      success: true,
      admins: formattedAdmins,
      total: formattedAdmins.length
    });

  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins data' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, username, fullName, email, phoneNumber, password } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    const fields = [];
    const values = [];

    if (username) {
      fields.push('admin_username = ?');
      values.push(username.trim());
    }

    if (fullName) {
      fields.push('admin_fullname = ?');
      values.push(fullName.trim());
    }

    if (email) {
      fields.push('admin_email = ?');
      values.push(email.trim());
    }

    if (phoneNumber) {
      fields.push('admin_phone = ?');
      values.push(phoneNumber.trim());
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push('admin_password = ?');
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields provided to update' }, { status: 400 });
    }

    values.push(id);

    const query = `UPDATE admins SET ${fields.join(', ')} WHERE admin_id = ?`;

    const result = await executeQuery(query, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const [updatedAdmin] = await executeQuery(
      `SELECT admin_id, admin_username, admin_email, admin_phone, admin_created, admin_fullname
       FROM admins WHERE admin_id = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      admin: formatAdmin(updatedAdmin),
    });
  } catch (error) {
    console.error('Update admin error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Duplicate entry detected for username, email, or phone number' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    const result = await executeQuery(
      'DELETE FROM admins WHERE admin_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
