export const CATEGORY_SLUGS: Record<string, string> = {
  "finance":        "Finance",
  "consulting":     "Consulting",
  "legal":          "Legal",
  "engineering":    "Engineering",
  "energy":         "Energy",
  "operations":     "Operations",
  "healthcare":     "Healthcare",
  "public-sector":  "Public Sector",
  "academia":       "Academia",
  "data-ai":        "Data & AI",
  "product":        "Product",
  "marketing":      "Marketing",
  "sales":          "Sales",
  "design":         "Design",
  "social-work":    "Social Work",
  "psychology":     "Psychology",
  "communications": "Communications",
  "arts-culture":   "Arts & Culture",
  "people-hr":      "People & HR",
};

export const CITY_SLUGS: Record<string, string> = {
  "london":        "London",
  "new-york":      "New York",
  "singapore":     "Singapore",
  "hong-kong":     "Hong Kong",
  "dubai":         "Dubai",
  "frankfurt":     "Frankfurt",
  "paris":         "Paris",
  "amsterdam":     "Amsterdam",
  "zurich":        "Zurich",
  "sydney":        "Sydney",
  "tokyo":         "Tokyo",
  "seoul":         "Seoul",
  "kuala-lumpur":  "Kuala Lumpur",
  "mumbai":        "Mumbai",
  "bangalore":     "Bangalore",
};

export type LandingMode = "category" | "city" | "combined";

export function getCategorySlug(name: string): string {
  return Object.entries(CATEGORY_SLUGS).find(([, v]) => v === name)?.[0] ?? "";
}

export function getCitySlug(name: string): string {
  return Object.entries(CITY_SLUGS).find(([, v]) => v === name)?.[0] ?? "";
}

export const TOP_CITIES = ["london", "new-york", "singapore", "hong-kong", "dubai", "frankfurt", "paris", "amsterdam", "zurich", "sydney"];
export const TOP_CATEGORIES = ["finance", "consulting", "legal", "engineering", "energy", "operations", "healthcare", "data-ai", "product", "marketing"];
