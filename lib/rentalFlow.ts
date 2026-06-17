import { RENTAL_STATUS_LABELS } from "@/lib/constants";
import type { RentalStatus } from "@/lib/types";

export type Role = "renter" | "owner";

const ACTIVE_STATUSES: RentalStatus[] = [
  "pending",
  "approved",
  "paid",
  "active",
  "return_pending",
];

export function isActive(status: RentalStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function statusLabel(status: RentalStatus): string {
  return RENTAL_STATUS_LABELS[status] ?? status;
}

export interface NextStep {
  text: string;
}

/** "What's next" timeline copy driven by status + role. */
export function whatsNext(status: RentalStatus, role: Role): NextStep[] {
  switch (status) {
    case "pending":
      return role === "owner"
        ? [{ text: "Review the request and approve or decline" }]
        : [{ text: "Waiting for the owner to approve your request" }];
    case "approved":
      return role === "renter"
        ? [
            { text: "Pay to confirm your rental" },
            { text: "Deposit is held and refunded after return" },
          ]
        : [{ text: "Waiting for the renter to pay" }];
    case "paid":
      return role === "owner"
        ? [{ text: "Hand off the piece and mark it picked up" }]
        : [{ text: "Arrange pickup with the owner" }];
    case "active":
      return role === "renter"
        ? [
            { text: "Enjoy your rental" },
            { text: "Mark as returned when you give it back" },
          ]
        : [{ text: "Renter will mark the piece as returned" }];
    case "return_pending":
      return role === "owner"
        ? [
            { text: "Inspect the piece and confirm the return" },
            { text: "Deposit is released once you confirm" },
          ]
        : [{ text: "Owner is confirming the return" }];
    case "completed":
      return [{ text: "Rental complete — leave a review" }];
    default:
      return [];
  }
}

export type ActionKind =
  | "pay"
  | "cancel"
  | "approve"
  | "decline"
  | "activate"
  | "markReturned"
  | "confirmReturn"
  | "review";

/** Primary + secondary actions available to a role at a given status. */
export function availableActions(status: RentalStatus, role: Role): ActionKind[] {
  if (role === "renter") {
    switch (status) {
      case "pending":
        return ["cancel"];
      case "approved":
        return ["pay", "cancel"];
      case "active":
        return ["markReturned"];
      case "completed":
        return ["review"];
      default:
        return [];
    }
  }
  // owner
  switch (status) {
    case "pending":
      return ["approve", "decline"];
    case "paid":
      return ["activate"];
    case "return_pending":
      return ["confirmReturn"];
    case "completed":
      return ["review"];
    default:
      return [];
  }
}
