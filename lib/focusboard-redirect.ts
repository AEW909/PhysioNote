import { permanentRedirect } from "next/navigation";

const DEFAULT_FOCUSBOARD_SITE_URL = "https://harris-focus-board.vercel.app";

type SearchParamValue = string | string[] | undefined;

export function getFocusBoardSiteUrl() {
  const configured = process.env.FOCUSBOARD_SITE_URL?.trim() || DEFAULT_FOCUSBOARD_SITE_URL;
  return configured.endsWith("/") ? configured.slice(0, -1) : configured;
}

function buildRedirectUrl(pathname: string, searchParams?: Record<string, SearchParamValue>) {
  const url = new URL(pathname, `${getFocusBoardSiteUrl()}/`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry) {
            url.searchParams.append(key, entry);
          }
        });
        continue;
      }

      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

export function redirectToFocusBoard(pathname: string, searchParams?: Record<string, SearchParamValue>) {
  permanentRedirect(buildRedirectUrl(pathname, searchParams));
}
