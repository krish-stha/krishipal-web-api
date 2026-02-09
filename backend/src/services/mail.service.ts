import nodemailer from "nodemailer";

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
} = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  throw new Error("Email environment variables are missing");
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendResetEmail(to: string, resetLink: string) {
  await transporter.sendMail({
    from: EMAIL_FROM,
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
