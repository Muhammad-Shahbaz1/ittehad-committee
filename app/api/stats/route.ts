import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Member, Payment, Claim, FundLedger } from '@/models';

export async function GET() {
  try {
    await connectToDatabase();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const [members, allPayments, thisMonthPayments, allClaims, thisMonthClaims, recentLedger] =
      await Promise.all([
        Member.find().lean(),
        Payment.find().lean(),
        Payment.find({ date: { $gte: startOfMonth, $lt: endOfMonth } }).lean(),
        Claim.find().lean(),
        Claim.find({ dateOfDeath: { $gte: startOfMonth, $lt: endOfMonth } }).lean(),
        FundLedger.find().sort({ date: -1, createdAt: -1 }).limit(8).lean(),
      ]);

    const totalCollected = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const thisMonthCollected = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidOut = allClaims.reduce((sum, c) => sum + c.amountPaid, 0);
    const thisMonthPaidOut = thisMonthClaims.reduce((sum, c) => sum + c.amountPaid, 0);
    const currentBalance = totalCollected - totalPaidOut;

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === 'active').length;

    // Find who paid for this month (type: monthly & monthCovered matches current month, or payment made this month)
    const paidMemberIds = new Set(
      allPayments
        .filter(
          (p) =>
            p.type === 'monthly' &&
            (p.monthCovered?.toLowerCase().includes(currentMonthName.toLowerCase()) ||
              (p.date >= startOfMonth && p.date < endOfMonth))
        )
        .map((p) => p.memberId.toString())
    );

    const paidMembersCount = members.filter((m) => m.status === 'active' && paidMemberIds.has(m._id.toString())).length;
    const unpaidMembersCount = Math.max(0, activeMembers - paidMembersCount);

    // Generate monthly trend for the last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mName = d.toLocaleString('en-US', { month: 'short' });

      const income = allPayments
        .filter((p) => p.date >= d && p.date < nextD)
        .reduce((sum, p) => sum + p.amount, 0);

      const expense = allClaims
        .filter((c) => c.dateOfDeath >= d && c.dateOfDeath < nextD)
        .reduce((sum, c) => sum + c.amountPaid, 0);

      monthlyTrend.push({
        month: mName,
        income,
        expense,
        net: income - expense,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalCollected,
        thisMonthCollected,
        totalPaidOut,
        thisMonthPaidOut,
        currentBalance,
        totalMembers,
        activeMembers,
        paidMembersCount,
        unpaidMembersCount,
        currentMonthName,
      },
      monthlyTrend,
      recentLedger,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
