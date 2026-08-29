import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Payment, Member, FundLedger } from '@/models';
import { generateReceiptNo } from '@/lib/receiptNo';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const month = searchParams.get('month');
    const type = searchParams.get('type');

    const query: Record<string, unknown> = {};
    if (memberId) query.memberId = memberId;
    if (month) query.monthCovered = { $regex: new RegExp(month, 'i') };
    if (type && type !== 'all') query.type = type;

    const payments = await Payment.find(query)
      .populate('memberId', 'name phone cnic address')
      .sort({ date: -1 })
      .lean();

    // Filter only valid active payments
    const validPayments = payments.filter((p) => p.memberId != null);

    return NextResponse.json({ success: true, payments: validPayments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can record payments.' }, { status: 403 });
    }

    await connectToDatabase();
    const { memberId, type, amount, date, monthCovered } = await req.json();

    if (!memberId || !type || !amount) {
      return NextResponse.json({ error: 'Member, payment type, and amount are required' }, { status: 400 });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const receiptNo = await generateReceiptNo();
    const paymentDate = date ? new Date(date) : new Date();

    const payment = await Payment.create({
      memberId,
      type,
      amount: Number(amount),
      date: paymentDate,
      receiptNo,
      monthCovered: monthCovered || (type === 'monthly' ? new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }) : ''),
    });

    // Automatically create credit entry in fundLedger
    const typeLabel =
      type === 'entry'
        ? 'Dakhla Fee (Entry Fee)'
        : type === 'monthly'
        ? `Mahana Fee (${payment.monthCovered})`
        : 'Extra Donation / Voluntary';

    await FundLedger.create({
      type: 'credit',
      amount: Number(amount),
      date: paymentDate,
      reference: payment._id,
      description: `${typeLabel} received from ${member.name} (${receiptNo})`,
    });

    return NextResponse.json({
      success: true,
      payment: {
        ...payment.toObject(),
        member: {
          _id: member._id,
          name: member.name,
          phone: member.phone,
          cnic: member.cnic,
          address: member.address,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
