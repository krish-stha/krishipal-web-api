import PDFDocument from "pdfkit";
import fs from "fs";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

export async function generateInvoicePdfBuffer(params: {
  order: any; // order lean/object is ok
  company: { name: string; address: string };
  logoPath?: string; // optional local file path
  user?: any; // ✅ NEW (optional) - backward compatible
}) {
  const { order, company, logoPath, user } = params;

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];

  doc.on("data", (d) => chunks.push(d));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageWidth = doc.page.width;
  const left = 40;
  const right = pageWidth - 40;

  // =========================
  // Header: Logo + Company + INVOICE
  // =========================
  if (logoPath) {
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, left, 35, { width: 56 });
      }
    } catch {
      // ignore logo errors
    }
  }

  doc
    .fillColor("#0f172a")
    .fontSize(16)
    .text(company.name, left + 70, 40, { align: "left" })
    .fontSize(10)
    .fillColor("#475569")
    .text(company.address, left + 70, 60, { align: "left" });

  doc
    .fillColor("#0f172a")
    .fontSize(22)
    .text("INVOICE", 0, 40, { align: "right" });

  doc.moveTo(left, 95).lineTo(right, 95).strokeColor("#e2e8f0").stroke();

  // =========================
  // Invoice meta
  // =========================
  const invoiceNo = `INV-${String(order._id).slice(-8).toUpperCase()}`;
  const created = order?.createdAt ? new Date(order.createdAt).toLocaleString() : "-";
  const paidAt = order?.paidAt ? new Date(order.paidAt).toLocaleString() : "-";

  const gateway = String(order.paymentGateway || order.paymentMethod || "COD").toUpperCase();
  const payStatus = String(order.paymentStatus || "unpaid").toUpperCase();

  doc.moveDown(1.2);
  doc.fillColor("#0f172a").fontSize(11);

  doc.text(`Invoice No: ${invoiceNo}`);
  doc.text(`Order ID: ${String(order._id)}`);
  doc.text(`Order Date: ${created}`);
  doc.text(`Payment Gateway: ${gateway}`);
  doc.text(`Payment Status: ${payStatus}`);
  doc.text(`Paid At: ${paidAt}`);

  // =========================
  // Customer block (optional)
  // =========================
  doc.moveDown(1);

  doc.fillColor("#0f172a").fontSize(12).text("Customer Details", { underline: true });
  doc.moveDown(0.4);

  doc.fillColor("#334155").fontSize(10);
  doc.text(`Name: ${user?.fullName || "-"}`);
  doc.text(`Email: ${user?.email || "-"}`);
  const phone =
    user?.phone ? `${user?.countryCode || ""}${user?.phone || ""}`.trim() : "-";
  doc.text(`Phone: ${phone}`);
  doc.moveDown(0.3);

  doc.fillColor("#0f172a").fontSize(12).text("Delivery Address", { underline: true });
  doc.moveDown(0.4);
  doc.fillColor("#334155").fontSize(10).text(String(order.address || "-"));

  // =========================
  // Items table
  // =========================
  doc.moveDown(1);

  doc.fillColor("#0f172a").fontSize(12).text("Items", { underline: true });
  doc.moveDown(0.5);

  const startX = left;
  let y = doc.y;

  const colProduct = startX;
  const colPrice = 330;
  const colQty = 420;
  const colTotal = 470;

  // header row
  doc.fontSize(10).fillColor("#475569");
  doc.text("Product", colProduct, y);
  doc.text("Price", colPrice, y);
  doc.text("Qty", colQty, y);
  doc.text("Total", colTotal, y);

  y += 16;
  doc.moveTo(left, y).lineTo(right, y).strokeColor("#e2e8f0").stroke();
  y += 10;

  doc.fillColor("#0f172a").fontSize(10);

  const items = order.items || [];
  for (const it of items) {
    const priceRs = Number(it.priceSnapshot || 0);
    const qty = Number(it.qty || 0);
    const lineTotal = priceRs * qty;

    // wrap product name if long
    doc.text(String(it.name || "-"), colProduct, y, { width: 280 });
    doc.text(money(priceRs), colPrice, y);
    doc.text(String(qty), colQty, y);
    doc.text(money(lineTotal), colTotal, y);

    y += 18;

    // new page safety
    if (y > 730) {
      doc.addPage();
      y = 60;

      // redraw header row on new page
      doc.fontSize(10).fillColor("#475569");
      doc.text("Product", colProduct, y);
      doc.text("Price", colPrice, y);
      doc.text("Qty", colQty, y);
      doc.text("Total", colTotal, y);

      y += 16;
      doc.moveTo(left, y).lineTo(right, y).strokeColor("#e2e8f0").stroke();
      y += 10;

      doc.fillColor("#0f172a").fontSize(10);
    }
  }

  // =========================
  // Totals
  // =========================
  doc.moveDown(2);

  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shippingFee || 0);
  const total = Number(order.total || subtotal + shipping);

  doc.fillColor("#0f172a").fontSize(11);
  doc.text(`Subtotal: ${money(subtotal)}`, { align: "right" });
  doc.text(`Shipping: ${money(shipping)}`, { align: "right" });
  doc.fontSize(14).text(`Total: ${money(total)}`, { align: "right" });

  // =========================
  // Footer
  // =========================
  doc.moveDown(2);
  doc.fillColor("#64748b").fontSize(10).text(
    `Thank you for shopping with ${company.name}.`,
    { align: "center" }
  );

  doc.end();
  return done;
}
