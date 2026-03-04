// src/services/mail.service.ts
import nodemailer from "nodemailer";

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } =
  process.env;

let transporter: nodemailer.Transporter | null = null;

function isEmailConfigured() {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function getTransporter() {
  if (transporter) return transporter;

  if (!isEmailConfigured()) {
    // ✅ IMPORTANT: don't throw during tests/CI
    // Create a dummy "json transport" so sendMail doesn't crash.
    // Nodemailer supports this transport and it won't send real email.
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST!,
    port: Number(process.env.EMAIL_PORT!),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  });

  return transporter;
}

/** Optional but useful: logs if SMTP is OK */
export async function verifyEmailTransport(): Promise<boolean> {
  try {
    const t = getTransporter();

    // If not configured, skip verify
    if (!isEmailConfigured()) return true;

    await t.verify();
    console.log("✅ Email transporter verified");
    return true;
  } catch (err) {
    console.error("❌ Email transporter verify failed:", err);
    return false;
  }
}

async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const t = getTransporter();
  const from = EMAIL_FROM || EMAIL_USER || "no-reply@example.com";

  return t.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

/** ✅ Password reset email (LINK + CODE) */
export async function sendResetEmail(
  to: string,
  resetLink: string,
  code: string
) {
  await sendEmail({
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial; padding: 20px; color:#0f172a;">
        <h2 style="margin:0 0 8px;">Password Reset Request</h2>
        <p style="margin:0 0 12px;">You requested to reset your password.</p>

        <div style="border:1px solid #e2e8f0; padding:14px; border-radius:10px; margin-bottom:14px;">
          <p style="margin:0 0 6px;"><b>Your Reset Code:</b></p>
          <div style="font-size:24px; font-weight:700; letter-spacing:4px;">
            ${code}
          </div>
          <p style="margin:10px 0 0; color:#475569; font-size:12px;">
            (You may be asked to enter this code on the reset screen.)
          </p>
        </div>

        <p style="margin:0 0 10px;">Click the button below to reset:</p>

        <a href="${resetLink}"
          style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;">
          Reset Password
        </a>

        <p style="margin-top:15px;color:#475569;font-size:12px;">
          This link expires in 15 minutes.
        </p>
      </div>
    `,
  });

  return true;
}

export async function sendPaymentReceiptEmail(params: {
  to: string;
  userName?: string;
  orderId: string;
  total: number;
  gateway: string;
  invoicePdf: Buffer;
}) {
  const t = getTransporter();
  const name = params.userName ? `<b>${params.userName}</b>` : "there";

  const html = `
    <div style="font-family: Arial; padding: 20px; color: #0f172a;">
      <h2 style="margin: 0 0 8px;">Payment Received ✅</h2>
      <p style="margin: 0 0 14px;">Hello ${name}, we received your payment.</p>

      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
        <p style="margin: 0 0 8px;"><b>Order ID:</b> ${params.orderId}</p>
        <p style="margin: 0 0 8px;"><b>Gateway:</b> ${params.gateway}</p>
        <p style="margin: 0 0 8px;"><b>Total:</b> Rs. ${Number(params.total || 0)}</p>
      </div>

      <p style="margin-top: 14px; color:#475569;">
        Invoice is attached as PDF.
      </p>
    </div>
  `;

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@example.com";

  return t.sendMail({
    from,
    to: params.to,
    subject: `Payment Receipt - Order ${String(params.orderId).slice(-6)}`,
    html,
    attachments: [
      {
        filename: `invoice-${String(params.orderId).slice(-8)}.pdf`,
        content: params.invoicePdf,
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendOrderStatusEmail(params: {
  to: string;
  userName?: string;
  orderId: string;
  status: string;
  total: number;
  address?: string;
}) {
  const statusPretty = String(params.status || "")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

  await sendEmail({
    to: params.to,
    subject: `Your order ${params.orderId} is now ${statusPretty}`,
    html: `
      <div style="font-family: Arial; padding: 20px; color: #0f172a;">
        <h2 style="margin: 0 0 8px;">Order Status Updated</h2>
        <p style="margin: 0 0 14px;">
          Hello ${params.userName ? `<b>${params.userName}</b>` : "there"},
          your order status has changed.
        </p>

        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
          <p style="margin: 0 0 8px;"><b>Order ID:</b> ${params.orderId}</p>
          <p style="margin: 0 0 8px;"><b>Status:</b> <span style="color:#16a34a">${statusPretty}</span></p>
          <p style="margin: 0 0 8px;"><b>Total:</b> Rs. ${Number(params.total || 0)}</p>
          ${
            params.address
              ? `<p style="margin: 0;"><b>Delivery Address:</b> ${params.address}</p>`
              : ""
          }
        </div>

        <p style="margin-top: 14px; color:#475569;">
          Thank you for shopping.
        </p>
      </div>
    `,
  });

  return true;
}