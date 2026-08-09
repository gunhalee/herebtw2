import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");

function readEnv() {
  const result = {};
  for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const separator = line.indexOf("=");
    result[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return result;
}

const env = readEnv();
const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;
if (!baseUrl || !secret) throw new Error("Supabase server configuration is missing.");

const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
};

async function request(route, init = {}) {
  const response = await fetch(`${baseUrl}/rest/v1/${route}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
  if (!response.ok) throw new Error(`${route}: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const administrativeMap = JSON.parse(
  fs.readFileSync(path.join(root, "src/lib/geo/data/administrative-dong-map.json"), "utf8"),
);
const electionMap = JSON.parse(
  fs.readFileSync(path.join(root, "src/lib/geo/data/local-election-9-dong-districts.json"), "utf8"),
);

const areaByCode = new Map();
for (const [lookupKey, value] of Object.entries(administrativeMap.administrativeByRegionAndName)) {
  const [code, name] = value;
  if (!/^\d{10}$/.test(code)) continue;
  const [provinceName, districtName] = lookupKey.split("|");
  const level = code.endsWith("00000000") ? "province" : code.endsWith("00000") ? "district" : "dong";
  const parentCode = level === "province" ? null : level === "district" ? `${code.slice(0, 2)}00000000` : `${code.slice(0, 5)}00000`;
  areaByCode.set(code, { code, name, level, parent_code: parentCode, source: "data_go_kr+kakao_h_code", provinceName, districtName });
}

const provinceAliases = new Map([
  ["서울", "서울특별시"], ["부산", "부산광역시"], ["대구", "대구광역시"],
  ["인천", "인천광역시"], ["광주", "광주광역시"], ["대전", "대전광역시"],
  ["울산", "울산광역시"], ["세종", "세종특별자치시"], ["경기", "경기도"],
  ["강원", "강원특별자치도"], ["충북", "충청북도"], ["충남", "충청남도"],
  ["전북", "전북특별자치도"], ["전남", "전라남도"], ["경북", "경상북도"],
  ["경남", "경상남도"], ["제주", "제주특별자치도"],
]);

function resolveCandidate(candidate) {
  const electionField = candidate.local_council_district || candidate.metro_council_district;
  if (electionField) {
    const key = candidate.local_council_district ? "localCouncilDistrict" : "metroCouncilDistrict";
    const codes = Object.entries(electionMap.byAdministrativeDongCode)
      .filter(([, value]) => value[key] === electionField)
      .map(([code]) => code)
      .filter((code) => areaByCode.has(code));
    if (codes.length > 0) {
      return { areaCodes: [...new Set(codes)].sort(), coverageType: "election_district_member" };
    }
  }

  const district = candidate.district?.trim();
  const fullProvince = provinceAliases.get(district) || district;
  const province = [...areaByCode.values()].find(
    (area) => area.level === "province" && (area.name === fullProvince || area.provinceName === district),
  );
  if (province) return { areaCodes: [province.code], coverageType: "province" };

  const districts = [...areaByCode.values()].filter(
    (area) => area.level === "district" && (area.name === district || area.districtName === district),
  );
  if (districts.length === 1) {
    return { areaCodes: [districts[0].code], coverageType: "district" };
  }
  return null;
}

function requiredAreaRows(areaCodes) {
  const codes = new Set();
  for (const code of areaCodes) {
    codes.add(code);
    codes.add(`${code.slice(0, 2)}00000000`);
    if (!code.endsWith("00000000")) codes.add(`${code.slice(0, 5)}00000`);
  }
  return [...codes].map((code) => areaByCode.get(code)).filter(Boolean).map(({ provinceName: _p, districtName: _d, ...area }) => area);
}

function closureRows(areaCodes) {
  const rows = new Map();
  for (const code of areaCodes) {
    const area = areaByCode.get(code);
    if (!area) continue;
    const province = `${code.slice(0, 2)}00000000`;
    const district = `${code.slice(0, 5)}00000`;
    const candidates = [[code, code, 0]];
    if (area.level === "district") candidates.push([province, code, 1]);
    if (area.level === "dong") candidates.push([district, code, 1], [province, code, 2]);
    for (const [ancestor_code, descendant_code, depth] of candidates) {
      rows.set(`${ancestor_code}:${descendant_code}`, { ancestor_code, descendant_code, depth });
    }
  }
  return [...rows.values()];
}

const candidates = await request("candidates?select=id,name,district,metro_council_district,local_council_district,council_type,is_active&is_active=eq.true");
const resolved = candidates.map((candidate) => ({ candidate, coverage: resolveCandidate(candidate) }));
console.log(JSON.stringify(resolved.map(({ candidate, coverage }) => ({ candidateId: candidate.id, name: candidate.name, district: candidate.district, coverage })), null, 2));

const unresolved = resolved.filter((item) => !item.coverage);
if (unresolved.length > 0) {
  throw new Error(`${unresolved.length} active candidate coverage mappings are unresolved; no changes applied.`);
}
if (!apply) {
  console.log("Dry run only. Re-run with --apply after reviewing every mapping.");
} else {
  for (const { candidate, coverage } of resolved) {
    const areas = requiredAreaRows(coverage.areaCodes);
    await request("administrative_areas?on_conflict=code", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(areas),
    });
    await request("administrative_area_closure?on_conflict=ancestor_code,descendant_code", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(closureRows(areas.map((area) => area.code))),
    });
    const result = await request("rpc/replace_candidate_coverage", {
      method: "POST",
      body: JSON.stringify({
        p_candidate_id: candidate.id,
        p_area_codes: coverage.areaCodes,
        p_coverage_type: coverage.coverageType,
        p_source: electionMap.meta?.electionNameKo || "operator_mapping",
      }),
    });
    console.log(candidate.name, result);
  }
}
