import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quantizeLocationTo20MeterGrid } from "./location-buckets";
import { fetchReverseGeocodeProviderPayload } from "./reverse-geocode-provider";

const LOOKUP_CELL = quantizeLocationTo20MeterGrid({
  latitude: 37.5665,
  longitude: 126.978,
});

describe("Kakao reverse geocode provider", () => {
  beforeEach(() => {
    process.env.KAKAO_REST_API_KEY = "test-kakao-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.KAKAO_REST_API_KEY;
  });

  it("selects the H document and preserves its ten-digit code", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          documents: [
            {
              region_type: "B",
              region_3depth_name: "청운동",
              code: "1111010100",
            },
            {
              region_type: "H",
              address_name: "서울특별시 종로구 청운효자동",
              region_1depth_name: "서울특별시",
              region_2depth_name: "종로구",
              region_3depth_name: "청운효자동",
              code: "1111051500",
            },
          ],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchReverseGeocodeProviderPayload(LOOKUP_CELL),
    ).resolves.toMatchObject({
      countryCode: "kr",
      directAdministrativeDongCode: "1111051500",
      directAdministrativeDongName: "청운효자동",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: "dapi.kakao.com",
      }),
      expect.objectContaining({
        headers: { Authorization: "KakaoAK test-kakao-key" },
      }),
    );
  });

  it.each([
    [401, "AUTHENTICATION"],
    [429, "QUOTA"],
    [503, "UNAVAILABLE"],
  ])("maps Kakao status %i to %s", async (status, code) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status })),
    );

    await expect(
      fetchReverseGeocodeProviderPayload(LOOKUP_CELL),
    ).rejects.toMatchObject({ code });
  });

  it("rejects missing H documents without a provider fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            documents: [{ region_type: "B", code: "1111010100" }],
          }),
        ),
      ),
    );

    await expect(
      fetchReverseGeocodeProviderPayload(LOOKUP_CELL),
    ).rejects.toMatchObject({
      code: "OUTSIDE_SERVICE_AREA",
    });
  });
});
