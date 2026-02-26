import { toSlug } from "../../../utils/slug";

describe("toSlug", () => {
  it("converts text to lowercase hyphenated slug", () => {
    expect(toSlug("Hello World")).toBe("hello-world");
  });

  it("removes symbols and collapses spaces/dashes", () => {
    expect(toSlug("  KrishiPal!!!  Smart   Seeds---  ")).toBe("krishipal-smart-seeds-");
  });

  it("handles numbers", () => {
    expect(toSlug("Product 123")).toBe("product-123");
  });
});