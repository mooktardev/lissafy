import type { ISODate, MonthKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): ISODate {
  return toISODate(new Date());
}

/** Parse une date `AAAA-MM-JJ` en date locale (sans décalage de fuseau). */
export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toISODate(parseISODate(s)) === s;
}

export function addDays(s: ISODate, days: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function monthOf(s: ISODate): MonthKey {
  return s.slice(0, 7);
}

export function currentMonth(): MonthKey {
  return monthOf(today());
}

export function addMonths(m: MonthKey, delta: number): MonthKey {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Nombre de mois entiers entre deux mois (b - a). */
export function monthsBetween(a: MonthKey, b: MonthKey): number {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

export function daysInMonth(m: MonthKey): number {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo, 0).getDate();
}

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function formatMonth(m: MonthKey): string {
  const [y, mo] = m.split('-').map(Number);
  const name = MONTHS[mo - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

export function formatMonthShort(m: MonthKey): string {
  const mo = Number(m.split('-')[1]);
  return MONTHS_SHORT[mo - 1];
}

export function formatDate(s: ISODate): string {
  const d = parseISODate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayHeader(s: ISODate): string {
  const t = today();
  if (s === t) return "Aujourd'hui";
  if (s === addDays(t, -1)) return 'Hier';
  const d = parseISODate(s);
  const wd = WEEKDAYS[d.getDay()];
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export { MONTHS };
