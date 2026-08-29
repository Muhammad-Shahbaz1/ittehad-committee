import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Payment, Claim, Member, FundLedger } from '@/models';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = searchParams.get('month'); // e.g. "August", "8", or "all"

    // Construct Date Range
    let startDate: Date;
    let endDate: Date;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    let periodTitle = `Annual Report — Year ${year}`;

    if (month && month !== 'all') {
      let monthIndex = monthNames.findIndex((m) => m.toLowerCase() === month.toLowerCase());
      if (monthIndex === -1 && !isNaN(parseInt(month))) {
        monthIndex = parseInt(month) - 1;
      }
      if (monthIndex >= 0 && monthIndex <= 11) {
        startDate = new Date(year, monthIndex, 1);
        endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        periodTitle = `${monthNames[monthIndex]} ${year}`;
      } else {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      }
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    // Fetch Payments in period
    const payments = await Payment.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('memberId', 'name phone cnic')
      .sort({ date: -1 })
      .lean();

    // Filter valid payments
    const validPayments = payments.filter((p) => p.memberId != null);

    // Group payments by category
    let entryFeeTotal = 0;
    let monthlyFeeTotal = 0;
    let extraDonationsTotal = 0;

    for (const p of validPayments) {
      if (p.type === 'entry') entryFeeTotal += p.amount;
      else if (p.type === 'monthly') monthlyFeeTotal += p.amount;
      else extraDonationsTotal += p.amount;
    }

    const totalInflow = entryFeeTotal + monthlyFeeTotal + extraDonationsTotal;

    // Fetch Claims in period
    const claims = await Claim.find({
      dateOfDeath: { $gte: startDate, $lte: endDate },
    })
      .populate('memberId', 'name phone')
      .sort({ dateOfDeath: -1 })
      .lean();

    const totalOutflow = claims.reduce((sum, c) => sum + c.amountPaid, 0);
    const netPeriodBalance = totalInflow - totalOutflow;

    // Fetch overall total committee balance to date
    const allLedger = await FundLedger.find().lean();
    let overallCredit = 0;
    let overallDebit = 0;
    for (const item of allLedger) {
      if (item.type === 'credit') overallCredit += item.amount;
      else if (item.type === 'debit') overallDebit += item.amount;
    }
    const overallNetBalance = overallCredit - overallDebit;

    // Active members count
    const totalMembers = await Member.countDocuments({ status: 'active' });

    return NextResponse.json({
      success: true,
      periodTitle,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalMembers,
        entryFeeTotal,
        monthlyFeeTotal,
        extraDonationsTotal,
        totalInflow,
        totalOutflow,
        netPeriodBalance,
        overallNetBalance,
      },
      payments: validPayments,
      claims,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
