export const CURRENCIES: { code: string; label: string }[] = [
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'XOF', label: 'Franc CFA BCEAO (FCFA)' },
  { code: 'XAF', label: 'Franc CFA BEAC (FCFA)' },
  { code: 'MAD', label: 'Dirham marocain (MAD)' },
  { code: 'DZD', label: 'Dinar algérien (DZD)' },
  { code: 'TND', label: 'Dinar tunisien (TND)' },
  { code: 'CHF', label: 'Franc suisse (CHF)' },
  { code: 'CAD', label: 'Dollar canadien ($ CA)' },
  { code: 'USD', label: 'Dollar américain ($ US)' },
  { code: 'GBP', label: 'Livre sterling (£)' },
  { code: 'GNF', label: 'Franc guinéen (GNF)' },
  { code: 'HTG', label: 'Gourde haïtienne (HTG)' },
  { code: 'MGA', label: 'Ariary malgache (MGA)' },
  { code: 'CDF', label: 'Franc congolais (CDF)' },
];

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}|${compact}`;
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
        ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
      });
    } catch {
      f = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
    }
    formatters.set(key, f);
  }
  return f;
}

export function formatMoney(amount: number, currency: string, opts?: { compact?: boolean; sign?: boolean }): string {
  const text = formatter(currency, !!opts?.compact).format(Math.abs(amount));
  // Les espaces insécables étroits d'Intl s'affichent mal sur certains Android.
  const clean = text.replace(/[  ]/g, ' ');
  if (amount < 0) return `−${clean}`;
  if (opts?.sign && amount > 0) return `+${clean}`;
  return clean;
}

export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits).replace('.', ',')} %`;
}

/** Accepte « 1 234,56 », « 1234.56 », etc. Retourne NaN si invalide. */
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[\s  ]/g, '').replace(',', '.');
  if (cleaned === '' || !/^-?\d*\.?\d*$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

export function amountToInput(n: number): string {
  return Number.isFinite(n) && n !== 0 ? String(n).replace('.', ',') : '';
}

export function formatDuration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} an${y > 1 ? 's' : ''}`);
  if (m > 0 || y === 0) parts.push(`${m} mois`);
  return parts.join(' et ');
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
