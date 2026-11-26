/**
 * Helper to generate direct WhatsApp URLs
 */

export interface ReceiptShareData {
  receiptNo: string;
  memberName: string;
  phone: string;
  type: 'entry' | 'monthly' | 'extra';
  amount: number;
  monthCovered?: string;
  date: string;
}

export function formatReceiptWhatsAppMessage(data: ReceiptShareData): string {
  const typeText =
    data.type === 'entry'
      ? 'Dakhla Fee (Entry Fee)'
      : data.type === 'monthly'
      ? `Mahana Fee (${data.monthCovered || 'Monthly'})`
      : 'Atiya / Extra Imdad';

  return `*SHNAI BUNERWAL YOUTH WELFARE ORGANIZATION*
*DIGITAL RECEIPT (PARCHI)*
━━━━━━━━━━━━━━━━━━━━
📄 *Receipt No:* ${data.receiptNo}
👤 *Member Name:* ${data.memberName}
📱 *Phone:* ${data.phone}
🏷️ *Payment Type:* ${typeText}
💰 *Amount Received:* Rs. ${data.amount.toLocaleString()}
📅 *Date:* ${data.date}
━━━━━━━━━━━━━━━━━━━━
✅ _Shukriya! Aapki adaigi kamyabi se record ho chuki hai._
🌐 _Shnai Bunerwal Youth Welfare Organization Portal_`;
}

export function formatDeathAnnouncementMessage(data: {
  deceasedName: string;
  memberName: string;
  relation: string;
  dateOfDeath: string;
  amountPaid: number;
}): string {
  return `*إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ*
*SHNAI BUNERWAL YOUTH WELFARE ORGANIZATION — ILAAN-E-WAFAT*
━━━━━━━━━━━━━━━━━━━━
Afsosnak khabar di jati hai ke hamare moazzaz member *${data.memberName}* ke ${data.relation || 'Azeez'} *${data.deceasedName}* ka inteqal ho gaya hai.

📅 *Tareekh-e-Wafat:* ${data.dateOfDeath}
🕊️ *Dua-e-Maghfirat:* Allah Tala marhoom ko Jannat-ul-Firdous me aala maqam ata farmaye aur lawahiqeen ko sabr-e-jameel ata farmaye. Ameen.

━━━━━━━━━━━━━━━━━━━━
🤝 *Committee Kafan-Dafan Imdad:* Rs. ${data.amountPaid.toLocaleString()}
_Shnai Bunerwal Youth Welfare Organization Administration_`;
}

export function formatMonthlyReminderMessage(data: {
  memberName: string;
  phone: string;
  month: string;
  amount: number;
}): string {
  return `*SHNAI BUNERWAL YOUTH WELFARE ORGANIZATION — REMINDER*
━━━━━━━━━━━━━━━━━━━━
Moazzaz Member *${data.memberName}*,
As-salamu alaykum!

Baraye mehrbani mahe *${data.month}* ki mahana fee *Rs. ${data.amount.toLocaleString()}* jald az jald organization fund me jama karwayein taake welfari silsila jari rahe.

Shukriya!
_Shnai Bunerwal Youth Welfare Organization Management_`;
}

export function formatPasswordResetMessage(data: {
  memberName: string;
  phone: string;
  newPassword: string;
}): string {
  return `*SHNAI BUNERWAL YOUTH WELFARE ORGANIZATION — PASSWORD RESET*
━━━━━━━━━━━━━━━━━━━━
Moazzaz Member *${data.memberName}*,
As-salamu alaykum!

Aapki darkhwast par aapka Shnai Bunerwal Youth Welfare Organization Member Portal login password reset kar diya gaya hai.

📱 *Login Mobile No:* ${data.phone}
🔑 *Naya Password:* ${data.newPassword}

_Note: Login ke baad aap Settings me ja kar apna man-pasand password set kar sakte hain._

_Shnai Bunerwal Youth Welfare Organization Management_`;
}

export function getWhatsAppShareUrl(phone: string, text: string): string {
  // Clean phone number: if starts with 03..., replace with 923...
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.substring(1);
  }
  const encodedText = encodeURIComponent(text);
  if (cleanPhone.length >= 10) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

