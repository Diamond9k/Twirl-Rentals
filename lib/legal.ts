/** Rental agreement + terms copy. Layout/flow is canonical; wording is a
 *  starting point — replace with your finalized legal text before launch. */

export const TERMS_UPDATED = "Last updated June 2026";

export interface LegalSection {
  heading: string;
  body: string;
}

export const RENTAL_AGREEMENT: LegalSection[] = [
  {
    heading: "1. The rental",
    body: "Twirl is a peer-to-peer clothing rental marketplace. When you rent an item, you are entering into a rental agreement with the lender. The lender agrees to rent you the item for the rental period, and you agree to use the item with care and return it in the same condition it was received, by the agreed-upon end date.",
  },
  {
    heading: "2. Deposit & damage",
    body: "A refundable security deposit may be required at the time of booking. The deposit is held to cover potential loss, damage, or excessive cleaning. If the item is returned in the same condition it was received, the deposit will be refunded in full. If the item is damaged, lost, or requires excessive cleaning, twirl may charge part or all of the deposit to cover the cost of repair, replacement, or cleaning.",
  },
  {
    heading: "3. Returns & late fees",
    body: "Please return the item by the end of the rental period. Returns must be shipped or handed off in person as arranged. Late returns may be subject to a fee for each day the item is overdue. Severe or repeated late returns may result in restricted access to the platform.",
  },
  {
    heading: "4. Prohibited conduct",
    body: "Members agree not to list counterfeit, damaged, or unauthorized items, or to engage in any fraudulent, harassing, or otherwise abusive behavior. twirl reserves the right to remove content, cancel rentals, and ban members who violate these terms.",
  },
  {
    heading: "5. Disputes",
    body: "If there is an issue with your rental, contact twirl support within 48 hours of delivery or return. twirl will review the case and may request additional information or photos. twirl's decision is final and binding on all parties.",
  },
];

export const RENTAL_TERMS: LegalSection[] = [
  {
    heading: "1. Eligibility",
    body: "To use twirl, you must be a current college student affiliated with a recognized sorority. You must be at least 18 years old and provide accurate account information. twirl reserves the right to suspend or terminate accounts that do not meet these requirements.",
  },
  {
    heading: "2. Listing & renting",
    body: "Members may list items they own and are willing to rent. Listings must be accurate and include clear photos and descriptions. Renters agree to use items with care and return them by the agreed-upon date in the condition described.",
  },
  {
    heading: "3. Payments & deposits",
    body: "All rentals are paid securely through twirl. Renters may be required to pay a security deposit, which will be refunded after the item is returned in the described condition. Late returns or damage may result in deductions from the deposit or additional charges.",
  },
  {
    heading: "4. Prohibited conduct",
    body: "Members agree not to list counterfeit, damaged, or unauthorized items, or to engage in any fraudulent or harassing behavior. twirl reserves the right to remove content, cancel rentals, and ban members who violate these terms.",
  },
];
