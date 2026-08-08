import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeAdministrativeDongSearchQuery,
  searchAdministrativeDongs,
} from "./administrative-dong-search";

const ORIGINAL_FETCH = global.fetch;

describe("administrative dong search", () => {
  beforeEach(() => {
    process.env.KAKAO_REST_API_KEY = "test-kakao-key";
    process.env.LOCATION_RESOLUTION_TOKEN_SECRET =
      "test-location-token-secret-at-least-32-characters";
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    delete process.env.KAKAO_REST_API_KEY;
    delete process.env.LOCATION_RESOLUTION_TOKEN_SECRET;
    vi.restoreAllMocks();
  });

  it("normalizes a user query and rejects invalid lengths", () => {
    expect(normalizeAdministrativeDongSearchQuery(" 서울   삼성동 ")).toBe(
      "서울 삼성동",
    );
    expect(normalizeAdministrativeDongSearchQuery("동")).toBeNull();
    expect(normalizeAdministrativeDongSearchQuery(null)).toBeNull();
  });

  it("returns unique administrative dongs with signed manual tokens", async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          documents: [
            {
              address_type: "REGION_ADDR",
              address: {
                h_code: "1168058000",
                region_1depth_name: "서울특별시",
                region_2depth_name: "강남구",
                region_3depth_h_name: "삼성1동",
              },
              x: "127.0625",
              y: "37.5143",
            },
            {
              address_type: "REGION_ADDR",
              address: {
                h_code: "1168058000",
                region_1depth_name: "서울특별시",
                region_2depth_name: "강남구",
                region_3depth_h_name: "삼성1동",
              },
              x: "127.0626",
              y: "37.5144",
            },
            {
              address_type: "REGION_ADDR",
              address: {
                h_code: "",
                region_3depth_h_name: "",
              },
              x: "127",
              y: "37",
            },
          ],
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const result = await searchAdministrativeDongs("삼성동");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      administrativeAreaCode: "1168058000",
      administrativeAreaName: "삼성1동",
      formattedAdministrativeAreaName: "서울 강남구 삼성1동",
      locationScope: "dong",
      location: { latitude: 37.5143, longitude: 127.0625 },
    });
    expect(result[0]?.locationResolutionToken).toContain(".");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/v2/local/search/address.json",
        searchParams: expect.any(URLSearchParams),
      }),
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });

  it("allows a city or district result when Kakao returns a REGION document", async () => {
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          documents: [
            {
              address_type: "REGION",
              address: {
                h_code: "1168000000",
                region_1depth_name: "서울",
                region_2depth_name: "강남구",
                region_3depth_h_name: "",
              },
              x: "127.0473",
              y: "37.5173",
            },
          ],
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    await expect(searchAdministrativeDongs("서울 강남구")).resolves.toEqual([
      expect.objectContaining({
        administrativeAreaCode: "1168000000",
        administrativeAreaName: "강남구",
        formattedAdministrativeAreaName: "서울 강남구",
        locationScope: "district",
      }),
    ]);
  });
});
