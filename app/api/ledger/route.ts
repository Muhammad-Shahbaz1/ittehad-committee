import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { FundLedger } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    const query: Record<string, unknown> = {};
    if (type && (type === 'credit' || type === 'debit')) {
      query.type = type;
    }

    const transactions = await FundLedger.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const allEntries = await FundLedger.find().lean();
    let totalCredit = 0;
    let totalDebit = 0;

    for (const item of allEntries) {
      if (item.type === 'credit') {
        totalCredit += item.amount;
      } else if (item.type === 'debit') {
        totalDebit += item.amount;
      }
    }

    const currentBalance = totalCredit - totalDebit;

    return NextResponse.json({
      success: true,
      transactions,
      summary: {
        totalCredit,
        totalDebit,
        currentBalance,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can delete ledger entries.' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Ledger entry ID is required' }, { status: 400 });
    }

    await FundLedger.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Ledger entry deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
