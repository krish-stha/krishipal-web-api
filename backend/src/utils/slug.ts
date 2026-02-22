export function toSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // remove symbols
    .replace(/\s+/g, "-")          // spaces -> -
    .replace(/-+/g, "-");          // collapse ---
}
