import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Claim, Member, Dependent, FundLedger, Announcement } from '@/models';
import { formatDeathAnnouncementMessage } from '@/lib/whatsapp';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    const claims = await Claim.find()
      .populate('memberId', 'name phone cnic')
      .populate('dependentId', 'name relation')
      .sort({ dateOfDeath: -1 })
      .lean();

    return NextResponse.json({ success: true, claims });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can file funeral claims.' }, { status: 403 });
    }

    await connectToDatabase();
    const { memberId, dependentId, dateOfDeath, amountPaid, notes, deceasedName } = await req.json();

    if (!memberId || !dateOfDeath || !amountPaid) {
      return NextResponse.json({ error: 'Member, date of death, and amount paid are required' }, { status: 400 });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    let finalDeceasedName = deceasedName;
    let relation = 'Member';

    if (dependentId) {
      const dep = await Dependent.findById(dependentId);
      if (dep) {
        finalDeceasedName = dep.name;
        relation = dep.relation;
      }
    } else if (!finalDeceasedName) {
      finalDeceasedName = member.name;
    }

    const deathDate = new Date(dateOfDeath);

    const claim = await Claim.create({
      memberId,
      dependentId: dependentId || null,
      deceasedName: finalDeceasedName,
      dateOfDeath: deathDate,
      amountPaid: Number(amountPaid),
      notes: notes || '',
    });

    // Automatically create debit entry in fundLedger
    await FundLedger.create({
      type: 'debit',
      amount: Number(amountPaid),
      date: deathDate,
      reference: claim._id,
      description: `Funeral Support Claim paid for Marhoom ${finalDeceasedName} (Member: ${member.name})`,
    });

    // Automatically generate WhatsApp death announcement
    const formattedDeathDate = deathDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const whatsAppMessage = formatDeathAnnouncementMessage({
      deceasedName: finalDeceasedName,
      memberName: member.name,
      relation,
      dateOfDeath: formattedDeathDate,
      amountPaid: Number(amountPaid),
    });

    // Save as announcement
    await Announcement.create({
      title: `Ilaan-e-Wafat: ${finalDeceasedName}`,
      message: `Afsosnak khabar: Hamare moazzaz member ${member.name} ke ${relation} ${finalDeceasedName} ka inteqal ho gaya hai. Committee ki janib se Rs. ${Number(amountPaid).toLocaleString()} kafan-dafan imdad jari ki gayi.`,
      type: 'death',
      date: deathDate,
      createdBy: 'Committee Admin',
    });

    return NextResponse.json({
      success: true,
      claim: {
        ...claim.toObject(),
        member: { name: member.name, phone: member.phone },
      },
      whatsAppMessage,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can edit funeral claims.' }, { status: 403 });
    }

    await connectToDatabase();
    const { id, deceasedName, amountPaid, dateOfDeath, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 });
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (deceasedName) claim.deceasedName = deceasedName.trim();
    if (amountPaid != null) claim.amountPaid = Number(amountPaid);
    if (dateOfDeath) claim.dateOfDeath = new Date(dateOfDeath);
    if (notes !== undefined) claim.notes = notes;

    await claim.save();

    // Update corresponding fundLedger entry
    if (amountPaid != null || dateOfDeath) {
      await FundLedger.updateMany(
        { reference: claim._id },
        {
          $set: {
            amount: Number(amountPaid || claim.amountPaid),
            date: dateOfDeath ? new Date(dateOfDeath) : claim.dateOfDeath,
          },
        }
      );
    }

    return NextResponse.json({ success: true, claim });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userSession = getUserFromRequest(req);
    if (!userSession || userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: Only committee Admin can delete funeral claims.' }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 });
    }

    const claim = await Claim.findByIdAndDelete(id);
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Automatically remove debit entry from fundLedger
    await FundLedger.deleteMany({ reference: id });

    return NextResponse.json({ success: true, message: 'Claim deleted and ledger reversed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
