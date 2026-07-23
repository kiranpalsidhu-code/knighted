import { useEffect } from "react";

const SITE_NAME = "Knighted Resume";
const SITE_URL = "https://theknightedresume.com";
const DEFAULT_IMAGE = "https://theknightedresume.com/opengraph.jpg";
const DEFAULT_TITLE = "Knighted Resume — AI Resume Tailoring & Job Tracker";

interface SEOMeta {
  title: string;
  description: string;
  canonical?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  noIndex?: boolean;
}

function upsertMeta(selector: string, attrKey: string, attrValue: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  el.setAttribute(attrKey, attrValue);
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function useSEO({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_IMAGE,
  noIndex = false,
}: SEOMeta) {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const url = canonical ? `${SITE_URL}${canonical}` : window.location.href;
    const desc = description.slice(0, 160);

    upsertMeta('meta[name="description"]',            "name",     "description",  desc);
    upsertMeta('meta[name="robots"]',                 "name",     "robots",       noIndex ? "noindex,nofollow" : "index,follow");

    upsertMeta('meta[property="og:title"]',           "property", "og:title",     fullTitle);
    upsertMeta('meta[property="og:description"]',     "property", "og:description", desc);
    upsertMeta('meta[property="og:url"]',             "property", "og:url",       url);
    upsertMeta('meta[property="og:type"]',            "property", "og:type",      ogType);
    upsertMeta('meta[property="og:image"]',           "property", "og:image",     ogImage);
    upsertMeta('meta[property="og:site_name"]',       "property", "og:site_name", SITE_NAME);

    upsertMeta('meta[name="twitter:card"]',           "name",     "twitter:card",        "summary_large_image");
    upsertMeta('meta[name="twitter:title"]',          "name",     "twitter:title",       fullTitle);
    upsertMeta('meta[name="twitter:description"]',    "name",     "twitter:description", desc);
    upsertMeta('meta[name="twitter:image"]',          "name",     "twitter:image",       ogImage);

    if (canonical) upsertCanonical(`${SITE_URL}${canonical}`);

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, canonical, ogType, ogImage, noIndex]);
}
