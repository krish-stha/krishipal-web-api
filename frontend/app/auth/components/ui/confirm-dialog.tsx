"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/auth/components/ui/alert-dialog";

import { cn } from "@/lib/utlis";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: React.ReactNode;
  description?: React.ReactNode;

  confirmText?: string;
  cancelText?: string;

  destructive?: boolean;
  loading?: boolean;
  disabled?: boolean;

  onConfirm: () => void | Promise<void>;

  /** optional: control width / styling */
  contentClassName?: string;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  loading = false,
  disabled = false,
  onConfirm,
  contentClassName,
}: ConfirmDialogProps) {
  const isDisabled = disabled || loading;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("rounded-2xl", contentClassName)}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-semibold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-slate-600">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isDisabled}
            className="rounded-xl"
          >
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={isDisabled}
            className={cn(
              "rounded-xl text-white",
              destructive
                ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
                : "bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
            )}
            onClick={(e) => {
              // Prevent dialog auto-close until parent decides via open state.
              e.preventDefault();
              void onConfirm();
            }}
          >
            {loading ? "Please wait..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}