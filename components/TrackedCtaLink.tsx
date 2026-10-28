"use client";

import type { ReactNode } from "react";
import { trackEvent } from "../lib/analytics";

type TrackedCtaLinkProps = {
  children: ReactNode;
  className: string;
  href: string;
  label: string;
  page: string;
};

export default function TrackedCtaLink({
  children,
  className,
  href,
  label,
  page,
}: TrackedCtaLinkProps) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => trackEvent("cta_click", { label, page })}
    >
      {children}
    </a>
  );
}
