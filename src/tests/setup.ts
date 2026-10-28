/**
 * Vitest global test setup.
 * Runs before each test file.
 */

// Polyfill for TextEncoder/TextDecoder in node/jsdom
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.TextDecoder = TextDecoder as any;

// Mock next/navigation for tests
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock next-intl for tests
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => "hi"),
  getTranslations: vi.fn(() => (key: string) => key),
}));
