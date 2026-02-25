"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { getPublicSettings } from "@/lib/api/settings";

type PublicSettings = {
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
};

export default function ContactPage() {
  const [s, setS] = useState<PublicSettings>({
    storePhone: "",
    storeEmail: "",
    storeAddress: "",
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await getPublicSettings();
        // your API shape: { success: true, data: {...} }
        const data = res?.data ?? res ?? {};
        if (!alive) return;

        setS({
          storePhone: String(data?.storePhone || ""),
          storeEmail: String(data?.storeEmail || ""),
          storeAddress: String(data?.storeAddress || ""),
        });
      } catch {
        // keep defaults
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const phone = s.storePhone?.trim() || "+1 123 456 7890";
  const email = s.storeEmail?.trim() || "info@krishipal.com";
  const address = s.storeAddress?.trim() || "123 Kathmandu, Nepal, 44600";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-center mb-6">Contact Us</h1>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16">
            We&apos;re here to help! Contact us using the form below or reach out directly using the
            information provided.
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-center mb-8">Contact Information</h2>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}