import nodemailer from "nodemailer";

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  throw new Error("Email environment variables are missing");
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  secure: Number(EMAIL_PORT) === 465, // ✅ 465 = true, others = false
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// optional but useful: logs if smtp is ok
export async function verifyEmailTransport() {
  try {
    await transporter.verify();
    console.log("✅ Email transporter verified");
  } catch (err) {
    console.error("❌ Email transporter verify failed:", err);
  }
}

async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const from = EMAIL_FROM || EMAIL_USER; // ✅ fallback
  return transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

// ---------------- existing reset email ----------------
export async function sendResetEmail(to: string, resetLink: string) {
  await sendEmail({
    to,
    subject: "Reset your password - KrishiPal",
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password.</p>
        <p>Click the button below:</p>
        <a href="${resetLink}" 
           style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;">
          Reset Password
        </a>
        <p style="margin-top:15px;">This link expires in 15 minutes.</p>
      </div>
    `,
  });
}

export async function sendPaymentReceiptEmail(params: {
  to: string;
  userName?: string;
  orderId: string;
  total: number;
  gateway: string;
  invoicePdf: Buffer;
}) {
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

  // NOTE: Using transporter directly with attachments
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  // @ts-ignore transporter exists in this module scope
  return transporter.sendMail({
    from,
    to: params.to,
    subject: `Payment Receipt - Order ${String(params.orderId).slice(-6)} - KrishiPal`,
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


// ---------------- NEW: order status email ----------------
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
    subject: `Your order ${params.orderId} is now ${statusPretty} - KrishiPal`,
    html: `
      <div style="font-family: Arial; padding: 20px; color: #0f172a;">
        <h2 style="margin: 0 0 8px;">Order Status Updated</h2>
        <p style="margin: 0 0 14px;">
          Hello ${params.userName ? `<b>${params.userName}</b>` : "there"}, your order status has changed.
        </p>

        <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
          <p style="margin: 0 0 8px;"><b>Order ID:</b> ${params.orderId}</p>
          <p style="margin: 0 0 8px;"><b>Status:</b> <span style="color:#16a34a">${statusPretty}</span></p>
          <p style="margin: 0 0 8px;"><b>Total:</b> Rs. ${Number(params.total || 0)}</p>
          ${params.address ? `<p style="margin: 0;"><b>Delivery Address:</b> ${params.address}</p>` : ""}
        </div>

        <p style="margin-top: 14px; color:#475569;">
          Thank you for shopping with KrishiPal.
        </p>
      </div>
    `,
  });

  
}
