import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Announcement } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    const announcements = await Announcement.find().sort({ date: -1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, announcements });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can post announcements.' }, { status: 403 });
    }

    await connectToDatabase();
    const { title, message, type, createdBy } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const announcement = await Announcement.create({
      title: title || '',
      message: message.trim(),
      type: type || 'general',
      date: new Date(),
      createdBy: createdBy || 'Admin',
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can delete announcements.' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    await Announcement.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Announcement deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
