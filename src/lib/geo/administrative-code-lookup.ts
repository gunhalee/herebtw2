/**
 * Korean administrative code → region name lookup
 *
 * dong_code format: 10-digit string (e.g. "1114010500")
 *   - chars 0-1: 시도 code (e.g. "11" = 서울특별시)
 *   - chars 0-4: 시군구 code (e.g. "11140" = 중구)
 *
 * Candidates store district as free-text (e.g. "중구", "서울시").
 * matchCandidateTier checks whether the candidate's district text
 * matches the user's 구 (tier 1) or 시/도 (tier 2).
 */

// 시도 (2-digit code) → display name variants a candidate might type
const SIDO_LOOKUP: Record<string, string[]> = {
  "11": ["서울", "서울시", "서울특별시"],
  "26": ["부산", "부산시", "부산광역시"],
  "27": ["대구", "대구시", "대구광역시"],
  "28": ["인천", "인천시", "인천광역시"],
  "29": ["광주", "광주시", "광주광역시"],
  "30": ["대전", "대전시", "대전광역시"],
  "31": ["울산", "울산시", "울산광역시"],
  "36": ["세종", "세종시", "세종특별자치시"],
  "41": ["경기", "경기도"],
  "42": ["강원", "강원도", "강원특별자치도"],
  "43": ["충북", "충청북도"],
  "44": ["충남", "충청남도"],
  "45": ["전북", "전라북도", "전북특별자치도"],
  "46": ["전남", "전라남도"],
  "47": ["경북", "경상북도"],
  "48": ["경남", "경상남도"],
  "50": ["제주", "제주도", "제주특별자치도"],
};

// 시군구 (5-digit code) → 구/시/군 name
const SIGUNGU_LOOKUP: Record<string, string> = {
  // 서울특별시 25구
  "11110": "종로구",
  "11140": "중구",
  "11170": "용산구",
  "11200": "성동구",
  "11215": "광진구",
  "11230": "동대문구",
  "11260": "중랑구",
  "11290": "성북구",
  "11305": "강북구",
  "11320": "도봉구",
  "11350": "노원구",
  "11380": "은평구",
  "11410": "서대문구",
  "11440": "마포구",
  "11470": "양천구",
  "11500": "강서구",
  "11530": "구로구",
  "11545": "금천구",
  "11560": "영등포구",
  "11590": "동작구",
  "11620": "관악구",
  "11650": "서초구",
  "11680": "강남구",
  "11710": "송파구",
  "11740": "강동구",
  // 부산광역시
  "26110": "중구",
  "26140": "서구",
  "26170": "동구",
  "26200": "영도구",
  "26230": "부산진구",
  "26260": "동래구",
  "26290": "남구",
  "26320": "북구",
  "26350": "해운대구",
  "26380": "사하구",
  "26410": "금정구",
  "26440": "강서구",
  "26470": "연제구",
  "26500": "수영구",
  "26530": "사상구",
  "26710": "기장군",
  // 대구광역시
  "27110": "중구",
  "27140": "동구",
  "27170": "서구",
  "27200": "남구",
  "27230": "북구",
  "27260": "수성구",
  "27290": "달서구",
  "27710": "달성군",
  // 인천광역시
  "28110": "중구",
  "28140": "동구",
  "28177": "미추홀구",
  "28185": "연수구",
  "28200": "남동구",
  "28237": "부평구",
  "28245": "계양구",
  "28260": "서구",
  "28710": "강화군",
  "28720": "옹진군",
  // 경기도 주요 시
  "41111": "수원시",
  "41130": "성남시",
  "41150": "의정부시",
  "41170": "안양시",
  "41190": "부천시",
  "41210": "광명시",
  "41220": "평택시",
  "41250": "동두천시",
  "41270": "안산시",
  "41280": "고양시",
  "41290": "과천시",
  "41310": "구리시",
  "41360": "남양주시",
  "41370": "오산시",
  "41390": "시흥시",
  "41410": "군포시",
  "41430": "의왕시",
  "41450": "하남시",
  "41460": "용인시",
  "41480": "파주시",
  "41500": "이천시",
  "41550": "안성시",
  "41570": "김포시",
  "41590": "화성시",
  "41610": "광주시",
  "41630": "양주시",
  "41650": "포천시",
  "41670": "여주시",
};

export type CandidateTier = 1 | 2 | 3;

/**
 * Returns the tier for a candidate based on their district vs the user's dong code.
 * Tier 1 = same 구/시군구
 * Tier 2 = same 시/도
 * Tier 3 = other
 */
export function matchCandidateTier(
  candidateDistrict: string,
  dongCode: string | null,
): CandidateTier {
  if (!dongCode || dongCode.length < 2) return 3;

  const district = candidateDistrict.trim();
  const sidoCode = dongCode.slice(0, 2);
  const sigunguCode = dongCode.slice(0, 5);

  // Tier 1: 구 match
  const sigunguName = SIGUNGU_LOOKUP[sigunguCode];
  if (sigunguName && district === sigunguName) return 1;

  // Tier 2: 시/도 match
  const sidoNames = SIDO_LOOKUP[sidoCode] ?? [];
  if (sidoNames.some((name) => district === name || district.startsWith(name))) return 2;

  return 3;
}

export function getSidoName(dongCode: string | null): string | null {
  if (!dongCode || dongCode.length < 2) return null;
  const names = SIDO_LOOKUP[dongCode.slice(0, 2)];
  return names?.[0] ?? null;
}

export function getSigunguName(dongCode: string | null): string | null {
  if (!dongCode || dongCode.length < 5) return null;
  return SIGUNGU_LOOKUP[dongCode.slice(0, 5)] ?? null;
}
