"use client";

export function openCurrentPageInAndroidChrome() {
  if (typeof window === "undefined" || !/Android/i.test(navigator.userAgent)) {
    return false;
  }

  const currentUrl = new URL(window.location.href);
  const scheme = currentUrl.protocol === "http:" ? "http" : "https";
  const browserFallbackUrl = encodeURIComponent(currentUrl.toString());
  const intentTarget = `${currentUrl.host}${currentUrl.pathname}${currentUrl.search}`;

  window.location.href =
    `intent://${intentTarget}#Intent;scheme=${scheme};` +
    `package=com.android.chrome;S.browser_fallback_url=${browserFallbackUrl};end`;

  return true;
}
