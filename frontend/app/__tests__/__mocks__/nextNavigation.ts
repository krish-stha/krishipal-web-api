export const mockPush = jest.fn();
export const mockReplace = jest.fn();
export const mockBack = jest.fn();
export const mockRefresh = jest.fn();

// Make searchParams controllable from tests:
let nextValue: string | null = null;

export function __setNextParam(value: string | null) {
  nextValue = value;
}

export const useRouter = () => ({
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  refresh: mockRefresh,
  prefetch: jest.fn(),
});

export const usePathname = () => "/";
export const useParams = () => ({});

export const useSearchParams = () => ({
  get: (key: string) => {
    if (key === "next") return nextValue;
    return null;
  },
  toString: () => (nextValue ? `next=${encodeURIComponent(nextValue)}` : ""),
});