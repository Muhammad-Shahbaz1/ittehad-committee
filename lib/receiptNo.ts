import { Payment } from '@/models';

export async function generateReceiptNo(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `SBYWO-${currentYear}-`;

  // Find the highest existing receipt number for the current year
  const lastPayment = await Payment.findOne({
    receiptNo: { $regex: `^${prefix}` }
  })
    .sort({ receiptNo: -1 })
    .lean();

  let nextSequence = 1;
  if (lastPayment && lastPayment.receiptNo) {
    const parts = lastPayment.receiptNo.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  // Ensure candidate is strictly unique
  let candidate = `${prefix}${nextSequence.toString().padStart(4, '0')}`;
  while (await Payment.exists({ receiptNo: candidate })) {
    nextSequence++;
    candidate = `${prefix}${nextSequence.toString().padStart(4, '0')}`;
  }

  return candidate;
}
