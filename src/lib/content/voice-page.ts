import { formatAdministrativeAreaNameForHomeDisplay } from "../geo/format-administrative-area";

/** 공유 링크·포토카드 상단 배너 문구 */
export function voicePageCandidateHeaderLine(administrativeDongName: string) {
  const place =
    formatAdministrativeAreaNameForHomeDisplay(administrativeDongName).trim() ||
    administrativeDongName.trim();
  return `후보님, ${place}인데요`;
}
