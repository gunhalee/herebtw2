const SELECTED_DONG_CODE_COOKIE_KEY = "shout_selected_dong_code";
const SELECTED_DONG_NAME_COOKIE_KEY = "shout_selected_dong_name";
const ADMINISTRATIVE_LOCATION_COOKIE_TTL_SECONDS = 60 * 30;

type AdministrativeLocationCookieValue = {
  administrativeDongCode: string;
  administrativeDongName: string;
};

function buildCookieDirective(name: string, value: string, maxAge: number) {
  return (
    `${name}=${encodeURIComponent(value)}; ` +
    `Max-Age=${maxAge}; Path=/; SameSite=Lax`
  );
}

export function syncAdministrativeLocationCookie(
  location: AdministrativeLocationCookieValue | null,
) {
  if (typeof document === "undefined") {
    return;
  }

  if (!location) {
    document.cookie = buildCookieDirective(
      SELECTED_DONG_CODE_COOKIE_KEY,
      "",
      0,
    );
    document.cookie = buildCookieDirective(
      SELECTED_DONG_NAME_COOKIE_KEY,
      "",
      0,
    );
    return;
  }

  document.cookie = buildCookieDirective(
    SELECTED_DONG_CODE_COOKIE_KEY,
    location.administrativeDongCode,
    ADMINISTRATIVE_LOCATION_COOKIE_TTL_SECONDS,
  );
  document.cookie = buildCookieDirective(
    SELECTED_DONG_NAME_COOKIE_KEY,
    location.administrativeDongName,
    ADMINISTRATIVE_LOCATION_COOKIE_TTL_SECONDS,
  );
}

export {
  ADMINISTRATIVE_LOCATION_COOKIE_TTL_SECONDS,
  SELECTED_DONG_CODE_COOKIE_KEY,
  SELECTED_DONG_NAME_COOKIE_KEY,
};
