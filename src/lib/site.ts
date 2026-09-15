export const SITE_NAME = "Antilla Stay";
export const SITE_TAGLINE = "Guadeloupe";
export const CONTACT_EMAIL = "villaguadeloupe14@gmail.com";
/** Numéro au format international sans espaces ni le 0 initial pour wa.me */
export const WHATSAPP_NUMBER = "33780957372";
export const WHATSAPP_DISPLAY = "+33 7 80 95 73 72";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export const CHECK_IN_TIME = "10h00";
export const CHECK_OUT_TIME = "15h00";
export const SCHEDULE_LABEL = `Arrivée à partir de ${CHECK_IN_TIME} / Départ avant ${CHECK_OUT_TIME}`;

export const DEPOSIT_RATE = 0.5;

export type PaymentOption =
  | "full_with_deposit"
  | "full_no_deposit"
  | "partial_with_deposit"
  | "partial_no_deposit";

export const PAYMENT_OPTIONS: {
  key: PaymentOption;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    key: "full_with_deposit",
    label: "Règlement total avec caution",
    description: "Vous réglez la totalité du séjour et la caution dès maintenant.",
    icon: "fa-solid fa-shield-halved",
  },
  {
    key: "full_no_deposit",
    label: "Règlement total sans caution",
    description: "Vous réglez la totalité du séjour, la caution reste à voir sur place.",
    icon: "fa-solid fa-wallet",
  },
  {
    key: "partial_with_deposit",
    label: "Acompte avec caution",
    description: "Vous réglez 50 % du séjour et la caution, le solde plus tard.",
    icon: "fa-solid fa-piggy-bank",
  },
  {
    key: "partial_no_deposit",
    label: "Acompte sans caution",
    description: "Vous réglez seulement 50 % du séjour, le solde plus tard.",
    icon: "fa-solid fa-hand-holding-dollar",
  },
];

export function paymentOptionLabel(key: string) {
  return PAYMENT_OPTIONS.find((o) => o.key === key)?.label ?? "Règlement";
}

export function requiresDeposit(option: PaymentOption | string) {
  return option === "full_with_deposit" || option === "partial_with_deposit";
}

export function isPartial(option: PaymentOption | string) {
  return option === "partial_with_deposit" || option === "partial_no_deposit";
}

export type PricingBreakdown = {
  standardGuests: number;
  surchargedGuests: number;
  standardPricePerPerson: number;
  surchargedPricePerPerson: number;
  standardTotal: number;
  surchargedTotal: number;
  total: number;
  hasSurcharge: boolean;
};

export function computePricingBreakdown(
  pricePerPerson: number,
  guests: number,
  nights: number,
  threshold?: number | null,
): PricingBreakdown {
  const p = Number(pricePerPerson) || 0;
  const g = Math.max(0, Number(guests) || 0);
  const n = Math.max(0, Number(nights) || 0);
  const t = threshold != null && Number(threshold) > 0 ? Number(threshold) : 0;

  const hasSurcharge = t > 0 && g > t;

  if (!hasSurcharge) {
    const total = p * g * n;
    return {
      standardGuests: g,
      surchargedGuests: 0,
      standardPricePerPerson: p,
      surchargedPricePerPerson: p * 1.15,
      standardTotal: total,
      surchargedTotal: 0,
      total: Math.round(total * 100) / 100,
      hasSurcharge: false,
    };
  }

  const standardGuests = Math.min(g, t);
  const surchargedGuests = Math.max(0, g - t);
  const surchargedPricePerPerson = p * 1.15;

  const standardTotal = standardGuests * n * p;
  const surchargedTotal = surchargedGuests * n * surchargedPricePerPerson;
  const total = standardTotal + surchargedTotal;

  return {
    standardGuests,
    surchargedGuests,
    standardPricePerPerson: p,
    surchargedPricePerPerson,
    standardTotal: Math.round(standardTotal * 100) / 100,
    surchargedTotal: Math.round(surchargedTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
    hasSurcharge: true,
  };
}

/** Prix total = tarif par personne et par nuit × personnes × nuits (avec majoration de 15% au-delà du seuil si défini) */
export function computeTotal(
  pricePerPerson: number,
  guests: number,
  nights: number,
  threshold?: number | null,
) {
  return computePricingBreakdown(pricePerPerson, guests, nights, threshold).total;
}

/** Capacité standard pour le calcul du prix nuitée indicatif (pricing_threshold si défini et > 0, sinon capacity) */
export function getVillaStandardCapacity(villa: {
  capacity: number;
  pricing_threshold?: number | null;
}): number {
  const threshold =
    villa.pricing_threshold != null && Number(villa.pricing_threshold) > 0
      ? Number(villa.pricing_threshold)
      : 0;
  return threshold > 0 ? threshold : Math.max(1, Number(villa.capacity) || 1);
}

/** Calcule le prix automatique par nuit d'une villa à sa capacité standard */
export function computeVillaNightlyPrice(villa: {
  price_per_person: number;
  capacity: number;
  pricing_threshold?: number | null;
}): number {
  const standardCapacity = getVillaStandardCapacity(villa);
  return computeTotal(villa.price_per_person, standardCapacity, 1, villa.pricing_threshold);
}

export function computeDueNow(
  option: PaymentOption | string,
  total: number,
  deposit: number,
) {
  const base = isPartial(option) ? Math.round(total * DEPOSIT_RATE) : total;
  return base + (requiresDeposit(option) ? deposit : 0);
}

/** Engagement total du client (séjour + caution si elle est encaissée) */
export function computeCommitment(
  option: PaymentOption | string,
  total: number,
  deposit: number,
) {
  return total + (requiresDeposit(option) ? deposit : 0);
}
