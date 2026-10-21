"use client";

const FIRST_VISIT_MS = 3000;
const NAVIGATION_MS = 700;

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isInternalLink(anchor: HTMLAnchorElement): boolean {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.rel?.includes("external")) return false;
  const href = anchor.getAttribute("href");
  if (!href) return false;
  if (href.startsWith("#")) return false;
  try {
    const url = new URL(anchor.href, window.location.origin);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.hash) return false;
    return true;
  } catch {
    return false;
  }
}

export default function PageLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const navStartRef = useRef(0);
  const maxHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("fp-loader-seen");
      if (seen) {
        const t = setTimeout(() => setVisible(false), 0);
        return () => clearTimeout(t);
      }
      sessionStorage.setItem("fp-loader-seen", "1");
      document.documentElement.dataset.fpSeen = "1";
    } catch {
      // ignore
    }

    const overlay = document.querySelector(".pl-overlay") as HTMLElement | null;
    if (overlay) {
      overlay.style.setProperty("--pl-duration", FIRST_VISIT_MS + "ms");
    }

    const hide = () => {
      setVisible((v) => {
        if (!v) return v;
        const ov = document.querySelector(".pl-overlay");
        if (ov) {
          ov.classList.add("pl-exit");
        }
        setTimeout(() => {
          setVisible(false);
        }, 500);
        return v;
      });
    };

    const t = setTimeout(hide, FIRST_VISIT_MS);
    const maxT = setTimeout(hide, FIRST_VISIT_MS + 3000);
    maxHideRef.current = maxT;

    return () => {
      clearTimeout(t);
      if (maxHideRef.current) clearTimeout(maxHideRef.current);
    };
  }, []);

  useEffect(() => {
    if (!navigating) return;
    const overlay = document.querySelector(".pl-overlay") as HTMLElement | null;
    if (overlay) {
      overlay.style.setProperty("--pl-duration", NAVIGATION_MS + "ms");
    }
    const elapsed = Date.now() - navStartRef.current;
    const remaining = Math.max(0, NAVIGATION_MS - elapsed);
    const hide = () => {
      setNavigating(false);
      const ov = document.querySelector(".pl-overlay");
      if (ov) {
        ov.classList.add("pl-exit");
      }
      setTimeout(() => {
        setVisible(false);
      }, 500);
    };
    const t = setTimeout(hide, remaining);
    return () => clearTimeout(t);
  }, [navigating, pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (!isInternalLink(anchor)) return;
      if (visible && !navigating) return;
      setVisible(true);
      setNavigating(true);
      navStartRef.current = Date.now();
      const overlayEl = document.querySelector(".pl-overlay") as HTMLElement | null;
      if (overlayEl) {
        overlayEl.classList.remove("pl-exit");
        overlayEl.style.setProperty("--pl-duration", NAVIGATION_MS + "ms");
        const fill = overlayEl.querySelector(".pl-progress-fill") as HTMLElement | null;
        if (fill) {
          fill.style.animation = "none";
          void fill.offsetWidth;
          fill.style.animation = "";
        }
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [visible, navigating]);

  useEffect(() => {
    if (!visible) {
      document.documentElement.style.overflow = "";
      return;
    }
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="pl-overlay" aria-hidden="true">
      <div className="pl-center">
        <div className="pl-logo-wrap">
          <div className="pl-ripples">
            <span className="pl-ripple pl-ripple-1" />
            <span className="pl-ripple pl-ripple-2" />
          </div>
          <div className="pl-logo">
            <Image
              src="/img/fplace.png"
              alt="Fplaces"
              width={340}
              height={87}
              priority
            />
          </div>
        </div>
        <div className="pl-progress-wrap">
          <div className="pl-progress-track">
            <div className="pl-progress-fill" />
          </div>
        </div>
        <div className="pl-text">Finding your way...</div>
      </div>
      <div className="pl-sr-only" role="status">
        Loading Fplaces
      </div>
      <noscript>
        <style>{".pl-overlay{display:none!important}"}</style>
      </noscript>
    </div>
  );
}
