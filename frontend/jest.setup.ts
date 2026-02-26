import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

afterEach(() => {
  jest.clearAllMocks();
});

// ✅ prevents common Next/JSDOM failures
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;