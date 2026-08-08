import { describe, expect, it } from "vitest";
import {
  getComposeLocationDisplayName,
  shouldShowComposeLocationChange,
} from "./compose-location-presentation";

describe("compose location presentation", () => {
  it("uses the concise administrative unit in the compose title", () => {
    expect(
      getComposeLocationDisplayName({
        browserAdministrativeDongName: "성수1가1동",
      }),
    ).toBe("성수1가1동");
    expect(
      getComposeLocationDisplayName({
        browserAdministrativeDongName: "성수1가1동",
        manualAdministrativeAreaName: "강남구",
      }),
    ).toBe("강남구");
  });

  it("offers region changes only for a manual selection", () => {
    expect(shouldShowComposeLocationChange("browser")).toBe(false);
    expect(shouldShowComposeLocationChange("manual")).toBe(true);
  });
});
