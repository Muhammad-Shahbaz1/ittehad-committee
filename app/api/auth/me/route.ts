import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, Member } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const tokenPayload = getUserFromRequest(req);

    if (!tokenPayload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await User.findById(tokenPayload.userId).select('-passwordHash');
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let member = null;
    if (user.memberId) {
      member = await Member.findById(user.memberId);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        memberId: user.memberId,
        name: member ? member.name : (user.role === 'admin' ? 'Committee Head' : 'Member'),
        memberDetails: member,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
