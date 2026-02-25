"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react"; // ✅ add useRef
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Button } from "@/app/auth/components/ui/button";
import { Card } from "@/app/auth/components/ui/card";
import { useCart } from "@/lib/contexts/cart-context";
import { getPublicSettings } from "@/lib/api/settings";
import { getPublicProductBySlug } from "@/lib/api/public/products";
import { useAuth } from "@/lib/contexts/auth-contexts";
import { usePathname } from "next/navigation";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function productImageUrl(filename?: string | null) {
  if (!filename) return "/images/placeholder.png";
  return `${BACKEND_URL}/public/product_images/${filename}`;
}

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

// ✅ Fly-to-cart animation (DOM only)
function flyToCart(fromEl: HTMLElement | null) {
  try {
    const cartEl = document.getElementById("cart-icon");
    if (!fromEl || !cartEl) return;

    const from = fromEl.getBoundingClientRect();
    const to = cartEl.getBoundingClientRect();

    const clone = fromEl.cloneNode(true) as HTMLElement;

    clone.style.objectFit = "cover";
    clone.style.position = "fixed";
    clone.style.left = `${from.left}px`;
    clone.style.top = `${from.top}px`;
    clone.style.width = `${from.width}px`;
    clone.style.height = `${from.height}px`;
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.borderRadius = "16px";
    clone.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
    clone.style.transform = "translate3d(0,0,0) scale(1)";
    clone.style.opacity = "1";
    clone.style.transition =
      "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease";

    document.body.appendChild(clone);

    const toX = to.left + to.width / 2;
    const toY = to.top + to.height / 2;
    const fromX = from.left + from.width / 2;
    const fromY = from.top + from.height / 2;

    const dx = toX - fromX;
    const dy = toY - fromY;

    requestAnimationFrame(() => {
      clone.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.15)`;
      clone.style.opacity = "0.25";
    });

    setTimeout(() => {
      cartEl.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.12)" },
          { transform: "scale(1)" },
        ],
        { duration: 260, easing: "ease-out" }
      );
    }, 520);

    const cleanup = () => {
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
    };
    clone.addEventListener("transitionend", cleanup, { once: true });
    setTimeout(cleanup, 900);
  } catch {
    // ignore
  }
}

export default function ShopProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || "");
  const [loginOpen, setLoginOpen] = useState(false);
  

  const { user } = useAuth();
  const pathname = usePathname();

  const requireLogin = () => {
  if (user) return true;
  setLoginOpen(true);
  return false;
};

  const { add, selectOnly, refresh } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [product, setProduct] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [qty, setQty] = useState(1);

  // ✅ ref for animation source (main image)
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!slug) return;

      setLoading(true);
      setError("");

      try {
        const res = await getPublicProductBySlug(slug);
        const data = res?.data ?? res;
        if (!alive) return;
        setProduct(data);
      } catch (e: any) {
        if (!alive) return;
        setProduct(null);
        setError(e?.response?.data?.message || e?.message || "Failed to load product");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicSettings();
        setSettings(res?.data ?? res ?? null);
      } catch {
        setSettings(null);
      }
    })();
  }, []);

  const images = useMemo(() => (Array.isArray(product?.images) ? product.images : []), [product?.images]);
  const firstImage = images?.[0] ?? null;

  const hasDiscount =
    product?.discountPrice !== null &&
    product?.discountPrice !== undefined &&
    Number(product?.discountPrice) < Number(product?.price);

  const displayPrice = hasDiscount ? product?.discountPrice : product?.price;

  const stock = Number(product?.stock ?? 0);
  const inStock = stock > 0;

  const lowStockThreshold = Number(settings?.lowStockThreshold ?? 5);
  const low = inStock && stock <= (Number.isFinite(lowStockThreshold) ? Math.max(1, lowStockThreshold) : 5);

  const onAddToCart = async () => {
    setError("");
    if (!requireLogin()) return;
    if (!product?._id) return setError("Product not found");
    if (!inStock) return setError("Out of stock");

    // ✅ animation first (no logic change)
    flyToCart(imgRef.current);

    const q = Math.max(1, Math.min(stock, Number(qty || 1)));
    await add(product._id, q);
  };

  const onBuyNow = async () => {
    setError("");
    if (!requireLogin()) return;
    if (!product?._id) return setError("Product not found");
    if (!inStock) return setError("Out of stock");

    // ✅ optional: also animate on buy now
    flyToCart(imgRef.current);

    const pid = String(product._id);

    await add(pid, 1);
    await refresh();
    selectOnly(pid);
    router.push("/user/dashboard/checkout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <ConfirmDialog
  open={loginOpen}
  onOpenChange={setLoginOpen}
  title="Login required"
  description="You need to sign in to continue."
  confirmText="Go to login"
  cancelText="Not now"
  onConfirm={() => {
    setLoginOpen(false);
    router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }}
/>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-6">
            <div className="text-sm text-slate-500">
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>{" "}
              / <span className="text-slate-700">{slug || "Product"}</span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <h1 className="text-3xl font-bold text-slate-900">Product Details</h1>
              <Button variant="outline" className="border-slate-300" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <Card className="rounded-2xl p-6">
              <div className="text-slate-600">Loading...</div>
            </Card>
          ) : !product ? (
            <Card className="rounded-2xl p-6">
              <div className="text-slate-600">Product not found.</div>
              <div className="mt-4">
                <Link href="/shop">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">Back to shop</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Images */}
              <div className="lg:col-span-6">
                <Card className="rounded-2xl p-5">
                  <div className="relative w-full h-[380px] rounded-2xl overflow-hidden bg-slate-50">
                    <img
                      ref={imgRef} // ✅ this is the source for animation
                      src={productImageUrl(firstImage)}
                      alt={product?.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {images.length > 1 ? (
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {images.slice(0, 5).map((img: string, idx: number) => (
                        <div key={idx} className="relative h-16 rounded-xl border bg-white overflow-hidden">
                          <img src={productImageUrl(img)} alt={`Image ${idx + 1}`} className="h-full w-full object-contain" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Card>
              </div>

              {/* Info */}
              <div className="lg:col-span-6 space-y-4">
                <Card className="rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500">{product?.category?.name || "Uncategorized"}</div>
                      <h2 className="mt-1 text-2xl font-bold text-slate-900">{product?.name}</h2>
                      <div className="mt-2 text-xs text-slate-500">SKU: {product?.sku || "-"}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {hasDiscount ? (
                        <>
                          <div className="text-lg font-extrabold text-green-700">{money(displayPrice)}</div>
                          <div className="text-xs text-slate-500 line-through">{money(product?.price)}</div>
                        </>
                      ) : (
                        <div className="text-lg font-extrabold text-green-700">{money(product?.price)}</div>
                      )}

                      <div className="flex gap-2">
                        {low && (
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
                            Low stock
                          </span>
                        )}
                        {!inStock && (
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold">
                            Out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {String(product?.description || "").trim() || "No description provided."}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Stock: <b className="text-slate-900">{stock}</b>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Qty</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, stock)}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-20 h-10 rounded-xl border px-3 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 border-2 border-slate-800 bg-white text-slate-900 font-extrabold tracking-wide hover:bg-slate-50"
                      disabled={!inStock}
                      onClick={onAddToCart}
                    >
                      ADD TO CART
                    </Button>

                    <Button
                      type="button"
                      className="w-full h-12 bg-green-800 hover:bg-green-800 text-white font-extrabold tracking-wide"
                      disabled={!inStock}
                      onClick={onBuyNow}
                    >
                      BUY IT NOW
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border border-slate-800 bg-white text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        if (!requireLogin()) return;
                        router.push("/user/dashboard/cart");
                      }}
                    >
                      Go to cart
                    </Button>
                  </div>
                </Card>

                <Card className="rounded-2xl p-6">
                  <div className="font-semibold text-slate-900">Delivery & Returns</div>
                  <ul className="mt-2 text-sm text-slate-600 space-y-1 list-disc pl-5">
                    <li>Delivery fee is calculated at checkout based on admin settings.</li>
                    <li>Online payments: Khalti / eSewa (if enabled).</li>
                    <li>Return policy depends on item category and condition.</li>
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}