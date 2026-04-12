import { ok } from "../../../../lib/api/response";
import { hasSupabaseServerConfig } from "../../../../lib/supabase/config";
import { supabaseSelect } from "../../../../lib/supabase/rest";
import { resolveLocalElection9DistrictsByAdministrativeCode } from "../../../../lib/geo/local-election-9-districts";

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

export type CandidateMatchType = "local" | "metro" | "other";

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return ok({ candidates: [], userDistricts: null, debug: "no_config" });
  }

  const { searchParams } = new URL(request.url);
  const dongCode = searchParams.get("dongCode") ?? null;

  // 사용자 동코드 → 선거구 해석
  const userDistricts = dongCode
    ? resolveLocalElection9DistrictsByAdministrativeCode(dongCode)
    : null;

  const metroDistrict = userDistricts?.metroCouncilDistrict ?? null;
  const localDistrict = userDistricts?.localCouncilDistrict ?? null;

  try {
    let candidateRows: CandidateRow[] | null = null;
    const baseSelect =
      "id,name,district,photo_url,first_message_id,metro_council_district,local_council_district,council_type";

    if (localDistrict || metroDistrict) {
      // 내 선거구 후보 우선 조회 (OR 필터)
      const orParts: string[] = [];
      if (localDistrict) {
        orParts.push(`local_council_district.eq.${encodeURIComponent(localDistrict)}`);
      }
      if (metroDistrict) {
        orParts.push(`metro_council_district.eq.${encodeURIComponent(metroDistrict)}`);
      }

      const matchedRows = await supabaseSelect<CandidateRow[]>(
        `candidates?select=${baseSelect}&first_message_id=not.is.null&or=(${orParts.join(",")})`,
      );

      // 선거구 매칭 없는 후보도 별도 조회 (없으면 전체 표시)
      if (!matchedRows || matchedRows.length === 0) {
        candidateRows = await supabaseSelect<CandidateRow[]>(
          `candidates?select=${baseSelect}&first_message_id=not.is.null`,
        );
      } else {
        candidateRows = matchedRows;
      }
    } else {
      // 동코드 없으면 전체 반환
      candidateRows = await supabaseSelect<CandidateRow[]>(
        `candidates?select=${baseSelect}&first_message_id=not.is.null`,
      );
    }

    if (!candidateRows || candidateRows.length === 0) {
      return ok({ candidates: [], userDistricts, debug: "no_candidates" });
    }

    // 연결된 post 내용 한 번에 조회
    const postIds = candidateRows.map((c) => c.first_message_id).join(",");
    const postRows = await supabaseSelect<PostRow[]>(
      `posts?select=id,content,public_uuid&id=in.(${postIds})`,
    );
    const postMap = new Map((postRows ?? []).map((p) => [p.id, p]));

    const candidates = candidateRows
      .map((c) => {
        const post = postMap.get(c.first_message_id);
        if (!post) return null;

        // 매칭 타입 결정
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
      .filter(Boolean);

    // 정렬: local → metro → other
    const ORDER: Record<CandidateMatchType, number> = { local: 0, metro: 1, other: 2 };
    candidates.sort((a, b) => ORDER[a!.matchType] - ORDER[b!.matchType]);

    return ok({
      candidates,
      userDistricts: userDistricts
        ? {
            metroCouncilDistrict: metroDistrict,
            localCouncilDistrict: localDistrict,
          }
        : null,
      debug: `candidates:${candidateRows.length} matched:${candidates.length}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/candidates/messages] error:", message);
    return ok({ candidates: [], userDistricts: null, debug: `error: ${message}` });
  }
}
