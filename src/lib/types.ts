import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type TransactionKind = 'expense' | 'income';

/** Date au format ISO local `AAAA-MM-JJ`. */
export type ISODate = string;

/** Mois au format `AAAA-MM`. */
export type MonthKey = string;

export type Category = {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  kind: TransactionKind;
};

export type Transaction = {
  id: string;
  kind: TransactionKind;
  amount: number;
  categoryId: string;
  date: ISODate;
  note: string;
  /** Règle de récurrence ayant généré cette transaction. */
  recurringId?: string;
  /** Mouvement d'objectif ou paiement de dette à l'origine de cette transaction. */
  link?: TransactionLink;
  /** Compte débité ou crédité (absent sur les données antérieures aux comptes). */
  accountId?: string;
};

export type AccountType = 'bank' | 'cash' | 'mobile' | 'savings' | 'other';

/** Compte ou portefeuille : banque, espèces, mobile money… */
export type Account = {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  /** Solde au moment de la création ; le solde courant en découle. */
  initialBalance: number;
  createdAt: ISODate;
};

/** Virement entre deux comptes : ni dépense ni revenu. */
export type Transfer = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: ISODate;
  note: string;
};

export type TransactionLink =
  | { type: 'goal'; goalId: string; contributionId: string }
  | { type: 'debt'; debtId: string; paymentId: string };

export type Frequency = 'weekly' | 'monthly' | 'yearly';

/** Transaction répétée automatiquement (salaire, loyer, abonnement…). */
export type Recurring = {
  id: string;
  kind: TransactionKind;
  amount: number;
  categoryId: string;
  note: string;
  frequency: Frequency;
  /** Première échéance ; fixe aussi le jour du mois ou de la semaine. */
  startDate: ISODate;
  endDate: ISODate | null;
  /** Date de la dernière échéance déjà transformée en transaction. */
  lastGenerated: ISODate | null;
  active: boolean;
  accountId?: string;
};

/** Plafond mensuel récurrent pour une catégorie de dépenses. */
export type Budget = {
  categoryId: string;
  amount: number;
};

export type Contribution = {
  id: string;
  amount: number;
  date: ISODate;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  deadline: ISODate | null;
  icon: IconName;
  color: string;
  contributions: Contribution[];
  createdAt: ISODate;
};

export type DebtPayment = {
  id: string;
  amount: number;
  /** Part des intérêts dans le paiement, calculée à l'enregistrement. */
  interest: number;
  date: ISODate;
};

export type Debt = {
  id: string;
  name: string;
  originalAmount: number;
  /** Capital restant dû au moment de la création. */
  startingBalance: number;
  /** Taux annuel en pourcentage (ex. 3.5). */
  annualRate: number;
  monthlyPayment: number;
  payments: DebtPayment[];
  createdAt: ISODate;
};

export type ThemeMode = 'system' | 'light' | 'dark';

export type Settings = {
  currency: string;
  themeMode: ThemeMode;
};
