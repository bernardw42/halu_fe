export const CLIENT_NAVIGATE_EVENT = "halu:navigate";

export type ClientNavigateDetail = {
  href: string;
  mode?: "push" | "replace";
};

export function navigateClient(
  href: string,
  mode: ClientNavigateDetail["mode"] = "push"
) {
  if (typeof window === "undefined") {
    return;
  }

  const event = new CustomEvent<ClientNavigateDetail>(CLIENT_NAVIGATE_EVENT, {
    detail: { href, mode },
    cancelable: true,
  });

  const wasHandled = !window.dispatchEvent(event);
  if (wasHandled) {
    return;
  }

  if (mode === "replace") {
    window.location.replace(href);
    return;
  }

  window.location.assign(href);
}
