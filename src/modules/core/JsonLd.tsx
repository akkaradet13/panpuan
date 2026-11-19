/** Structured data for search engines. `<` is escaped so content can't close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const SITE = "https://panpuan.net";

export function breadcrumbs(items: [name: string, path: string][]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + encodeURI(path) })),
  };
}

/** Dynamic route params can arrive URL-encoded (Thai slugs). */
export function decodeParam(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
