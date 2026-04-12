import { hasSupabaseServerConfig } from "../supabase/config";
import { supabaseSelect } from "../supabase/rest";
import { resolveLocalElection9DistrictsByAdministrativeCode } from "../geo/local-election-9-districts";

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

const BASE_SELECT =
  "id,name,district,photo_url,first_message_id,metro_council_district,local_council_district,council_type";

const ORDER: Record<CandidateMatchType, number> = { local: 0, metro: 1, other: 2 };

export async function loadCandidateMessages(dongCode: string | null): Promise<{
  candidates: CandidateMessage[];
  userDistricts: UserDistricts;
}> {
  if (!hasSupabaseServerConfig()) {
    return { candidates: [], userDistricts: null };
  }

  const resolved = dongCode
    ? resolveLocalElection9DistrictsByAdministrativeCode(dongCode)
    : null;

  const metroDistrict = resolved?.metroCouncilDistrict ?? null;
  const localDistrict = resolved?.localCouncilDistrict ?? null;

  let candidateRows: CandidateRow[] | null = null;

  if (localDistrict || metroDistrict) {
    const orParts: string[] = [];
    if (localDistrict) {
      orParts.push(`local_council_district.eq.${encodeURIComponent(localDistrict)}`);
    }
    if (metroDistrict) {
      orParts.push(`metro_council_district.eq.${encodeURIComponent(metroDistrict)}`);
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
        ? { metroCouncilDistrict: metroDistrict, localCouncilDistrict: localDistrict }
        : null,
    };
  }

  const postIds = candidateRows.map((c) => c.first_message_id).join(",");
  const postRows = await supabaseSelect<PostRow[]>(
    `posts?select=id,content,public_uuid&id=in.(${postIds})`,
  );
  const postMap = new Map((postRows ?? []).map((p) => [p.id, p]));

  const candidates = candidateRows
    .map((c) => {
      const post = postMap.get(c.first_message_id);
      if (!post) return null;

      let matchType: CandidateMatchType = "other";
      if (localDistrict && c.local_council_district === localDistrict) {
        matchType = "local";
      } else if (metroDistrict && c.metro_council_district === metroDistrict) {
        matchType = "metro";
      }

      return {
        id: c.id,
        name: c.name,
        district: c.district,
        photoUrl: c.photo_url ?? null,
        firstMessageContent: post.content,
        firstMessagePublicUuid: post.public_uuid,
        metroCouncilDistrict: c.metro_council_district ?? null,
        localCouncilDistrict: c.local_council_district ?? null,
        councilType: c.council_type ?? null,
        matchType,
      };
    })
    .filter((c): c is CandidateMessage => c !== null);

  candidates.sort((a, b) => ORDER[a.matchType] - ORDER[b.matchType]);

  return {
    candidates,
    userDistricts: resolved
      ? { metroCouncilDistrict: metroDistrict, localCouncilDistrict: localDistrict }
      : null,
  };
}
