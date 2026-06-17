import type { ItemCondition, ItemSize, ReportReason } from "@/lib/types";

/** Platform commission applied on top of subtotal (matches DB pricing fn). */
export const COMMISSION_RATE = 0.15;

export const SIZES: ItemSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

export const OCCASIONS = [
  "Formal",
  "Game Day",
  "Date Party",
  "Bid Day",
  "Recruitment",
  "Cocktail",
  "Wedding",
  "Casual",
] as const;

export const CATEGORIES = [
  "Dress",
  "Top",
  "Skirt",
  "Set",
  "Jumpsuit",
  "Outerwear",
  "Accessories",
  "Shoes",
] as const;

export const CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "new", label: "New with tags" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  new: "New with tags",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
};

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "counterfeit", label: "Counterfeit item" },
  { value: "scam", label: "Scam or fraud" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

/** Human-readable rental status labels + the renter/owner "what's next" copy. */
export const RENTAL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending approval",
  approved: "Approved — pay to confirm",
  paid: "Paid — awaiting pickup",
  active: "Active rental",
  return_pending: "Return in review",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
  disputed: "Disputed",
};

/** Currently scoped to University of Arkansas per launch plan. */
export const DEFAULT_SCHOOL = "University of Arkansas";

/** Panhellenic chapters for the chapter picker (alphabetical). */
export const SORORITIES = [
  "Alpha Chi Omega",
  "Alpha Delta Pi",
  "Alpha Omicron Pi",
  "Chi Omega",
  "Delta Delta Delta",
  "Delta Gamma",
  "Gamma Phi Beta",
  "Kappa Alpha Theta",
  "Kappa Delta",
  "Kappa Kappa Gamma",
  "Pi Beta Phi",
  "Zeta Tau Alpha",
] as const;

export const TERMS_VERSION = "2.0";
