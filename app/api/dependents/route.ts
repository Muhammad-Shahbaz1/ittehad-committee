import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Dependent } from '@/models';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { memberId, name, relation } = await req.json();

    if (!memberId || !name || !relation) {
      return NextResponse.json({ error: 'MemberId, Name, and Relation are required' }, { status: 400 });
    }

    const dependent = await Dependent.create({
      memberId,
      name: name.trim(),
      relation: relation.trim(),
    });

    return NextResponse.json({ success: true, dependent });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Dependent id is required' }, { status: 400 });
    }

    await Dependent.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Dependent deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
