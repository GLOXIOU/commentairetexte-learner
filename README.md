# CommentaireTexte Learner

**Prototype — UI inspirée de Duolingo**

Application web pour Duolingo Like qui permet de révisé le bac de français en important photo/fichier json contenant probblématique, registre littéraire, ainsi que partie de dévellopement.

---

## ✨ Fonctionnalités principales

* Import de dossiers via sélecteur (webkitdirectory) ou glisser-déposer
* Aperçu image/PDF de la leçon
* Lecture du JSON (format standard ou fallback lignes) et génération de questions
* Interface en cartes, responsive et mobile-friendly
* Barre de progression verte arrondie en bas et indicateur de streak animé

---

## Structure attendue d'un dossier de leçon

Pour une leçon "l1" (exemple) :

- l1.png  (ou l1.jpg, l1.pdf)
- l1.json — contient des clés/valeurs :

```json
{
  "Problématique": "Analyser...",
  "Registre littéraire": "Lyrique",
  "Grand 1": "Première partie...",
  "Grand 2": "Deuxième partie..."
}
```

Le parser accepte aussi un fichier texte avec une clé par ligne (fallback simple).

---

## Utilisation

1. Ouvrir `index.html` dans un navigateur.
2. Glisser-déposer un dossier de leçons ou cliquer sur la zone.
3. Répondre aux questions, utiliser "Vérifier", "Passer" et "Suivant".

---

© GLOXIOU