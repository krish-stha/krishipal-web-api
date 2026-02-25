"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmContextValue = {
  confirm: (opts?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [opts, setOpts] = useState<Required<ConfirmOptions>>({
    title: "Confirm",
    description: "Are you sure?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    danger: false,
  });

  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((o?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOpts({
        title: o?.title ?? "Confirm",
        description: o?.description ?? "Are you sure?",
        confirmText: o?.confirmText ?? "Confirm",
        cancelText: o?.cancelText ?? "Cancel",
        danger: Boolean(o?.danger),
      });
      setResolver(() => resolve);
      setOpen(true);
    });
  }, []);

  const close = useCallback((val: boolean) => {
    setOpen(false);
    setLoading(false);
    resolver?.(val);
    setResolver(null);
  }, [resolver]);

  // ESC close
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {/* Dialog */}
      {open ? (
        <div className="fixed inset-0 z-[9999]">
          {/* overlay */}
          <div className="absolute inset-0 bg-black/50" onClick={() => !loading && close(false)} />

          {/* modal */}
          <div className="absolute inset-0 grid place-items-center p-4">
            <Card className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="text-lg font-semibold text-slate-900">{opts.title}</div>
              <div className="mt-2 text-sm text-slate-600">{opts.description}</div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-slate-300"
                  onClick={() => close(false)}
                  disabled={loading}
                >
                  {opts.cancelText}
                </Button>

                <Button
                  className={
                    opts.danger
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }
                  onClick={async () => {
                    // if you ever want async confirm later, you already have loading here
                    setLoading(true);
                    close(true);
                  }}
                  disabled={loading}
                >
                  {loading ? "Please wait..." : opts.confirmText}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider />");
  return ctx.confirm;
}