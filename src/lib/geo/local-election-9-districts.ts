import {
  normalizeAdministrativeDongName,
  shortenSidoName,
} from "./format-administrative-area";
import electionDistrictData from "./data/local-election-9-dong-districts.json";

export type LocalElection9DistrictIndexEntry = {
  sdName: string;
  wiwName: string;
  emdName: string;
  metroCouncilDistrict: string | null;
  localCouncilDistrict: string | null;
};

export type LocalElection9ByCodeEntry = {
  administrativeDongName: string;
  regionLookupKey: string;
  metroCouncilDistrict: string | null;
  localCouncilDistrict: string | null;
};

type LocalElection9Payload = {
  meta: {
    electionNameKo: string;
    pollDate: string;
    sgId: string;
    generatedAt: string | null;
    indexEntryCount: number;
    byAdministrativeDongCodeCount: number;
    notes?: readonly string[];
  };
  index: Record<string, LocalElection9DistrictIndexEntry>;
  byAdministrativeDongCode: Record<string, LocalElection9ByCodeEntry>;
};

const payload = electionDistrictData as LocalElection9Payload;

function createRegionLookupKeys(input: {
  sidoName: string | null | undefined;
  sigunguName: string | null | undefined;
}) {
  const shortenedSidoName = shortenSidoName(input.sidoName) ?? "";
  const sigunguName = String(input.sigunguName ?? "").replace(/\s+/g, " ").trim();

  if (!shortenedSidoName) {
    return [];
  }

  const keys = new Set<string>();
  keys.add(`${shortenedSidoName}|${sigunguName}`);

  if (sigunguName && shortenedSidoName === sigunguName) {
    keys.add(`${shortenedSidoName}|`);
  }

  return Array.from(keys);
}

function createDongNameCandidates(
  names: Array<string | null | undefined>,
): string[] {
  const out = new Set<string>();

  for (const raw of names) {
    if (!raw) {
      continue;
    }

    const spaced = raw.replace(/\s+/g, " ").trim();

    if (!spaced) {
      continue;
    }

    out.add(spaced);
    out.add(normalizeAdministrativeDongName(spaced));
  }

  return Array.from(out);
}

function buildRegionDongKey(
  regionKey: string,
  dongName: string,
): string | null {
  const parts = regionKey.split("|");
  const sidoKey = parts[0]?.trim();

  if (!sidoKey) {
    return null;
  }

  const sigungu = parts.slice(1).join("|").trim();
  const dong = dongName.trim();

  if (!dong) {
    return null;
  }

  return `${sidoKey}|${sigungu}|${dong}`;
}

/**
 * 제9회 전국동시지방선거(기본 sgId 20260603) 선거인수 API로 생성한
 * 통계청 행정동 코드(10자리) → 광역의회·기초의회 선거구명 조회.
 */
export function resolveLocalElection9DistrictsByAdministrativeCode(
  administrativeDongCode: string | null | undefined,
) {
  if (!administrativeDongCode) {
    return null;
  }

  const trimmed = administrativeDongCode.trim();

  if (!/^\d{10}$/.test(trimmed)) {
    return null;
  }

  return payload.byAdministrativeDongCode[trimmed] ?? null;
}

/**
 * 시·도(약칭 가능) + 시군구 + 읍면동 이름으로 `index` 키를 조회합니다.
 * (선거인수 API의 읍면동 명과 동일할 때만 적중합니다.)
 */
export function resolveLocalElection9DistrictsByRegion(input: {
  sidoName: string | null | undefined;
  sigunguName: string | null | undefined;
  dongNames: Array<string | null | undefined>;
}) {
  const regionKeys = createRegionLookupKeys(input);
  const dongCandidates = createDongNameCandidates(input.dongNames);

  for (const regionKey of regionKeys) {
    for (const dong of dongCandidates) {
      const fullKey = buildRegionDongKey(regionKey, dong);
      if (fullKey && payload.index[fullKey]) {
        return payload.index[fullKey];
      }
    }
  }

  return null;
}

export function getLocalElection9Meta() {
  return payload.meta;
}
