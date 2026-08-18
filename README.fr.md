# ClickBook

> **Enregistrez des onglets en 1 clic et laissez l'IA les organiser automatiquement dans des dossiers.**

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-CN.md)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/junpa)

---

ClickBook est un outil puissant de gestion de favoris et de productivité développé sur Chrome Manifest V3. Il vous permet d'enregistrer instantanément votre onglet actif en un clic et l'organise automatiquement dans des catégories grâce à l'IA embarquée de Chrome (Gemini Nano) ou un système de règles de secours.

## Captures d'écran

| Popup | Tableau de bord |
|---|---|
| Enregistrement en 1 clic depuis l'icône | Gestion hiérarchique sur un onglet dédié |

---

## Fonctionnalités principales

| # | Fonctionnalité | Description |
|---|---|---|
| 1 | **Enregistrement en 1 clic** | Enregistrez instantanément l'onglet actif en cliquant sur l'icône de l'extension. |
| 2 | **Classification par IA** | Utilise Chrome Gemini Nano (`window.ai`) pour analyser l'URL/titre et classer dans les dossiers. |
| 3 | **Réorganisation en masse par IA** | Un clic dans la barre latérale pour reclasser l'ensemble de vos favoris (avec sauvegarde automatique). |
| 4 | **Étiquetage automatique** | L'IA génère automatiquement des tags pour les favoris non étiquetés en arrière-plan. |
| 5 | **Centre de contrôle des tâches** | Panneau unifié en temps réel pour suivre les tâches d'organisation IA en arrière-plan. |
| 6 | **Nuage de tags IA** | Nuage de tags interactif aux couleurs HSL pour filtrer, fusionner et modifier vos tags. |
| 7 | **Dossiers hiérarchiques** | Gestion d'arborescence à plusieurs niveaux, renommage, déplacement et icônes personnalisées. |
| 8 | **Glisser-Déposer (Drag & Drop)** | Réorganisation fluide et intuitive des favoris et dossiers. |
| 9 | **Sauvegarde & Restauration** | Exportez et importez l'intégralité de vos favoris et dossiers au format JSON. |
| 10 | **Synchronisation Chrome** | Synchronisation bidirectionnelle fluide avec les favoris natifs de Chrome. |
| 11 | **Thèmes visuels** | Prise en charge des modes Clair et Sombre (Light/Dark) et du thème système. |
| 12 | **100 % Hors ligne & Privé** | Fonctionne entièrement en local via `chrome.storage.local`. Aucune donnée n'est envoyée sur le cloud. |
| 13 | **Multilingue** | Expérience localisée complète pour 8 langues (Français, Anglais, Coréen, Japonais, Allemand, Espagnol, Chinois traditionnel, Chinois simplifié). |
| 14 | **Web Clipper IA (Premium)** | Sélectionnez du texte et enregistrez-le sous forme de notes multilingues améliorées par l'IA. |
| 15 | **Mise en veille intelligente (Premium)** | Mettez en pause les onglets inactifs pour économiser jusqu'à 90 % de RAM. |
| 16 | **Synchronisation des groupes d'onglets (Premium)** | Sauvegardez et restaurez vos groupes d'onglets Chrome dans des dossiers organisés. |
| 17 | **Nettoyeur de session privée (Premium)** | Suppression automatique des cookies et du cache à la fermeture des onglets sensibles. |
| 18 | **Recherche Plein Texte FTS (Premium)** | Indexe et recherche dans le texte intégral de toutes vos pages enregistrées. |
| 19 | **Mode Lecture Zen (Premium)** | Lecteur épuré sans publicité avec thèmes sépia/sombre et table des matières. |
| 20 | **Nettoyeur de doublons** | Détection et suppression rapide des URL en double dans tous vos dossiers. |
| 21 | **Carte mentale visuelle (Premium)** | Espace infini de mind mapping 2D avec extension d'idées par IA et sync TODO. |
| 22 | **Classements de tendances** | Tableaux de bord en direct pour GitHub, Hugging Face, Hacker News et Wikipedia. |
| 23 | **Tableau Kanban TODO** | Gestion de projet visuelle complète avec priorités, échéances et notifications. |
| 24 | **Calendrier intelligent (Premium)** | Calendrier synchronisé avec tâches TODO et jours fériés officiels de France et du monde. |
| 25 | **Notes Spirales Analogiques (Premium)** | Espace de prise de notes riche propulsé par Tiptap et toile de dessin libre. |
| 26 | **ClickBook Buddy & Minuteur Focus (Premium)** | Compagnons de bureau interactifs avec minuteur Pomodoro et menu radial à 9 actions. |
| 27 | **Palette de commandes rapide** | Accédez à toutes vos fonctionnalités et favoris en quelques millisecondes via `Ctrl+K`. |

---

## Licence

Ce projet est sous licence MIT. Consultez le fichier [LICENSE](./LICENSE) pour plus de détails.
