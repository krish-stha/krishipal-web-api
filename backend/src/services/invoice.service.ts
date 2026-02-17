import PDFDocument from "pdfkit";
import { IOrder } from "../models/order.model";

function moneyRsFromPaisa(paisa: number) {
  return `Rs. ${Math.round((paisa || 0) / 100)}`;
}

export async function generateInvoicePdfBuffer(params: {
  order: any; // order lean/object is ok
  company: { name: string; address: string };
  logoPath?: string; // optional local file path
}) {
  const { order, company, logoPath } = params;

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];

  doc.on("data", (d) => chunks.push(d));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // Header
  if (logoPath) {
    try {
      doc.image(logoPath, 40, 35, { width: 60 });
    } catch {
      // ignore logo errors
    }
  }

  doc
    .fontSize(18)
    .text(company.name, 110, 40, { align: "left" })
    .fontSize(10)
    .fillColor("#334155")
    .text(company.address, 110, 64, { align: "left" });

  doc
    .fillColor("#0f172a")
    .fontSize(20)
    .text("INVOICE", 0, 40, { align: "right" });

  doc.moveDown(2);

  const invoiceNo = `INV-${String(order._id).slice(-8).toUpperCase()}`;
  const created = order?.createdAt ? new Date(order.createdAt).toLocaleString() : "-";
  const paidAt = order?.paidAt ? new Date(order.paidAt).toLocaleString() : "-";

  doc
    .fontSize(11)
    .fillColor("#0f172a")
    .text(`Invoice No: ${invoiceNo}`)
    .text(`Order ID: ${order._id}`)
    .text(`Order Date: ${created}`)
    .text(`Payment: ${String(order.paymentGateway || order.paymentMethod || "COD")}`)
    .text(`Payment Status: ${String(order.paymentStatus || "unpaid").toUpperCase()}`)
    .text(`Paid At: ${paidAt}`);

  doc.moveDown(1);

  // Customer
  doc.fontSize(12).text("Delivery Address", { underline: true });
  doc.fontSize(11).fillColor("#334155").text(String(order.address || "-"));
  doc.moveDown(1);

  // Items table header
  doc.fillColor("#0f172a").fontSize(12).text("Items", { underline: true });
  doc.moveDown(0.5);

  const startX = 40;
  let y = doc.y;

  const col1 = startX;
  const col2 = 310;
  const col3 = 390;
  const col4 = 460;

  doc.fontSize(10).fillColor("#475569");
  doc.text("Product", col1, y);
  doc.text("Price", col2, y);
  doc.text("Qty", col3, y);
  doc.text("Total", col4, y);

  y += 18;
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#e2e8f0").stroke();

  y += 8;

  doc.fillColor("#0f172a").strokeColor("#e2e8f0");

  const items = order.items || [];
  for (const it of items) {
    const priceRs = Number(it.priceSnapshot || 0);
    const qty = Number(it.qty || 0);
    const lineTotal = priceRs * qty;

    doc.fontSize(10).text(String(it.name || "-"), col1, y, { width: 250 });
    doc.text(`Rs. ${priceRs}`, col2, y);
    doc.text(String(qty), col3, y);
    doc.text(`Rs. ${lineTotal}`, col4, y);

    y += 18;
    if (y > 700) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveDown(2);

  // Totals
  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shippingFee || 0);
  const total = Number(order.total || subtotal + shipping);

  doc.fontSize(12).fillColor("#0f172a");
  doc.text(`Subtotal: Rs. ${subtotal}`, { align: "right" });
  doc.text(`Shipping: Rs. ${shipping}`, { align: "right" });
  doc.fontSize(14).text(`Total: Rs. ${total}`, { align: "right" });

  doc.moveDown(2);
  doc.fontSize(10).fillColor("#64748b").text("Thank you for shopping with KrishiPal.", {
    align: "center",
  });

  doc.end();
  return done;
}
