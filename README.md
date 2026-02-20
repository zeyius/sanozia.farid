# 🏥 Sanozia

> Suivi médical des maladies inflammatoires de l'intestin (IBD/MICI)

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- Yarn (gestionnaire de paquets)
- Compte Supabase configuré

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd Sanozia_Prototype

# Installer les dépendances
yarn install

# Lancer en développement
yarn dev
```

### Scripts disponibles

```bash
yarn dev      # Serveur de développement
yarn build    # Build de production
yarn lint     # Vérification ESLint
yarn preview  # Prévisualisation du build
```

## 🏗️ Architecture

**Architecture Feature-Driven** - Code organisé par domaines métier avec séparation claire entre `features/` (logique métier) et `shared/` (ressources communes).

## 🛠️ Stack technique

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **Routing**: React Router v7
- **Logging**: Système centralisé personnalisé

## 📚 Documentation

- **[Guide de développement](./DEVELOPMENT.md)** - Documentation technique complète, architecture détaillée, patterns et guide IA

## 🎯 Fonctionnalités

- ✅ Authentification sécurisée
- ✅ Suivi des repas avec détails nutritionnels
- ✅ Suivi des selles (échelle Bristol)
- ✅ Suivi des symptômes
- ✅ Historique et analyse des données
- ✅ Export Excel des données
- ✅ Profil médical complet

## 🔧 Configuration

Variables d'environnement requises dans `.env` :

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
