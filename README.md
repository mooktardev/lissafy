# Lissafy

Application mobile de planification financière personnelle, construite avec **Expo SDK 57** (React Native, Expo Router, TypeScript). Toutes les données restent **sur l'appareil** : pas de compte, pas de serveur.

## Fonctionnalités

| Écran                                   | Contenu                                                                                                                                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accueil**                             | Carte de solde du mois (revenus, dépenses, taux d'épargne), actions rapides, « reste à dépenser » avec montant par jour, répartition des dépenses, carrousel d'objectifs, évolution sur 6 mois, dernières transactions |
| **Activité**                            | Transactions groupées par jour, filtres Dépenses / Revenus, recherche                                                                                                                                                  |
| **＋ (bouton central)**                 | Ajout rapide d'une transaction depuis n'importe quel onglet                                                                                                                                                            |
| **Budget**                              | Anneau de suivi global, catégories suivies avec barres de progression, alertes à 85 % et en dépassement, suggestion basée sur le mois précédent                                                                        |
| **Objectifs**                           | Total épargné, objectifs avec anneau de progression, échéance et effort mensuel calculé automatiquement                                                                                                                |
| **Outils** (icône en haut de l'accueil) | Situation nette, simulateur d'épargne (intérêts composés), dettes et prêts (échéancier, paiements, remboursement anticipé, stratégie avalanche), catégories, réglages                                                  |
| **Récurrences** (Outils)                | Salaire, loyer, abonnements ajoutés automatiquement à chaque échéance (rattrapage inclus), charges et revenus fixes par mois, prochaines échéances sur l'accueil                                                       |

**Premier lancement guidé :** devise, revenu mensuel (avec salaire ajouté automatiquement chaque mois), compte principal et son solde, budgets proposés selon la règle 50 / 30 / 20 (besoins, envies, épargne) et objectif « Fonds d'urgence » de 3 mois de dépenses essentielles. Chaque étape peut être passée ; les utilisateurs existants ne la voient pas.

**Protection :** verrouillage par code à 4 chiffres (empreinte salée SHA-256 dans le coffre du téléphone, jamais le code en clair), déverrouillage par empreinte digitale ou Face ID, délai de reverrouillage (aussitôt, 1 min, 5 min), attente imposée après 5 essais ratés. Rappel de sauvegarde sur l'accueil (jamais sauvegardé ou dernière sauvegarde > 30 jours). Face ID nécessite un build de développement : Expo Go sur iOS ne le prend pas en charge.

**Comptes et portefeuilles :** banque, espèces, mobile money, épargne… Chaque transaction est rattachée à un compte, le solde se calcule automatiquement, les virements entre comptes ne comptent ni comme dépense ni comme revenu, et le solde peut être recalé sur un relevé. Le total des comptes entre dans la situation nette.

**Objectifs et prêts reliés aux transactions :** un versement sur un objectif crée une dépense « Épargne », un retrait un revenu « Retrait d'épargne », un paiement de prêt une dépense « Remboursements ». Les deux restent synchronisés (suppression, date), et le taux d'épargne compte les versements comme de l'épargne.

**Design :** police Plus Jakarta Sans, cartes en dégradé, ombres douces, thème clair et sombre soignés.

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

Identifiants configurés dans `app.json` : `com.Lissafy.app` (iOS et Android) — à adapter avant publication.

## Pistes d'évolution

- Rappels par notification (budget presque atteint, échéance d'objectif)
- Synchronisation cloud optionnelle (Supabase) et multi-comptes
- Import de relevés bancaires (CSV)
