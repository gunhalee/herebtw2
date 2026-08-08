import type { LocationSource } from "./location-resolution-token";

type ComposeLocationDisplayNameInput = {
  browserAdministrativeDongName?: string | null;
  manualAdministrativeAreaName?: string | null;
};

export function getComposeLocationDisplayName({
  browserAdministrativeDongName,
  manualAdministrativeAreaName,
}: ComposeLocationDisplayNameInput) {
  return (
    manualAdministrativeAreaName?.trim() ||
    browserAdministrativeDongName?.trim() ||
    null
  );
}

export function shouldShowComposeLocationChange(
  locationSource: LocationSource,
) {
  return locationSource === "manual";
}
