import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  openCurrentPageInAndroidChrome,
  openCurrentPageInNewWindow,
  openCurrentPageSecurely,
  reloadCurrentPage,
} from "./browser-external-navigation";
import {
  clearBrowserLocationRecoveryAttempt,
  hasBrowserLocationRecoveryAttempt,
  runBrowserLocationRetryAction,
} from "./browser-location-recovery";

vi.mock("./browser-external-navigation", () => ({
  openCurrentPageInAndroidChrome: vi.fn(),
  openCurrentPageInNewWindow: vi.fn(),
  openCurrentPageSecurely: vi.fn(),
  reloadCurrentPage: vi.fn(),
}));

describe("browser location recovery action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reloads the document for denied-permission recovery", () => {
    const continueRetry = vi.fn();

    runBrowserLocationRetryAction("reload", continueRetry);

    expect(reloadCurrentPage).toHaveBeenCalledOnce();
    expect(continueRetry).not.toHaveBeenCalled();
  });

  it("opens structural recovery targets directly", () => {
    const continueRetry = vi.fn();

    runBrowserLocationRetryAction("external-browser", continueRetry);
    runBrowserLocationRetryAction("new-window", continueRetry);
    runBrowserLocationRetryAction("secure-page", continueRetry);

    expect(openCurrentPageInAndroidChrome).toHaveBeenCalledOnce();
    expect(openCurrentPageInNewWindow).toHaveBeenCalledOnce();
    expect(openCurrentPageSecurely).toHaveBeenCalledOnce();
    expect(continueRetry).not.toHaveBeenCalled();
  });

  it("continues only sensor and administrative retries in the app", () => {
    const continueRetry = vi.fn();

    runBrowserLocationRetryAction("fresh-location", continueRetry);
    runBrowserLocationRetryAction("resolve-location", continueRetry);

    expect(continueRetry).toHaveBeenNthCalledWith(1, "fresh-location");
    expect(continueRetry).toHaveBeenNthCalledWith(2, "resolve-location");
  });

  it("remembers navigation recovery across a same-tab reload", () => {
    const values = new Map<string, string>();
    const sessionStorage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      removeItem: vi.fn((key: string) => values.delete(key)),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    };
    vi.stubGlobal("window", { sessionStorage });

    runBrowserLocationRetryAction("reload", vi.fn());

    expect(hasBrowserLocationRecoveryAttempt()).toBe(true);
    clearBrowserLocationRecoveryAttempt();
    expect(hasBrowserLocationRecoveryAttempt()).toBe(false);
  });

  it("uses history state when session storage is unavailable", () => {
    const history = {
      state: null as Record<string, unknown> | null,
      replaceState: vi.fn((state: Record<string, unknown>) => {
        history.state = state;
      }),
    };
    const sessionStorage = {
      getItem: vi.fn(() => {
        throw new Error("storage blocked");
      }),
      removeItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error("storage blocked");
      }),
    };
    vi.stubGlobal("window", { history, sessionStorage });

    runBrowserLocationRetryAction("reload", vi.fn());

    expect(hasBrowserLocationRecoveryAttempt()).toBe(true);
  });
});
