import React from "react";
import { render, screen } from "@testing-library/react";

test("jest works", () => {
  render(<div>Hello</div>);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});