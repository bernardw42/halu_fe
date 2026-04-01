"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CLIENT_NAVIGATE_EVENT,
  type ClientNavigateDetail,
} from "../utils/clientNavigation";

export default function ClientNavigationHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<ClientNavigateDetail>;
      const href = customEvent.detail?.href;
      const mode = customEvent.detail?.mode ?? "push";

      if (!href) {
        return;
      }

      customEvent.preventDefault();
      if (mode === "replace") {
        router.replace(href);
        return;
      }

      router.push(href);
    };

    window.addEventListener(CLIENT_NAVIGATE_EVENT, handleNavigate as EventListener);
    return () => {
      window.removeEventListener(
        CLIENT_NAVIGATE_EVENT,
        handleNavigate as EventListener
      );
    };
  }, [router]);

  return null;
}
