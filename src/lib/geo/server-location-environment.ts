export function validateServerLocationEnvironment() {
  const missing: string[] = [];
  const kakaoRestApiKey = process.env.KAKAO_REST_API_KEY?.trim();
  const tokenSecret = process.env.LOCATION_RESOLUTION_TOKEN_SECRET?.trim();

  if (!kakaoRestApiKey) {
    missing.push("KAKAO_REST_API_KEY");
  }

  if (!tokenSecret) {
    missing.push("LOCATION_RESOLUTION_TOKEN_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required location environment variables: ${missing.join(", ")}`,
    );
  }

  if (tokenSecret && tokenSecret.length < 32) {
    throw new Error(
      "LOCATION_RESOLUTION_TOKEN_SECRET must contain at least 32 characters.",
    );
  }
}
