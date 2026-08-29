import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();

    // Ensure Primary Admin User Exists
    const adminPhone = process.env.ADMIN_INITIAL_PHONE || '03001234567';
    let admin = await User.findOne({ phone: adminPhone });

    if (!admin) {
      const passwordHash = await hashPassword(process.env.ADMIN_INITIAL_PASSWORD || 'admin123');
      admin = await User.create({
        phone: adminPhone,
        passwordHash,
        role: 'admin',
        memberId: null,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account verified and ready.',
      admin: {
        phone: adminPhone,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
