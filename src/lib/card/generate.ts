import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { ReactNode } from "react";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

async function loadFont(): Promise<ArrayBuffer> {
  // Use Google Fonts API for Noto Sans KR
  const response = await fetch(
    "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap",
  );
  const css = await response.text();
  const fontUrlMatch = css.match(/src:\s*url\(([^)]+)\)/);

  if (fontUrlMatch) {
    const fontResponse = await fetch(fontUrlMatch[1]);
    return fontResponse.arrayBuffer();
  }

  // Fallback: use a simple font
  const fallback = await fetch(
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Regular.woff",
  );
  return fallback.arrayBuffer();
}

let cachedFont: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (!cachedFont) {
    cachedFont = await loadFont();
  }
  return cachedFont;
}

export async function generateCardPng(element: ReactNode): Promise<Buffer> {
  const fontData = await getFont();

  const svg = await satori(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      {
        name: "NotoSansKR",
        data: fontData,
        weight: 400,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: CARD_WIDTH },
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

export { CARD_WIDTH, CARD_HEIGHT };
