# CommentaireTexte Learner

**Prototype — UI inspirée de Duolingo**

Application web pour Duolingo Like qui permet de révisé le bac de français en important photo/fichier json contenant probblématique, registre littéraire, ainsi que partie de dévellopement.

---

## ✨ Fonctionnalités principales

* Import de dossiers via sélecteur ou glisser-déposer
* Aperçu image/PDF de la lecture linéaire
* Lecture du JSON et génération de questions
* Interface en cartes, responsive et mobile-friendly
* Barre de progression verte arrondie en bas et indicateur de streak animé
* 4 modes d'apprentissage, classique; contre la montre; flashcard; blitz

---

## Structure attendue d'un dossier de leçon

Pour une leçon "l1" (exemple) :

- l1.png  (ou l1.jpg, l1.pdf)
- l1.json — contient des clés/valeurs :

```json
{
  "Mouvement littéraire": "...",
  "Problématique": "...",
  "Grand 1": "...",
  "Grand 2": "...",
  "Grand 3": "..."
}
```

---

## Utilisation

1. Ouvrir `index.html` dans un navigateur.
2. Glisser-déposer un dossier de leçons ou cliquer sur la zone.
3. Répondre aux questions, utiliser "Vérifier", "Passer" et "Suivant".

---

© GLOXIOU