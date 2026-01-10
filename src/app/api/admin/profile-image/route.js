import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - ดึงข้อมูลรูปโปรไฟล์ของ admin
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    const query = 'SELECT admin_id, admin_username, profile_image_path FROM admins WHERE admin_id = ?';
    const results = await executeQuery(query, [adminId]);

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        adminId: results[0].admin_id,
        username: results[0].admin_username,
        profileImage: results[0].profile_image_path // ส่งเป็น base64
      }
    });
  } catch (error) {
    console.error('Error fetching profile image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile image' },
      { status: 500 }
    );
  }
}

// POST - อัพโหลดรูปโปรไฟล์ใหม่ (เก็บเป็น base64)
export async function POST(request) {
  try {
    const body = await request.json();
    const { adminId, imageBase64 } = body;

    if (!adminId || !imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Admin ID and image data are required' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าเป็น base64 ของรูปภาพ
    if (!imageBase64.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image format' },
        { status: 400 }
      );
    }

    // ตรวจสอบขนาดข้อมูล base64 (ประมาณ 5MB เมื่อแปลงเป็นไฟล์)
    // base64 ใหญ่กว่าไฟล์จริงประมาณ 33%
    const base64Size = imageBase64.length * 0.75; // ขนาดโดยประมาณของไฟล์จริง
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (base64Size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // อัพเดทฐานข้อมูล - เก็บ base64 string
    const updateQuery = 'UPDATE admins SET profile_image_path = ? WHERE admin_id = ?';
    console.log('Updating profile image for adminId:', adminId); // Debug log
    const result = await executeQuery(updateQuery, [imageBase64, adminId]);
    console.log('Update result:', result); // Debug log

    // ตรวจสอบว่า update สำเร็จหรือไม่
    if (result.affectedRows === 0) {
      console.error('No rows updated! AdminId:', adminId);
      return NextResponse.json(
        { success: false, error: 'Admin not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profileImage: imageBase64,
        message: 'Profile image uploaded successfully'
      }
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload profile image' },
      { status: 500 }
    );
  }
}

// DELETE - ลบรูปโปรไฟล์
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีรูปโปรไฟล์หรือไม่
    const checkQuery = 'SELECT profile_image_path FROM admins WHERE admin_id = ?';
    const checkResults = await executeQuery(checkQuery, [adminId]);

    if (!checkResults[0]?.profile_image_path) {
      return NextResponse.json(
        { success: false, error: 'No profile image to delete' },
        { status: 404 }
      );
    }

    // อัพเดทฐานข้อมูลให้เป็น NULL
    const updateQuery = 'UPDATE admins SET profile_image_path = NULL WHERE admin_id = ?';
    await executeQuery(updateQuery, [adminId]);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Profile image deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete profile image' },
      { status: 500 }
    );
  }
}
