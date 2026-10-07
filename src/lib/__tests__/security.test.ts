import { describe, expect, it } from '@jest/globals';

import { backupReminder, lockoutDelay, shouldRelock, snoozeUntil } from '../security';

describe('anti-essais', () => {
  it('impose une attente à partir de 5 erreurs, puis plus longue', () => {
    expect(lockoutDelay(4)).toBe(0);
    expect(lockoutDelay(5)).toBe(30_000);
    expect(lockoutDelay(6)).toBe(0);
    expect(lockoutDelay(10)).toBe(300_000);
    expect(lockoutDelay(11)).toBe(300_000);
  });
});

describe('reverrouillage', () => {
  it('respecte le délai choisi', () => {
    expect(shouldRelock(null, 10_000, 0)).toBe(false);
    expect(shouldRelock(0, 0, 0)).toBe(true);
    expect(shouldRelock(0, 59_000, 60)).toBe(false);
    expect(shouldRelock(0, 60_000, 60)).toBe(true);
  });
});

describe('rappel de sauvegarde', () => {
  const base = { lastBackupAt: null, snoozedUntil: null, firstDataDate: '2026-10-01', today: '2026-10-07' };

  it('rappelle si jamais sauvegardé après 3 jours de données', () => {
    expect(backupReminder(base).due).toBe(true);
    expect(backupReminder({ ...base, firstDataDate: '2026-10-05' }).due).toBe(false);
  });

  it('rappelle 30 jours après la dernière sauvegarde', () => {
    expect(backupReminder({ ...base, lastBackupAt: '2026-09-10' })).toEqual({ due: false, daysSince: 27 });
    expect(backupReminder({ ...base, lastBackupAt: '2026-09-07' })).toEqual({ due: true, daysSince: 30 });
  });

  it('se tait pendant le report et sans données', () => {
    expect(backupReminder({ ...base, snoozedUntil: snoozeUntil('2026-10-05') }).due).toBe(false);
    expect(backupReminder({ ...base, snoozedUntil: '2026-10-07' }).due).toBe(true);
    expect(backupReminder({ ...base, firstDataDate: null }).due).toBe(false);
  });
});
