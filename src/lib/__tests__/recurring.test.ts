import { describe, expect, it } from '@jest/globals';

import {
  describeSchedule,
  dueOccurrences,
  monthlyEquivalent,
  nextOccurrence,
  occurrenceAt,
  occurrencesBetween,
} from '../recurring';
import type { Recurring } from '../types';

const rule = (patch: Partial<Recurring> = {}): Recurring => ({
  id: 'r',
  kind: 'expense',
  amount: 100,
  categoryId: 'c',
  note: '',
  frequency: 'monthly',
  startDate: '2026-01-31',
  endDate: null,
  lastGenerated: null,
  active: true,
  ...patch,
});

describe('occurrenceAt', () => {
  it('garde le jour du mois et le ramène au dernier jour si besoin', () => {
    const r = rule();
    expect(occurrenceAt(r, 1)).toBe('2026-02-28');
    expect(occurrenceAt(r, 2)).toBe('2026-03-31');
    expect(occurrenceAt(r, 3)).toBe('2026-04-30');
  });

  it('gère les années bissextiles pour un rythme annuel', () => {
    const r = rule({ frequency: 'yearly', startDate: '2028-02-29' });
    expect(occurrenceAt(r, 1)).toBe('2029-02-28');
    expect(occurrenceAt(r, 4)).toBe('2032-02-29');
  });

  it('avance de 7 jours pour un rythme hebdomadaire', () => {
    expect(occurrenceAt(rule({ frequency: 'weekly', startDate: '2026-12-28' }), 1)).toBe('2027-01-04');
  });
});

describe('dueOccurrences', () => {
  it('rattrape toutes les échéances passées jusqu’à aujourd’hui inclus', () => {
    const r = rule({ startDate: '2026-07-05' });
    expect(dueOccurrences(r, '2026-10-05')).toEqual(['2026-07-05', '2026-08-05', '2026-09-05', '2026-10-05']);
  });

  it('ne regénère pas ce qui l’a déjà été', () => {
    const r = rule({ startDate: '2026-07-05', lastGenerated: '2026-09-05' });
    expect(dueOccurrences(r, '2026-10-04')).toEqual([]);
    expect(dueOccurrences(r, '2026-10-05')).toEqual(['2026-10-05']);
  });

  it('respecte la date de fin et la pause', () => {
    expect(dueOccurrences(rule({ startDate: '2026-07-05', endDate: '2026-08-31' }), '2026-12-01')).toEqual([
      '2026-07-05',
      '2026-08-05',
    ]);
    expect(dueOccurrences(rule({ startDate: '2026-07-05', active: false }), '2026-12-01')).toEqual([]);
  });

  it('ne génère rien pour une date de départ future', () => {
    expect(dueOccurrences(rule({ startDate: '2026-11-01' }), '2026-10-05')).toEqual([]);
  });
});

describe('prochaines échéances', () => {
  it('trouve la prochaine échéance strictement après une date', () => {
    const r = rule({ startDate: '2026-07-05' });
    expect(nextOccurrence(r, '2026-10-05')).toBe('2026-11-05');
    expect(nextOccurrence(rule({ startDate: '2026-07-05', endDate: '2026-10-10' }), '2026-10-05')).toBeNull();
  });

  it('liste les échéances d’une période', () => {
    const r = rule({ frequency: 'weekly', startDate: '2026-10-01' });
    expect(occurrencesBetween(r, '2026-10-05', '2026-10-20')).toEqual(['2026-10-08', '2026-10-15']);
  });
});

describe('affichage', () => {
  it('ramène les montants au mois', () => {
    expect(monthlyEquivalent({ amount: 120, frequency: 'yearly' })).toBe(10);
    expect(monthlyEquivalent({ amount: 12, frequency: 'weekly' })).toBe(52);
  });

  it('décrit le rythme', () => {
    expect(describeSchedule('monthly', '2026-10-05')).toBe('le 5 de chaque mois');
    expect(describeSchedule('monthly', '2026-10-01')).toBe('le 1er de chaque mois');
    expect(describeSchedule('weekly', '2026-10-05')).toBe('chaque lundi');
    expect(describeSchedule('yearly', '2026-03-15')).toBe('chaque année le 15 mars');
  });
});
