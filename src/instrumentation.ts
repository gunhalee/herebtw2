export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { validateServerLocationEnvironment } = await import(
    "./lib/geo/server-location-environment"
  );

  validateServerLocationEnvironment();
}
