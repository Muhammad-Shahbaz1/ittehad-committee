import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Member, Dependent, Payment, Claim, User, FundLedger } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const member = await Member.findById(id).lean();
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const [dependents, payments, claims] = await Promise.all([
      Dependent.find({ memberId: id }).sort({ createdAt: -1 }).lean(),
      Payment.find({ memberId: id }).sort({ date: -1 }).lean(),
      Claim.find({ memberId: id }).sort({ dateOfDeath: -1 }).lean(),
    ]);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      member: {
        ...member,
        dependents,
        payments,
        claims,
        totalPaid,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can edit members.' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    const data = await req.json();

    const updated = await Member.findByIdAndUpdate(
      id,
      {
        $set: {
          name: data.name?.trim(),
          phone: data.phone?.trim(),
          cnic: data.cnic?.trim(),
          address: data.address?.trim(),
          status: data.status,
          joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Also update phone in user login if phone changed
    if (data.phone) {
      await User.updateMany({ memberId: id }, { $set: { phone: data.phone.trim() } });
    }

    return NextResponse.json({ success: true, member: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can delete members.' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;

    const member = await Member.findByIdAndDelete(id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Clean up associated dependents, users, and payments
    const payments = await Payment.find({ memberId: id });
    const paymentIds = payments.map((p) => p._id);

    await Promise.all([
      Dependent.deleteMany({ memberId: id }),
      User.deleteMany({ memberId: id }),
      Payment.deleteMany({ memberId: id }),
      FundLedger.deleteMany({ reference: { $in: paymentIds } }),
    ]);

    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
