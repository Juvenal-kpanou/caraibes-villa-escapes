export const SITE_NAME = "Antilla Stay";
export const SITE_TAGLINE = "Guadeloupe";
export const CONTACT_EMAIL = "contact@antillastay.com";
/** Numéro au format international sans espaces pour wa.me */
export const WHATSAPP_NUMBER = "590690000000";
export const WHATSAPP_DISPLAY = "+590 690 00 00 00";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export const CHECK_IN_TIME = "10h00";
export const CHECK_OUT_TIME = "15h00";
export const SCHEDULE_LABEL = `Arrivée à partir de ${CHECK_IN_TIME} / Départ avant ${CHECK_OUT_TIME}`;

export const DEPOSIT_RATE = 0.3;

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
    description: "Vous réglez 30 % du séjour et la caution, le solde plus tard.",
    icon: "fa-solid fa-piggy-bank",
  },
  {
    key: "partial_no_deposit",
    label: "Acompte sans caution",
    description: "Vous réglez seulement 30 % du séjour, le solde plus tard.",
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

/** Prix total = tarif par personne et par nuit × personnes × nuits */
export function computeTotal(pricePerPerson: number, guests: number, nights: number) {
  return Math.round(pricePerPerson * guests * nights);
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
