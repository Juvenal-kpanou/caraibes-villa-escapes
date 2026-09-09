# Remix of Remix of Remix of Remix of Remix of Villa Caraïbes

Crée une application web complète de réservation de villas de vacances en Guadeloupe, en français, avec un espace public (visiteurs) et un espace admin sécurisé.

## CONTEXTE

Plateforme de réservation pour un gestionnaire de plus de 5 villas en Guadeloupe, avec un catalogue destiné à s'agrandir dans le temps. Le paiement se fait uniquement par virement bancaire (pas de carte bancaire, pas de Stripe). Design moderne, chaleureux, inspiré de l'univers tropical/caribéen (tons turquoise, blanc, bois clair, vert palmier), professionnel et rassurant.

## STRUCTURE DES DONNÉES

### Villa

- Nom

- Description longue

- Galerie de photos (plusieurs images)

- Localisation (ville/quartier en Guadeloupe)

- Capacité maximale (nombre de personnes)

- Nombre de chambres / salles de bain

- Liste d'équipements (piscine, wifi, climatisation, parking, vue mer, etc.)

- Prix par nuit

- Frais de ménage (montant fixe)

- Montant de la caution

- Statut (active / inactive)

- Dates bloquées/réservées (calendrier de disponibilité)

### Réservation

- Villa liée

- Nom, email, téléphone du client

- Nombre de personnes (ne doit pas dépasser la capacité max de la villa, sinon message d'erreur bloquant)

- Date d'arrivée / date de départ

- Nombre de nuits (calculé automatiquement)

- Montant total = (prix/nuit x nombre de nuits) + frais de ménage, caution affichée séparément

- Référence de réservation unique générée automatiquement

- Statut : "En attente de virement" / "Virement confirmé" / "Annulée"

### Paramètres admin

- IBAN / BIC modifiables à tout moment

- Nom de la banque et titulaire du compte

## PARCOURS VISITEUR

1. **Page d'accueil** : hero avec accroche + CTA "Réserver ma villa", présentation de 3-4 villas en vedette (photo, nom, prix/nuit, capacité), section "Comment ça marche" en 4 étapes (Choisissez votre villa → Sélectionnez vos dates → Effectuez le virement → Recevez votre confirmation), footer avec contact.

2. **Page "Nos Villas"** : grille de toutes les villas actives avec filtres par nombre de personnes et par gamme de prix. Chaque carte affiche photo, nom, prix/nuit, capacité max, badge de disponibilité. Cette grille doit s'actualiser automatiquement dès qu'une nouvelle villa est ajoutée et activée par l'admin.

3. **Page détail villa** : galerie photo, description complète, liste des équipements, capacité max, calendrier affichant les dates déjà réservées/bloquées en grisé, tarif détaillé (prix/nuit, frais de ménage, caution), bouton "Réserver cette villa".

4. **Tunnel de réservation** (étapes claires avec barre de progression) :

   - Étape 1 : sélection des dates d'arrivée/départ sur un calendrier (dates indisponibles non cliquables)

   - Étape 2 : formulaire client (nom, email, téléphone, nombre de personnes) — bloquer la validation si le nombre de personnes dépasse la capacité max avec un message clair

   - Étape 3 : récapitulatif complet (villa, dates, nombre de nuits, prix/nuit, frais de ménage, caution, montant total à virer)

   - Étape 4 : page de paiement affichant l'IBAN, le BIC, le nom du titulaire, et une référence de virement unique à indiquer obligatoirement par le client. Bouton "J'ai effectué le virement" pour confirmer l'envoi de la demande.

   - Étape 5 : page de confirmation avec génération automatique d'un premier document téléchargeable "Demande de réservation" (PDF ou vue imprimable) reprenant toutes les infos + référence + statut "En attente de vérification du virement".

5. Une fois l'admin valide manuellement le virement reçu, le statut de la réservation passe à "Virement confirmé" et un second document "Confirmation de réservation" est généré automatiquement et devient téléchargeable par le client (via un lien envoyé par email ou accessible avec la référence de réservation).

## ESPACE ADMIN (accès sécurisé par connexion)

- **Tableau de bord** : nombre de réservations en attente, réservations confirmées ce mois-ci, taux d'occupation global

- **Gestion des villas (illimitée et évolutive)** : l'admin doit pouvoir ajouter une nouvelle villa à tout moment via un formulaire simple (nom, description, photos, prix/nuit, capacité max, chambres/salles de bain, équipements, frais de ménage, caution, statut actif/inactif), sans limite de nombre de villas. Le catalogue public doit automatiquement s'actualiser dès qu'une nouvelle villa est ajoutée et activée. L'admin peut aussi désactiver temporairement une villa (par exemple hors saison) sans la supprimer définitivement, ou la modifier/supprimer si nécessaire.

- **Gestion des disponibilités** : par villa, un calendrier permettant de bloquer/débloquer manuellement des dates (travaux, usage personnel, etc.)

- **Gestion des réservations** : liste filtrable par statut, détail de chaque réservation, bouton pour valider un virement reçu (déclenche le passage au statut "confirmé" et la génération du second justificatif)

- **Paramètres bancaires** : formulaire pour modifier l'IBAN, le BIC et le nom du titulaire à tout moment

## STYLE & TON

- Design moderne, épuré, ambiance tropicale chaleureuse (turquoise, blanc, touches de bois/vert)

- Typographie lisible, mise en page aérée avec beaucoup de visuels

- Ton du copywriting : chaleureux, rassurant, professionnel, orienté "expérience de vacances en Guadeloupe"

- Site responsive (mobile-first, beaucoup de visiteurs réserveront depuis leur téléphone)

## ICÔNES & ANIMATIONS

- Utiliser la bibliothèque d'icônes Font Awesome pour toutes les icônes du site (équipements des villas comme piscine/wifi/climatisation/parking, réseaux sociaux, étapes du parcours de réservation, boutons, tableau de bord admin, etc.)

- Ajouter des animations en JavaScript pour dynamiser l'expérience utilisateur :

  - Animation d'apparition en fondu/glissement (fade-in / slide-in) au scroll pour les sections de la page d'accueil et les cartes de villas

  - Transition animée entre les étapes du tunnel de réservation (barre de progression animée)

  - Effet de survol (hover) animé sur les cartes de villas et les boutons (légère mise à l'échelle ou changement d'ombre)

  - Animation de chargement/succès lors de la génération des justificatifs de réservation

  - Micro-interactions sur le calendrier de disponibilité (sélection de dates animée)

- Les animations doivent rester fluides et discrètes, sans ralentir le site ni nuire à l'expérience sur mobile

## BASE DE DONNÉES

- Générer automatiquement une base de données (Supabase) correspondant à la structure de données décrite ci-dessus (tables Villa, Réservation, Paramètres admin), avec les relations nécessaires entre les villas et leurs réservations.

## CONTRAINTES IMPORTANTES

- Aucune intégration de paiement en ligne (pas de Stripe, pas de carte bancaire) — uniquement affichage de l'IBAN et validation manuelle par l'admin

- Le nombre de personnes ne doit jamais pouvoir dépasser la capacité max de la villa sélectionnée

- Les dates déjà réservées ou bloquées doivent être visuellement désactivées dans tous les calendriers publics

- Les deux justificatifs (demande + confirmation) doivent être clairement différenciés (mention du statut visible en gros sur le document)

- Le catalogue de villas doit être conçu pour grandir dans le temps sans aucune limite technique sur le nombre de villas ajoutables par l'admin

- Utiliser Font Awesome pour l'iconographie et des animations JavaScript légères pour les interactions et transitions, sans surcharger les performances du site

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://caraibes-villa-escapes.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/87dab0ec-7977-4177-b7c6-82f2f4e7bfbb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
