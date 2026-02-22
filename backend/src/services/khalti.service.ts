// import axios from "axios";
// import { HttpError } from "../errors/http-error";

// const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL || "https://dev.khalti.com/api/v2";
// const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;

// if (!KHALTI_SECRET_KEY) {
//   throw new Error("KHALTI_SECRET_KEY missing in .env");
// }

// // docs show Authorization prefix: 'key <secret>'  :contentReference[oaicite:5]{index=5}
// function khaltiHeaders() {
//   return {
//     Authorization: `key ${KHALTI_SECRET_KEY}`,
//     "Content-Type": "application/json",
//   };
// }

// export async function khaltiInitiate(payload: {
//   return_url: string;
//   website_url: string;
//   amount: number; // in paisa
//   purchase_order_id: string;
//   purchase_order_name: string;
//   customer_info: { name: string; email: string; phone: string };
// }) {
//   try {
//     const url = `${KHALTI_BASE_URL}/epayment/initiate/`;
//     const res = await axios.post(url, payload, { headers: khaltiHeaders() });
//     return res.data as { pidx: string; payment_url: string; expires_at: string; expires_in: number };
//   } catch (e: any) {
//     const msg = e?.response?.data?.detail || e?.response?.data || e?.message || "Khalti initiate failed";
//     throw new HttpError(400, typeof msg === "string" ? msg : JSON.stringify(msg));
//   }
// }

// export async function khaltiLookup(pidx: string) {
//   try {
//     const url = `${KHALTI_BASE_URL}/epayment/lookup/`;
//     const res = await axios.post(url, { pidx }, { headers: khaltiHeaders() });
//     return res.data as {
//       pidx: string;
//       total_amount: number;
//       status: string; // Completed / Pending / Initiated / Expired / User canceled / ...
//       transaction_id: string | null;
//       refunded: boolean;
//       fee: number;
//     };
//   } catch (e: any) {
//     const msg = e?.response?.data?.detail || e?.response?.data || e?.message || "Khalti lookup failed";
//     throw new HttpError(400, typeof msg === "string" ? msg : JSON.stringify(msg));
//   }
// }
