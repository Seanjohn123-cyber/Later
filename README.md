# Later.

> **Save now. Check it when you're ready.**

[![PWA](https://img.shields.io/badge/PWA-installable-blueviolet)](https://github.com/Seanjohn123-cyber/Later)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)

Later is a **Progressive Web App** that lets you save social media posts, YouTube videos, Facebook links, TikToks — anything you find while scrolling — so you can check them out later without losing them when the feed refreshes.

## ✨ Features

- 📱 **Share Target** — tap "Share" on any post in YouTube, Facebook, TikTok, Instagram and pick Later. It captures the link instantly.
- 🔖 **Save & Organize** — add a personal note explaining why you saved it, add a tag (e.g. *exam prep*, *business*), and mark items as Done.
- 🔍 **Search** — instantly search across your saved titles, notes, tags, and URLs.
- 📋 **Export** — copy all saved items to your clipboard as plain text.
- ✈️ **100% Offline** — powered by a Service Worker. Works with no internet after first install.
- 💾 **No Account Needed** — all data stored locally in your browser (localStorage).

## 🎨 Design

Bold Editorial aesthetic — cream background, sharp square borders, uppercase typography, vivid red-orange (`#ff3d00`) accent. Inspired by Swiss brutalist graphic design.

## 🚀 Install as App

1. Open the deployed link in **Chrome on Android** or **Safari on iOS**.
2. Tap the browser menu → **"Add to Home Screen"** (Android) or **"Share → Add to Home Screen"** (iOS).
3. Later is now a standalone app on your home screen.

## 📁 Project Structure

```text
later/
├── index.html       # Full PWA (UI + logic — single file)
├── manifest.json    # Web App Manifest (icons, share target, theme)
├── sw.js            # Service Worker (offline caching)
└── icons/
    ├── icon-192.png # App icon — 192×192px
    └── icon-512.png # App icon — 512×512px
```

## 🛠️ Local Development

No build step, no dependencies. Just open `index.html` in a browser:

```bash
git clone https://github.com/Seanjohn123-cyber/Later.git
cd Later
# Open index.html directly in Chrome/Edge
```

> **Note:** The Share Target feature only works when the PWA is installed and served over HTTPS (not `file://`).

## ☁️ Deploy

Works on any static host:
- **Vercel:** connect the repo, deploy root directory, done.
- **Netlify:** drag the `later/` folder into Netlify Drop.
- **GitHub Pages:** enable Pages on `main` branch, set source to `/` (root).

## 📄 License

MIT License
