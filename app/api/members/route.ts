import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Member, Dependent, Payment, FundLedger, User } from '@/models';
import { generateReceiptNo } from '@/lib/receiptNo';
import { hashPassword, getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const month = searchParams.get('month') || '';

    const query: Record<string, unknown> = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
      ];
    }

    const members = await Member.find(query).sort({ createdAt: -1 }).lean();

    const targetMonth = month || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const memberIds = members.map((m) => m._id);
    const monthlyPayments = await Payment.find({
      memberId: { $in: memberIds },
      type: 'monthly',
      monthCovered: { $regex: new RegExp(targetMonth, 'i') },
    }).lean();

    const paidMemberIds = new Set(monthlyPayments.map((p) => p.memberId.toString()));

    const dependents = await Dependent.find({ memberId: { $in: memberIds } }).lean();
    const dependentCountMap: Record<string, number> = {};
    for (const d of dependents) {
      const mid = d.memberId.toString();
      dependentCountMap[mid] = (dependentCountMap[mid] || 0) + 1;
    }

    const result = members.map((m) => ({
      ...m,
      isPaidForMonth: paidMemberIds.has(m._id.toString()),
      dependentsCount: dependentCountMap[m._id.toString()] || 0,
    }));

    return NextResponse.json({
      success: true,
      members: result,
      targetMonth,
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
      return NextResponse.json({ error: 'Access denied: Only committee Admin can add members.' }, { status: 403 });
    }

    await connectToDatabase();
    const data = await req.json();

    const { name, phone, cnic, address, joinDate, status, dependents, collectEntryFee } = data;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and Phone are required' }, { status: 400 });
    }

    // Check phone uniqueness
    const existing = await Member.findOne({ phone: phone.trim() });
    if (existing) {
      return NextResponse.json({ error: 'A member with this phone number already exists' }, { status: 400 });
    }

    const newMember = await Member.create({
      name: name.trim(),
      phone: phone.trim(),
      cnic: cnic ? cnic.trim() : '',
      address: address ? address.trim() : '',
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      status: status || 'active',
    });

    // Create user login for this member (Default password: 'member123')
    const initialPass = 'member123';
    const passwordHash = await hashPassword(initialPass);
    await User.create({
      memberId: newMember._id,
      phone: newMember.phone,
      passwordHash,
      role: 'member',
    });

    // Add dependents if provided
    if (Array.isArray(dependents) && dependents.length > 0) {
      const depDocs = dependents
        .filter((d: { name?: string; relation?: string }) => d.name && d.name.trim())
        .map((d: { name: string; relation: string }) => ({
          memberId: newMember._id,
          name: d.name.trim(),
          relation: d.relation ? d.relation.trim() : 'Dependent',
        }));

      if (depDocs.length > 0) {
        await Dependent.insertMany(depDocs);
      }
    }

    // If collectEntryFee is true (Rs. 1000 default)
    let receiptData = null;
    if (collectEntryFee) {
      const receiptNo = await generateReceiptNo();
      const entryPayment = await Payment.create({
        memberId: newMember._id,
        type: 'entry',
        amount: 1000,
        date: new Date(),
        receiptNo,
        monthCovered: 'Joining',
      });

      await FundLedger.create({
        type: 'credit',
        amount: 1000,
        date: new Date(),
        reference: entryPayment._id,
        description: `Entry Fee (Dakhla Fee) from ${newMember.name} (${receiptNo})`,
      });

      receiptData = entryPayment;
    }

    return NextResponse.json({
      success: true,
      member: newMember,
      receipt: receiptData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
