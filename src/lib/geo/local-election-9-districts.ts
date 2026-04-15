import electionDistrictData from "./data/local-election-9-dong-districts.json";

type LocalElection9ByCodeEntry = {
  administrativeDongName: string;
  regionLookupKey: string;
  metroCouncilDistrict: string | null;
  localCouncilDistrict: string | null;
};

type LocalElection9Payload = {
  byAdministrativeDongCode: Record<string, LocalElection9ByCodeEntry>;
};

const payload = electionDistrictData as LocalElection9Payload;

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
