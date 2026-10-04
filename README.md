# Planifin

Application mobile de planification financière personnelle, construite avec **Expo SDK 57** (React Native, Expo Router, TypeScript). Toutes les données restent **sur l'appareil** : pas de compte, pas de serveur.

## Fonctionnalités

| Onglet | Contenu |
| --- | --- |
| **Accueil** | Solde du mois, revenus / dépenses, taux d'épargne, répartition des dépenses (anneau), évolution sur 6 mois, budgets et objectifs les plus importants, dernières transactions |
| **Transactions** | Saisie des revenus et dépenses (montant, catégorie, date, note), liste groupée par jour, filtre par type, recherche |
| **Budget** | Plafond mensuel par catégorie, consommé / restant, alertes à 85 % et en cas de dépassement, part des revenus budgétée |
| **Objectifs** | Objectifs d'épargne avec montant cible et échéance, versements / retraits, effort mensuel calculé automatiquement |
| **Outils** | Situation nette, simulateur d'épargne (intérêts composés, délai pour atteindre un montant), dettes et prêts (échéancier, paiements, simulation de remboursement anticipé, stratégie avalanche), catégories, réglages |

**Réglages :** devise configurable (EUR, FCFA, MAD, CHF, CAD, USD… ou tout code ISO 4217), thème clair / sombre / système, export et import d'une sauvegarde JSON, remise à zéro.

## Démarrer

```bash
npm install
npx expo start
```

Puis scannez le QR code avec **Expo Go** (Android / iOS), ou appuyez sur `a` (émulateur Android), `i` (simulateur iOS) ou `w` (navigateur).

## Scripts

```bash
npm run typecheck   # vérification TypeScript
npm run lint        # ESLint (expo lint)
npm test            # tests unitaires (Jest) de la logique financière
```

## Architecture

```
src/
  app/                 Écrans (Expo Router : chaque fichier = une route)
    (tabs)/            Les 5 onglets
    transaction.tsx    Formulaire transaction (modal)
    goal/[id].tsx      Détail d'un objectif
    debt/[id].tsx      Détail d'une dette + échéancier
    simulator.tsx      Simulateur d'épargne
    …
  components/          UI réutilisable (cartes, champs, graphiques SVG, sélecteurs)
  constants/theme.ts   Couleurs clair / sombre, espacements
  hooks/use-theme.ts   Thème résolu et devise courante
  lib/
    finance.ts         Calculs purs (budgets, objectifs, amortissement, projections) — testés
    dates.ts, format.ts
    backup.ts          Export / import JSON
  store/               État global (Zustand) persisté dans AsyncStorage
```

- **Stockage** : Zustand + `persist` vers AsyncStorage (localStorage sur le web).
- **Graphiques** : composants SVG maison (`react-native-svg`), sans bibliothèque lourde.
- **Calculs** : toute la logique financière est dans `src/lib/finance.ts`, sans dépendance à React, et couverte par `src/lib/__tests__/finance.test.ts`.

## Construire l'application

Avec [EAS Build](https://docs.expo.dev/build/introduction/) :

```bash
npx eas-cli@latest build --platform android --profile preview
```

Identifiants configurés dans `app.json` : `com.planifin.app` (iOS et Android) — à adapter avant publication.

## Pistes d'évolution

- Transactions récurrentes (salaire, loyer, abonnements) générées automatiquement
- Rappels par notification (budget presque atteint, échéance d'objectif)
- Verrouillage biométrique
- Synchronisation cloud optionnelle (Supabase) et multi-comptes
- Import de relevés bancaires (CSV)
