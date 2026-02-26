import React, { PropsWithChildren } from "react";
import { render, RenderOptions } from "@testing-library/react";

// Put app-wide providers here later (Theme, Auth, QueryClient, etc.)
function Providers({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: Providers, ...options });
}