"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { publicGetBlogBySlug } from "@/lib/api/public/blog";

type Blog = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImage?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function BlogDetailPage() {
  const params = useParams();
  const slug = String(params?.slug ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blog, setBlog] = useState<Blog | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!slug) return;
      setLoading(true);
      setError("");
      try {
        const res = await publicGetBlogBySlug(slug);
        const data = res?.data ?? res;
        setBlog(data?.data ?? data ?? null);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Blog not found");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {loading ? (
          <div className="container mx-auto px-4 py-12 text-slate-500">Loading...</div>
        ) : error ? (
          <div className="container mx-auto px-4 py-12">
            <div className="rounded-2xl border bg-red-50 p-6 text-red-700">{error}</div>
            <Link href="/user/dashboard/blogs" className="inline-block mt-4 text-green-700 font-semibold">
              ← Back to Blogs
            </Link>
          </div>
        ) : !blog ? (
          <div className="container mx-auto px-4 py-12 text-slate-500">No data</div>
        ) : (
          <>
            {/* Hero */}
            <section className="border-b bg-slate-50">
              <div className="container mx-auto px-4 py-10">
                <Link href="/user/dashboard/blogs" className="text-sm font-semibold text-green-700">
                  ← Back to Blogs
                </Link>

                <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                  {blog.title}
                </h1>

                <p className="mt-4 max-w-3xl text-slate-600">
                  {blog.excerpt}
                </p>

                <div className="mt-4 text-sm text-slate-500">
                  {blog.createdAt ? new Date(blog.createdAt).toDateString() : ""}
                </div>
              </div>

              {/* Cover */}
              <div className="container mx-auto px-4 pb-10">
                <div className="rounded-3xl overflow-hidden border bg-white">
                  <div className="aspect-[16/7] bg-slate-100">
                    {blog.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/public/uploads/blogs/${blog.coverImage}`}
                        alt={blog.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                        No cover image
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Content */}
            <section className="container mx-auto px-4 py-12">
              <article className="max-w-3xl mx-auto">
                <div className="prose prose-slate max-w-none">
                  {/* For now: render as plain text with line breaks.
                      Later: you can store HTML/Markdown and render safely. */}
                  {String(blog.content || "")
                    .split("\n")
                    .map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                </div>

                <div className="mt-10 border-t pt-6 text-sm text-slate-500">
                  Updated: {blog.updatedAt ? new Date(blog.updatedAt).toLocaleString() : "-"}
                </div>
              </article>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}