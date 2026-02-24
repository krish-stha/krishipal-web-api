"use client";

import { useEffect } from "react";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Confirm",
  description = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <Card className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <div className="mt-2 text-sm text-slate-600">{description}</div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-slate-300"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>

            <Button
              className={
                danger
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Please wait..." : confirmText}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}