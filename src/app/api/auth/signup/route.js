import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { signAuthToken, AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, fullName, email, phoneNumber, password } = await request.json();

    // Validate input
    if (!username || !fullName || !email || !phoneNumber || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate phone number (numeric only, exactly 10 digits for Thai format)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 10 digits' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6 || password.length > 20) {
      return NextResponse.json(
        { error: 'Password must be between 6 and 20 characters' },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsers = await executeQuery(
      'SELECT admin_id FROM admins WHERE admin_username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check if phone number already exists
    const existingPhones = await executeQuery(
      'SELECT admin_id FROM admins WHERE admin_phone = ?',
      [phoneNumber]
    );

    if (existingPhones.length > 0) {
      return NextResponse.json(
        { error: 'Phone number already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmails = await executeQuery(
      'SELECT admin_id FROM admins WHERE admin_email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new admin into database with hashed password
    const result = await executeQuery(
      `INSERT INTO admins (admin_username, admin_fullname, admin_password, admin_phone, admin_email) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, fullName, hashedPassword, phoneNumber, email]
    );

    const adminId = result.insertId;
    const token = signAuthToken({ adminId });

    const response = NextResponse.json({
      success: true,
      message: 'Admin registered successfully',
      admin: {
        admin_id: adminId,
        id: adminId,
        username,
        fullName,
        email,
        phoneNumber,
      },
    }, { status: 201 });

    response.cookies.set(
      AUTH_COOKIE_NAME,
      token,
      getAuthCookieOptions()
    );

    return response;

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
