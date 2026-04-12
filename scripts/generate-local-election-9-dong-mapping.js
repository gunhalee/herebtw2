/**
 * 제9회 전국동시지방선거(2026-06-03) 기준
 * 읍·면·동 → 시·도의회 선거구(sgType 5), 구·시·군의회 선거구(sgType 6) 맵을 생성합니다.
 *
 * 데이터 원천: 공공데이터포털 「중앙선거관리위원회_선거인수 정보」 Open API
 * https://www.data.go.kr/data/15094967/openapi.do
 *
 * 사전 준비:
 * 1) 공공데이터포털에서 위 API 활용 신청 후 인증키 발급
 * 2) `.env.local` 에 DATA_GO_KR_SERVICE_KEY 설정(스크립트가 자동 로드).
 *    HTTP 401 → 인코딩/파라미터 옵션(IS_ENCODED, PARAM, FIRST).
 *    HTTP 403 → 포털 활용신청 **변경신청**·허용 IP·동기화 대기(아래 fetchJson 안내).
 *
 * 사용:
 *   node scripts/generate-local-election-9-dong-mapping.js
 *   node scripts/generate-local-election-9-dong-mapping.js 20260603
 *
 * 선거ID(sgId)는 통상 투표일(YYYYMMDD)과 같습니다. 공공데이터에 반영되지 않았다면
 * CommonCode API(getCommonSgCodeList)로 실제 sgId를 확인한 뒤 인자로 넘기세요.
 */

const fs = require("fs");
const path = require("path");

const BASE_URL =
  "https://apis.data.go.kr/9760000/ElcntInfoInqireService";

const DEFAULT_SG_ID = process.argv[2] ?? "20220601";
const SG_TYPE_METRO = "5";
const SG_TYPE_LOCAL = "6";

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "geo",
  "data",
  "local-election-9-dong-districts.json",
);

const ADMIN_MAP_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "geo",
  "data",
  "administrative-dong-map.json",
);

const SIDO_SHORT_NAMES = new Map([
  ["서울특별시", "서울"],
  ["부산광역시", "부산"],
  ["대구광역시", "대구"],
  ["인천광역시", "인천"],
  ["광주광역시", "광주"],
  ["대전광역시", "대전"],
  ["울산광역시", "울산"],
  ["세종특별자치시", "세종"],
  ["경기도", "경기"],
  ["강원특별자치도", "강원"],
  ["강원도", "강원"],
  ["충청북도", "충북"],
  ["충청남도", "충남"],
  ["전북특별자치도", "전북"],
  ["전라북도", "전북"],
  ["전라남도", "전남"],
  ["경상북도", "경북"],
  ["경상남도", "경남"],
  ["제주특별자치도", "제주"],
  ["제주도", "제주"],
]);

/** API 요청에 쓰는 시·도 정식 명칭(행안부/선관위 관례) */
const SIDO_API_NAMES = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

function shortenSidoName(sdName) {
  const t = String(sdName ?? "").replace(/\s+/g, " ").trim();
  return SIDO_SHORT_NAMES.get(t) ?? t;
}

function normalizeWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function regionIndexKey(sdName, wiwName, emdName) {
  return `${shortenSidoName(sdName)}|${normalizeWhitespace(wiwName)}|${normalizeWhitespace(emdName)}`;
}

/**
 * Next.js는 `.env.local`을 읽지만 `node scripts/...`는 읽지 않습니다.
 */
function loadEnvFromFile(filePath, options = {}) {
  const { override = false } = options;
  if (!fs.existsSync(filePath)) {
    return;
  }

  let text = fs.readFileSync(filePath, "utf8");
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnvFiles() {
  const root = process.cwd();
  loadEnvFromFile(path.join(root, ".env"), { override: false });
  loadEnvFromFile(path.join(root, ".env.local"), { override: true });
}

function getServiceKey() {
  const fromEnv = process.env.DATA_GO_KR_SERVICE_KEY;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim();
  }
  const tried = [path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")]
    .filter((p) => fs.existsSync(p))
    .join(", ");
  throw new Error(
    "DATA_GO_KR_SERVICE_KEY 가 없습니다. `.env.local` 에 설정하거나 셸에서 export 하세요." +
      (tried ? ` (찾은 파일: ${tried})` : " (.env.local / .env 없음)"),
  );
}

/** .env 에 %25 로 이중 인코딩된 키가 들어온 경우 한 단계씩 풉니다. */
function unwrapPossiblyDoubleEncodedServiceKey(rawKey) {
  let k = String(rawKey).trim();
  for (let i = 0; i < 3; i += 1) {
    if (!/%25[0-9A-Fa-f]{2}/.test(k)) {
      break;
    }
    try {
      const decoded = decodeURIComponent(k);
      if (decoded === k) {
        break;
      }
      k = decoded;
    } catch {
      break;
    }
  }
  return k;
}

/**
 * 공공데이터포털: Encoding 키(%2F 등)는 URL에 그대로, Decoding 키는 encodeURIComponent 1회.
 */
function buildServiceKeyQueryPart(serviceKey) {
  const k = unwrapPossiblyDoubleEncodedServiceKey(serviceKey);
  const forceEncoded =
    String(process.env.DATA_GO_KR_SERVICE_KEY_IS_ENCODED ?? "").trim() === "1";
  const looksPercentEncoded =
    k.includes("%") && /%[0-9A-Fa-f]{2}/.test(k);
  const useLiteralInUrl = forceEncoded || looksPercentEncoded;
  const paramName =
    String(process.env.DATA_GO_KR_SERVICE_KEY_PARAM ?? "serviceKey").trim() ||
    "serviceKey";
  const value = useLiteralInUrl ? k : encodeURIComponent(k);
  return `${paramName}=${value}`;
}

function buildUrl(operation, query) {
  const { serviceKey, ...rest } = query;
  const url = new URL(`${BASE_URL}/${operation}`);
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null) {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  const qs = url.searchParams.toString();
  const keyQs = buildServiceKeyQueryPart(serviceKey);
  const keyFirst =
    String(process.env.DATA_GO_KR_SERVICE_KEY_FIRST ?? "").trim() === "1";
  const pathUrl = `${url.origin}${url.pathname}`;
  if (!qs) {
    return `${pathUrl}?${keyQs}`;
  }
  return keyFirst ? `${pathUrl}?${keyQs}&${qs}` : `${pathUrl}?${qs}&${keyQs}`;
}

async function fetchJson(url) {
  const referer =
    String(process.env.DATA_GO_KR_HTTP_REFERER ?? "").trim() ||
    "https://www.data.go.kr/";
  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      Referer: referer,
      "User-Agent":
        "herebtw2-generate-local-election-mapping/1.0 (Node.js; data.go.kr)",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${text.slice(0, 240)}`,
    );
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`JSON 파싱 실패: ${text.slice(0, 240)}`);
  }
  return { response, data, text };
}

function isNecElcntApiSuccessResultCode(code) {
  const normalized = String(code ?? "").trim();
  if (normalized === "00") {
    return true;
  }
  // 선거인수 등 일부 API는 정상인데도 resultCode 가 INFO-00 으로 옵니다.
  if (normalized === "INFO-00") {
    return true;
  }
  // 읍면동별 등: 해당 선거·시군구에 아직 행이 없거나, sgId 미개방 시 "데이터 없음"으로 옵니다.
  if (normalized === "INFO-03") {
    return true;
  }
  return false;
}

function assertApiOk(data, context) {
  const header = data?.response?.header;
  if (!header) {
    throw new Error(`${context}: 응답에 response.header가 없습니다.`);
  }
  const code = String(header.resultCode ?? "").trim();
  if (!isNecElcntApiSuccessResultCode(code)) {
    throw new Error(
      `${context}: ${header.resultCode} ${header.resultMsg ?? ""}`.trim(),
    );
  }
}

function parseItems(data) {
  const raw = data?.response?.body?.items?.item;
  if (!raw) {
    return [];
  }
  return Array.isArray(raw) ? raw : [raw];
}

function getTotalCount(data) {
  const value = data?.response?.body?.totalCount;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function fetchAllPages(operation, baseQuery) {
  const pageSize = 1000;
  const maxPages = 500;
  const all = [];
  let pageNo = 1;

  while (true) {
    const url = buildUrl(operation, {
      ...baseQuery,
      pageNo,
      numOfRows: pageSize,
      resultType: "json",
    });
    const { data, text } = await fetchJson(url);
    try {
      assertApiOk(data, `${operation} page ${pageNo}`);
    } catch (error) {
      if (
        operation === "getGsigElcntInfoInqire" &&
        String(error.message).includes("30")
      ) {
        throw new Error(
          `${error.message}\n시도명이 API에 등록되지 않았을 수 있습니다. ` +
            `강원은 '강원특별자치도', 전북은 '전북특별자치도' 등 정식 명칭을 확인하세요.\n` +
            `원문: ${text.slice(0, 400)}`,
        );
      }
      throw error;
    }
    const items = parseItems(data);
    all.push(...items);
    const total = getTotalCount(data);
    if (items.length === 0) {
      break;
    }
    if (items.length < pageSize) {
      break;
    }
    if (total > 0 && all.length >= total) {
      break;
    }
    if (pageNo >= maxPages) {
      throw new Error(
        `${operation}: 페이지가 ${maxPages}를 넘어 중단했습니다. totalCount·응답 구조를 확인하세요.`,
      );
    }
    pageNo += 1;
  }

  return all;
}

async function listSigunguForSido(serviceKey, sgId, sgTypecode, sdName) {
  const rows = await fetchAllPages("getGsigElcntInfoInqire", {
    serviceKey,
    sgId,
    sgTypecode,
    sdName,
  });
  const names = new Set();
  for (const row of rows) {
    const w = normalizeWhitespace(row.wiwName);
    if (w) {
      names.add(w);
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b, "ko-KR"));
}

async function fetchEmdRowsForSigungu(
  serviceKey,
  sgId,
  sgTypecode,
  sdName,
  wiwName,
) {
  return fetchAllPages("getEmdElcntInfoInqire", {
    serviceKey,
    sgId,
    sgTypecode,
    sdName,
    wiwName,
  });
}

async function buildDistrictLayer(serviceKey, sgId, sgTypecode) {
  const index = new Map();

  for (const sdName of SIDO_API_NAMES) {
    let wiwNames = await listSigunguForSido(serviceKey, sgId, sgTypecode, sdName);

    if (sdName === "세종특별자치시" && wiwNames.length === 0) {
      wiwNames = ["세종특별자치시"];
    }

    for (const wiwName of wiwNames) {
      const rows = await fetchEmdRowsForSigungu(
        serviceKey,
        sgId,
        sgTypecode,
        sdName,
        wiwName,
      );
      for (const row of rows) {
        const emdName = normalizeWhitespace(row.emdName);
        if (!emdName) {
          continue;
        }
        const key = regionIndexKey(row.sdName ?? sdName, row.wiwName, emdName);
        const sggName = normalizeWhitespace(row.sggName);
        index.set(key, {
          sdName: normalizeWhitespace(row.sdName ?? sdName),
          wiwName: normalizeWhitespace(row.wiwName ?? wiwName),
          emdName,
          districtName: sggName || null,
        });
      }
    }
  }

  return index;
}

function mergeLayers(metroIndex, localIndex) {
  const keys = new Set([...metroIndex.keys(), ...localIndex.keys()]);
  const index = {};

  for (const key of Array.from(keys).sort((a, b) =>
    a.localeCompare(b, "ko-KR"),
  )) {
    const m = metroIndex.get(key);
    const l = localIndex.get(key);
    const wiwName = m?.wiwName ?? l?.wiwName ?? "";
    // 구시군의원 선거구명("나선거구" 등)은 시군구 전체에서 중복되므로
    // "{시군구명} {선거구명}" 형태로 저장해 유일성을 확보.
    const rawLocalDistrict = l?.districtName ?? null;
    const localCouncilDistrict = rawLocalDistrict
      ? `${wiwName} ${rawLocalDistrict}`
      : null;
    index[key] = {
      sdName: m?.sdName ?? l?.sdName ?? "",
      wiwName,
      emdName: m?.emdName ?? l?.emdName ?? "",
      metroCouncilDistrict: m?.districtName ?? null,
      localCouncilDistrict,
    };
  }

  return index;
}

function buildByAdministrativeDongCode(index, adminMap) {
  const byCode = {};
  const admin = adminMap?.administrativeByRegionAndName;
  if (!admin || typeof admin !== "object") {
    return byCode;
  }

  for (const [mapKey, tuple] of Object.entries(admin)) {
    if (!Array.isArray(tuple) || tuple.length < 2) {
      continue;
    }
    const code = normalizeWhitespace(tuple[0]);
    const dongName = normalizeWhitespace(tuple[1]);
    if (!code || !dongName) {
      continue;
    }
    const parts = mapKey.split("|");
    if (parts.length < 3) {
      continue;
    }
    const sidoKey = parts[0];
    const wiw = parts.slice(1, -1).join("|");
    const nameFromKey = parts[parts.length - 1];
    const tryKeys = [
      `${sidoKey}|${wiw}|${dongName}`,
      `${sidoKey}|${wiw}|${nameFromKey}`,
    ];
    let hit = null;
    for (const k of tryKeys) {
      if (index[k]) {
        hit = index[k];
        break;
      }
    }
    if (!hit) {
      continue;
    }
    byCode[code] = {
      administrativeDongName: dongName,
      regionLookupKey: tryKeys.find((k) => index[k]) ?? tryKeys[0],
      metroCouncilDistrict: hit.metroCouncilDistrict,
      localCouncilDistrict: hit.localCouncilDistrict,
    };
  }

  return byCode;
}

async function main() {
  loadLocalEnvFiles();
  const serviceKey = getServiceKey();
  console.error(`sgId=${DEFAULT_SG_ID} 선거인수 API 조회 중…`);

  const metroIndex = await buildDistrictLayer(
    serviceKey,
    DEFAULT_SG_ID,
    SG_TYPE_METRO,
  );
  console.error(`시·도의회 레이어 읍면동 행 수: ${metroIndex.size}`);

  const localIndex = await buildDistrictLayer(
    serviceKey,
    DEFAULT_SG_ID,
    SG_TYPE_LOCAL,
  );
  console.error(`구·시·군의회 레이어 읍면동 행 수: ${localIndex.size}`);

  const index = mergeLayers(metroIndex, localIndex);

  let adminMap = null;
  if (fs.existsSync(ADMIN_MAP_PATH)) {
    adminMap = JSON.parse(fs.readFileSync(ADMIN_MAP_PATH, "utf8"));
  }

  const byAdministrativeDongCode = adminMap
    ? buildByAdministrativeDongCode(index, adminMap)
    : {};

  const payload = {
    meta: {
      electionNameKo: "제9회 전국동시지방선거",
      pollDate: "2022-06-01",
      sgId: DEFAULT_SG_ID,
      sgTypecodeMetroCouncil: SG_TYPE_METRO,
      sgTypecodeLocalCouncil: SG_TYPE_LOCAL,
      sources: ["https://www.data.go.kr/data/15094967/openapi.do"],
      generatedAt: new Date().toISOString(),
      indexEntryCount: Object.keys(index).length,
      byAdministrativeDongCodeCount: Object.keys(byAdministrativeDongCode)
        .length,
      notes: [
        "선거구명·읍면동명은 선거인명부 작성·확정 과정에서 바뀔 수 있습니다. 공고 후 재생성하세요.",
        "한 행정동이 둘 이상 선거구로 나뉘는 경우, 본 API의 읍면동 단위 값만으로는 구분되지 않을 수 있습니다.",
      ],
    },
    index,
    byAdministrativeDongCode,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload)}\n`, "utf8");

  console.error(`작성 완료: ${OUTPUT_PATH}`);
  console.log(
    JSON.stringify(
      {
        outputPath: OUTPUT_PATH,
        indexEntryCount: payload.meta.indexEntryCount,
        byAdministrativeDongCodeCount:
          payload.meta.byAdministrativeDongCodeCount,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
