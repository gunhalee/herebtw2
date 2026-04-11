/** satori `<img>`용 — `src/components/checkmark.svg`와 동일 스트로크·패스 */
const CHECKMARK_SVG_URI = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><g fill="none" stroke="#ffed00" stroke-linecap="square" stroke-linejoin="miter" transform="translate(12 12) rotate(-20) translate(-12 -12)"><path stroke-width="1.65" d="M6 5.8h9.8l1.4 9.1 -6.9 3.6L5.4 15.4 6 5.8z"/><path stroke-width="1.65" d="M12.3 18.5l6.9 -3.6 -1.8 4.9 -5.1 -1.3z"/><path stroke-width="2.05" d="M8.4 10.6l2.3 2.5 5.2 -5.8"/></g></svg>',
);

export const checkmarkCardImgSrc = `data:image/svg+xml;charset=utf-8,${CHECKMARK_SVG_URI}`;
