import { addDays, daysInMonth, MONTHS, parseISODate, toISODate } from './dates';
import type { Frequency, ISODate, Recurring } from './types';

/** Garde-fou contre les boucles infinies (≈ 20 ans d'échéances hebdomadaires). */
const MAX_OCCURRENCES = 1000;

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Chaque semaine',
  monthly: 'Chaque mois',
  yearly: 'Chaque année',
};

/**
 * Ajoute des mois en conservant le jour d'origine, ramené au dernier jour
 * du mois si nécessaire (31 janvier → 28/29 février → 31 mars).
 */
function addMonthsKeepingDay(start: ISODate, months: number): ISODate {
  const d = parseISODate(start);
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const key = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
  target.setDate(Math.min(day, daysInMonth(key)));
  return toISODate(target);
}

/** n-ième échéance (0 = date de départ). */
export function occurrenceAt(rule: Pick<Recurring, 'frequency' | 'startDate'>, n: number): ISODate {
  switch (rule.frequency) {
    case 'weekly':
      return addDays(rule.startDate, 7 * n);
    case 'monthly':
      return addMonthsKeepingDay(rule.startDate, n);
    case 'yearly':
      return addMonthsKeepingDay(rule.startDate, 12 * n);
  }
}

/**
 * Échéances à générer : postérieures à `lastGenerated`, jusqu'à `today`
 * inclus et dans la limite de `endDate`.
 */
export function dueOccurrences(rule: Recurring, today: ISODate): ISODate[] {
  if (!rule.active) return [];
  const limit = rule.endDate && rule.endDate < today ? rule.endDate : today;
  const dates: ISODate[] = [];
  for (let n = 0; n < MAX_OCCURRENCES; n++) {
    const date = occurrenceAt(rule, n);
    if (date > limit) break;
    if (rule.lastGenerated === null || date > rule.lastGenerated) dates.push(date);
  }
  return dates;
}

/** Prochaine échéance strictement après `after`, ou `null` si la règle est terminée. */
export function nextOccurrence(rule: Recurring, after: ISODate): ISODate | null {
  if (!rule.active) return null;
  for (let n = 0; n < MAX_OCCURRENCES; n++) {
    const date = occurrenceAt(rule, n);
    if (rule.endDate && date > rule.endDate) return null;
    if (date > after) return date;
  }
  return null;
}

/** Échéances comprises entre `from` (exclu) et `to` (inclus). */
export function occurrencesBetween(rule: Recurring, from: ISODate, to: ISODate): ISODate[] {
  if (!rule.active) return [];
  const dates: ISODate[] = [];
  for (let n = 0; n < MAX_OCCURRENCES; n++) {
    const date = occurrenceAt(rule, n);
    if (date > to || (rule.endDate && date > rule.endDate)) break;
    if (date > from) dates.push(date);
  }
  return dates;
}

/** Montant ramené à un mois (pour totaliser charges et revenus fixes). */
export function monthlyEquivalent(rule: Pick<Recurring, 'amount' | 'frequency'>): number {
  switch (rule.frequency) {
    case 'weekly':
      return (rule.amount * 52) / 12;
    case 'monthly':
      return rule.amount;
    case 'yearly':
      return rule.amount / 12;
  }
}

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Description lisible du rythme, ex. « le 5 de chaque mois ». */
export function describeSchedule(frequency: Frequency, startDate: ISODate): string {
  const d = parseISODate(startDate);
  const day = d.getDate();
  switch (frequency) {
    case 'weekly':
      return `chaque ${WEEKDAYS[d.getDay()]}`;
    case 'monthly':
      return day > 28 ? `le ${day} (ou le dernier jour) de chaque mois` : `le ${day === 1 ? '1er' : day} de chaque mois`;
    case 'yearly':
      return `chaque année le ${day === 1 ? '1er' : day} ${MONTHS[d.getMonth()]}`;
  }
}
