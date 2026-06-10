import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let etherealTransport: Transporter | null = null;
let etherealUrl: ReturnType<typeof nodemailer.getTestMessageUrl> | null = null;

async function getEtherealTransport() {
  if (etherealTransport) return { transport: etherealTransport, url: etherealUrl };
  const testAccount = await nodemailer.createTestAccount();
  etherealTransport = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return { transport: etherealTransport, url: etherealUrl };
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export async function sendMagicCode(to: string, code: string, appUrl: string) {
  const transport = createTransport();

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="margin-bottom:8px">⚽ Predictor 26 — Your login code</h2>
      <p style="color:#666">Enter this code to sign in:</p>
      <div style="font-size:48px;font-weight:900;letter-spacing:12px;text-align:center;
                  background:#f4f4f5;border-radius:12px;padding:24px;margin:24px 0">
        ${code}
      </div>
      <p style="color:#666;font-size:14px">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
    </div>
  `;

  if (!transport) {
    const { transport: devTransport } = await getEtherealTransport();
    try {
      const info = await devTransport.sendMail({
        from: `"Predictor 26" <noreply@predictor26.com>`,
        to,
        subject: `Your login code: ${code}`,
        html,
      });
      console.log(`\n📧 Magic code for ${to}: ${code}`);
      console.log(`   Preview: ${nodemailer.getTestMessageUrl(info)}\n`);
    } catch {
      console.log(`\n📧 Magic code for ${to}: ${code}`);
      console.log(`   (Email delivery failed — code shown here instead)\n`);
    }
    return;
  }

  const from = process.env.SMTP_FROM ?? `"Predictor 26" <${process.env.SMTP_USER}>`;
  await transport.sendMail({ from, to, subject: `Your login code: ${code}`, html });
}
