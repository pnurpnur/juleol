"use client";

export function useOpenUntappd() {
  function openBeer(beerId: string | number) {
    const appUrl = `untappd://beer/${beerId}`;
    const webUrl = `https://untappd.com/beer/${beerId}`;

    const ua = navigator.userAgent || navigator.vendor;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    let canceled = false;
    let timeoutRef: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutRef) clearTimeout(timeoutRef);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onHide);
    };

    const onVis = () => {
      if (document.hidden) {
        canceled = true;
        cleanup();
      }
    };

    const onBlur = () => {
      canceled = true;
    };

    const onHide = () => {
      canceled = true;
      cleanup();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onHide);

    //
    // ANDROID: bruk intent://
    //
    if (isAndroid) {
      const intentUrl = `intent://beer/${beerId}#Intent;scheme=untappd;package=com.untappdllc.app;end`;

      window.location.href = intentUrl;

      timeoutRef = setTimeout(() => {
        if (!canceled) {
          window.open(webUrl, "_blank", "noopener,noreferrer");
        }
        cleanup();
      }, 1000);

      return;
    }

    //
    // iOS: vanlig URL scheme
    //
    if (isIOS) {
      window.location.href = appUrl;

      timeoutRef = setTimeout(() => {
        if (!canceled) {
          window.open(webUrl, "_blank", "noopener,noreferrer");
        }
        cleanup();
      }, 1200);

      return;
    }

    //
    // Desktop
    //
    window.open(webUrl, "_blank", "noopener,noreferrer");
  }

  return { openBeer };
}
