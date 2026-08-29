import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User, Member } from '@/models';
import { hashPassword, getUserFromRequest } from '@/lib/auth';
import { formatPasswordResetMessage, getWhatsAppShareUrl } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can reset member passwords.' }, { status: 403 });
    }

    await connectToDatabase();
    const { memberId, customPassword } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const newPassword = customPassword && customPassword.trim() ? customPassword.trim() : 'member123';
    const passwordHash = await hashPassword(newPassword);

    // Upsert user for this member
    await User.findOneAndUpdate(
      { memberId: member._id },
      {
        $set: {
          phone: member.phone,
          passwordHash,
          role: 'member',
        },
      },
      { upsert: true, new: true }
    );

    const whatsAppMessage = formatPasswordResetMessage({
      memberName: member.name,
      phone: member.phone,
      newPassword,
    });

    const whatsAppUrl = getWhatsAppShareUrl(member.phone, whatsAppMessage);

    return NextResponse.json({
      success: true,
      message: `Password for ${member.name} reset to ${newPassword}`,
      newPassword,
      memberName: member.name,
      phone: member.phone,
      whatsAppMessage,
      whatsAppUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
