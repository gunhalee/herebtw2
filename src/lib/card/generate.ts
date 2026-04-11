import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { ReactNode } from "react";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

type CardFontData = {
  regular: ArrayBuffer;
  bold: ArrayBuffer;
};

function extractFontUrlFromGoogleCss(css: string) {
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  return match?.[1] ?? null;
}

async function loadGoogleFontByWeight(weight: 400 | 700) {
  const response = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&display=swap`,
  );

  if (!response.ok) {
    return null;
  }

  const css = await response.text();
  const fontUrl = extractFontUrlFromGoogleCss(css);

  if (!fontUrl) {
    return null;
  }

  const fontResponse = await fetch(fontUrl);
  if (!fontResponse.ok) {
    return null;
  }

  return fontResponse.arrayBuffer();
}

async function loadFallbackPretendardByWeight(weight: 400 | 700) {
  const fileName = weight === 700 ? "Pretendard-Bold.woff" : "Pretendard-Regular.woff";
  const response = await fetch(
    `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/${fileName}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load fallback font: ${fileName}`);
  }

  return response.arrayBuffer();
}

async function loadFonts(): Promise<CardFontData> {
  const [googleRegular, googleBold] = await Promise.all([
    loadGoogleFontByWeight(400),
    loadGoogleFontByWeight(700),
  ]);

  if (googleRegular && googleBold) {
    return {
      regular: googleRegular,
      bold: googleBold,
    };
  }

  const [fallbackRegular, fallbackBold] = await Promise.all([
    loadFallbackPretendardByWeight(400),
    loadFallbackPretendardByWeight(700),
  ]);

  return {
    regular: fallbackRegular,
    bold: fallbackBold,
  };
}

let cachedFonts: CardFontData | null = null;

async function getFonts(): Promise<CardFontData> {
  if (!cachedFonts) {
    cachedFonts = await loadFonts();
  }

  return cachedFonts;
}

export async function generateCardPng(element: ReactNode): Promise<Buffer> {
  const fonts = await getFonts();

  const svg = await satori(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      {
        name: "NotoSansKR",
        data: fonts.regular,
        weight: 400,
        style: "normal",
      },
      {
        name: "NotoSansKR",
        data: fonts.bold,
        weight: 700,
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
