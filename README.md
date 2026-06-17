# StoryBridge

**StoryBridge** is a premium, modern web application that lets users capture, preserve, and share their life stories in beautiful, interactive formats. Built with React, Vite, and Tailwind CSS, the UI follows a glass‑morphism design language with smooth motion effects, hover animations, and responsive layouts.

---

## ✨ Features
- **Story Capsules** – Organize memories, photos, and daily stories into digital time‑capsules.
- **Memory Timeline** – Chronological visual journey of a user's milestones.
- **Friendship Journey** – Dedicated spaces for deep connections between users.
- **Vibrant Communities** – Interest‑driven groups for sharing and discussion.
- **Real‑time Messaging** – Instant chat with typing indicators and read receipts.
- **Year‑Wrapped** – Annual summary of a user's activity.
- **Glass‑morphism UI** – Premium look with gradients, glassy cards, and subtle shadows.
- **Motion Design** – Fade‑up section reveals, staggered card animations, smooth page transitions, and enhanced button hover effects.
- **Responsive** – Fully adaptive across mobile, tablet, and desktop.

---

## 🛠️ Tech Stack
- **Framework**: React 19 (with React Router v7)
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS 4 (custom CSS for glass‑morphism & animations)
- **Animations**: `motion/react`
- **Icons**: `lucide-react`
- **State Management**: Zustand
- **Data Layer**: Supabase client (`@supabase/supabase-js`)
- **Query**: `@tanstack/react-query`
- **Testing/Notifications**: React‑Helmet‑Async, Sonner, React‑Hot‑Toast

---

## 📦 Installation
```bash
# Clone the repository
git clone <repo‑url>
cd StoryBridge/frontend

# Install dependencies
npm install
```

## ▶️ Development
```bash
npm run dev   # Starts Vite dev server (http://localhost:5175)
```
The app supports hot‑module replacement; any changes to components or styles are reflected instantly.

## 📦 Build for Production
```bash
npm run build   # Generates optimized static files in ./dist
```

## 🧪 Lint & Type‑checking
```bash
npm run lint    # (if configured)
npm run type-check   # Runs TypeScript compile (no emit)
```

---

## 📁 Project Structure (highlights)
```
StoryBridge/
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ ui/                # UI primitives (Button, Logo, AnimatedNumber…)
│  │  │  └─ animation/SectionMotion.tsx   # Fade‑up & stagger wrapper
│  │  ├─ pages/               # Route pages (Landing, Feed, Profile…)
│  │  ├─ stores/              # Zustand stores (authStore, uiStore)
│  │  └─ App.tsx
│  ├─ public/                 # Static assets
│  ├─ index.css               # Custom CSS (glass‑morphism, keyframe animations)
│  └─ tsconfig.json
└─ README.md                  # ← this file
```

---

## 🤝 Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/awesome-feature`).
3. Ensure the app runs without errors and all existing tests pass.
4. Submit a pull request with a clear description of the changes.

---

## 📄 License
[MIT License](LICENSE) – feel free to use, modify, and distribute.

---

## 🙏 Acknowledgments
- **Lucide** for the high‑quality icon set.
- **Tailwind Labs** for the utility‑first CSS framework.
- **Framer Motion** (via `motion/react`) for the expressive animation API.
- **Supabase** for the backend‑as‑a‑service layer.

---

*Happy coding!*
