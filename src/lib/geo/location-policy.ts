export const LOCATION_POLICY = {
  accurateWatchTargetMeters: 100,
  accurateWatchMaxWaitMs: 8000,
  submitWarningAboveMeters: 100,
  submitBlockAboveMeters: 500,
  maximumMeasurementAgeMs: 30000,
  browserMaximumAgeMs: 60000,
  browserTimeoutMs: 10000,
  sessionFreshnessMs: 180000,
  administrativeDisplayCacheMs: 1800000,
  resolutionTokenTtlMs: 600000,
  nearbyFeedCacheMs: 180000,
  reverseGeocodeCacheSeconds: 604800,
} as const;
