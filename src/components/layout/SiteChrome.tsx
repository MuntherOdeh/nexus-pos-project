"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { getPublicTenantRootDomain } from "@/lib/tenant-slug";

export function SiteChrome({
  children,
  host,
}: {
  children: React.ReactNode;
  host?: string;
}) {
  const pathname = usePathname();

  const rootDomain = getPublicTenantRootDomain().toLowerCase();
  const hostname = (host || "").split(":")[0].toLowerCase();

  const isTenantSubdomain =
    (hostname &&
      rootDomain &&
      hostname.endsWith(`.${rootDomain}`) &&
      hostname !== rootDomain &&
      hostname !== `www.${rootDomain}`) ||
    (hostname.endsWith(".localhost") && hostname !== "localhost");

  const hideChrome =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/t/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    isTenantSubdomain;

  if (hideChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
