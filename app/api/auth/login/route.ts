import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, Member } from '@/models';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      return NextResponse.json({ error: 'Invalid phone or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid phone or password' }, { status: 401 });
    }

    let memberDetails = null;
    if (user.memberId) {
      memberDetails = await Member.findById(user.memberId);
    }

    const token = signToken({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role,
      memberId: user.memberId ? user.memberId.toString() : null,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        memberId: user.memberId,
        memberName: memberDetails ? memberDetails.name : (user.role === 'admin' ? 'Committee Admin' : 'Member'),
      },
    });

    // Set HttpOnly Cookie for seamless session persistence
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
