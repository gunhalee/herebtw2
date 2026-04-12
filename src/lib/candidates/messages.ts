import { unstable_cache } from "next/cache";
import { resolveLocalElection9DistrictsByAdministrativeCode } from "../geo/local-election-9-districts";
import { supabaseSelect } from "../supabase/rest";
import { hasSupabaseServerConfig } from "../supabase/config";

export type CandidateMatchType = "local" | "metro" | "other";

export type CandidateMessage = {
  id: string;
  name: string;
  district: string;
  photoUrl: string | null;
  firstMessageContent: string;
  firstMessagePublicUuid: string;
  metroCouncilDistrict: string | null;
  localCouncilDistrict: string | null;
  councilType: string | null;
  matchType: CandidateMatchType;
};

export type UserDistricts = {
  metroCouncilDistrict: string | null;
  localCouncilDistrict: string | null;
} | null;

type CandidateRow = {
  id: string;
  name: string;
  district: string;
  photo_url: string | null;
  first_message_id: string;
  metro_council_district: string | null;
  local_council_district: string | null;
  council_type: string | null;
};

type PostRow = {
  id: string;
  content: string;
  public_uuid: string;
};

const ALL_DISTRICTS_CACHE_KEY = "__all__";
const BASE_SELECT =
  "id,name,district,photo_url,first_message_id,metro_council_district,local_council_district,council_type";
const ORDER: Record<CandidateMatchType, number> = {
  local: 0,
  metro: 1,
  other: 2,
};

async function loadCandidateMessagesUncached(
  dongCode: string | null,
): Promise<{
  candidates: CandidateMessage[];
  userDistricts: UserDistricts;
}> {
  const resolved = dongCode
    ? resolveLocalElection9DistrictsByAdministrativeCode(dongCode)
    : null;
  const metroDistrict = resolved?.metroCouncilDistrict ?? null;
  const localDistrict = resolved?.localCouncilDistrict ?? null;

  let candidateRows: CandidateRow[] | null = null;

  if (localDistrict || metroDistrict) {
    const orParts: string[] = [];

    if (localDistrict) {
      orParts.push(
        `local_council_district.eq.${encodeURIComponent(localDistrict)}`,
      );
    }

    if (metroDistrict) {
      orParts.push(
        `metro_council_district.eq.${encodeURIComponent(metroDistrict)}`,
      );
    }

    const matchedRows = await supabaseSelect<CandidateRow[]>(
      `candidates?select=${BASE_SELECT}&first_message_id=not.is.null&or=(${orParts.join(",")})`,
    );

    candidateRows =
      matchedRows && matchedRows.length > 0
        ? matchedRows
        : await supabaseSelect<CandidateRow[]>(
            `candidates?select=${BASE_SELECT}&first_message_id=not.is.null`,
          );
  } else {
    candidateRows = await supabaseSelect<CandidateRow[]>(
      `candidates?select=${BASE_SELECT}&first_message_id=not.is.null`,
    );
  }

  if (!candidateRows || candidateRows.length === 0) {
    return {
      candidates: [],
      userDistricts: resolved
        ? {
            metroCouncilDistrict: metroDistrict,
            localCouncilDistrict: localDistrict,
          }
        : null,
    };
  }

  const postIds = candidateRows.map((candidate) => candidate.first_message_id).join(",");
  const postRows = await supabaseSelect<PostRow[]>(
    `posts?select=id,content,public_uuid&id=in.(${postIds})`,
  );
  const postMap = new Map((postRows ?? []).map((post) => [post.id, post]));

  const candidates = candidateRows
    .map((candidate) => {
      const post = postMap.get(candidate.first_message_id);
      if (!post) {
        return null;
      }

      let matchType: CandidateMatchType = "other";
      if (localDistrict && candidate.local_council_district === localDistrict) {
        matchType = "local";
      } else if (
        metroDistrict &&
        candidate.metro_council_district === metroDistrict
      ) {
        matchType = "metro";
      }

      return {
        id: candidate.id,
        name: candidate.name,
        district: candidate.district,
        photoUrl: candidate.photo_url ?? null,
        firstMessageContent: post.content,
        firstMessagePublicUuid: post.public_uuid,
        metroCouncilDistrict: candidate.metro_council_district ?? null,
        localCouncilDistrict: candidate.local_council_district ?? null,
        councilType: candidate.council_type ?? null,
        matchType,
      };
    })
    .filter((candidate): candidate is CandidateMessage => candidate !== null);

  candidates.sort((left, right) => ORDER[left.matchType] - ORDER[right.matchType]);

  return {
    candidates,
    userDistricts: resolved
      ? {
          metroCouncilDistrict: metroDistrict,
          localCouncilDistrict: localDistrict,
        }
      : null,
  };
}

const loadCachedCandidateMessages = unstable_cache(
  async (cacheDongCode: string) =>
    loadCandidateMessagesUncached(
      cacheDongCode === ALL_DISTRICTS_CACHE_KEY ? null : cacheDongCode,
    ),
  ["candidate-messages"],
  {
    revalidate: 60,
    tags: ["candidate-messages"],
  },
);

export async function loadCandidateMessages(dongCode: string | null): Promise<{
  candidates: CandidateMessage[];
  userDistricts: UserDistricts;
}> {
  if (!hasSupabaseServerConfig()) {
    return { candidates: [], userDistricts: null };
  }

  return loadCachedCandidateMessages(dongCode ?? ALL_DISTRICTS_CACHE_KEY);
}
