import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Donation } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

async function generateDonationReceiptNo(type: 'inflow' | 'aid'): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = type === 'inflow' ? `DON-${year}-` : `AID-${year}-`;

  const last = await Donation.findOne({ receiptNo: { $regex: `^${prefix}` } })
    .sort({ receiptNo: -1 })
    .lean();

  let seq = 1;
  if (last?.receiptNo) {
    const parts = last.receiptNo.split('-');
    const n = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(n)) seq = n + 1;
  }

  let candidate = `${prefix}${seq.toString().padStart(4, '0')}`;
  while (await Donation.exists({ receiptNo: candidate })) {
    seq++;
    candidate = `${prefix}${seq.toString().padStart(4, '0')}`;
  }
  return candidate;
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const query: Record<string, unknown> = {};
    if (type === 'inflow' || type === 'aid') {
      query.type = type;
    }

    const records = await Donation.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const allRecords = await Donation.find().lean();
    let totalDonationsIn = 0;
    let totalMustaheqeenAid = 0;

    for (const r of allRecords) {
      if (r.type === 'inflow') totalDonationsIn += r.amount;
      else if (r.type === 'aid') totalMustaheqeenAid += r.amount;
    }

    return NextResponse.json({
      success: true,
      records,
      summary: {
        totalDonationsIn,
        totalMustaheqeenAid,
        donationFundBalance: totalDonationsIn - totalMustaheqeenAid,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only Admin can manage donation funds.' }, { status: 403 });
    }

    await connectToDatabase();
    const { type, personName, phone, cnic, category, amount, date, notes } = await req.json();

    if (!type || (type !== 'inflow' && type !== 'aid')) {
      return NextResponse.json({ error: 'Invalid record type' }, { status: 400 });
    }
    if (!personName || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Name and valid amount are required' }, { status: 400 });
    }

    const receiptNo = await generateDonationReceiptNo(type);
    const record = await Donation.create({
      type,
      personName: personName.trim(),
      phone: phone?.trim() || '',
      cnic: cnic?.trim() || '',
      category: category || (type === 'inflow' ? 'General Donation' : 'Mustaheq Aid'),
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      notes: notes?.trim() || '',
      receiptNo,
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only Admin can delete donation records.' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    await Donation.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
