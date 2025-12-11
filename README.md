# **DripFrame 👕✨**
AI-Powered Personal Wardrobe & Outfit Generator

DripFrame is a modern, intelligent wardrobe assistant that helps users organize clothes, plan outfits, and generate personalized looks using AI. Built with **TypeScript**, **React**, and the **Gemini API**, DripFrame combines a clean component architecture with smart fashion recommendations.

---

## 🚀 Features

### 🧥 Wardrobe Management
- Upload, categorize, and view clothing items  
- Managed through `Wardrobe.tsx`

### 🤖 AI Outfit Generation
- Generates personalized outfits using Gemini  
- Uses user style, weather, and wardrobe metadata  
- Implementation inside `/services/geminiService.ts`

### 📅 Calendar-Based Outfit Planning
- Schedule and manage daily outfits  
- Implemented in `CalendarView.tsx`

### 👤 User Profile Settings
- Manage preferences like colors, style, and weather tolerance  
- Through `Profile.tsx`

### ☁️ Weather-Aware Recommendations
- Fetches real-time weather  
- Integrates with outfit generation  
- Logic in `/services/weatherService.ts`

### 💾 Saved Outfits
- View past generated outfits  
- Reuse them anytime  
- Component: `SavedOutfits.tsx`

### 🎨 Clean and Modular UI Components
All UI is structured inside `/components`, including:
- `Layout.tsx`
- `Onboarding.tsx`
- `OutfitGenerator.tsx`
- `Wardrobe.tsx`
- etc.

---

## 📁 Project Structure

```

/
├── App.tsx
├── index.html
├── index.tsx
├── metadata.json
├── types.ts
│
├── components/
│   ├── CalendarView.tsx
│   ├── Layout.tsx
│   ├── Onboarding.tsx
│   ├── OutfitGenerator.tsx
│   ├── Profile.tsx
│   ├── SavedOutfits.tsx
│   └── Wardrobe.tsx
│
└── services/
├── geminiService.ts
└── weatherService.ts

````

---

## 🧠 Tech Stack

| Category | Technology |
|---------|------------|
| Frontend Framework | React + TypeScript |
| Build Tool | Vite (or React TS environment) |
| Styling | Custom components |
| AI | Gemini API (Vision + Text) |
| Weather API | OpenWeather (or compatible) |
| Types | Centralized in `types.ts` |

---

## ⚙️ Installation

```bash
git clone https://github.com/yourusername/dripframe.git
cd dripframe
npm install
npm run dev
````

---

## 🔑 Environment Variables

Create a `.env` file:

```
VITE_GEMINI_API_KEY=your_key_here
VITE_WEATHER_API_KEY=your_weather_api_key_here
```

---

## 🧩 Service Architecture

### **`services/geminiService.ts`**

Handles:

* Outfit generation
* Image/wardrobe analysis
* Context reasoning using user metadata

### **`services/weatherService.ts`**

Handles:

* Real-time weather fetching
* Weather → style mapping logic

---

## 🖥️ Main Component Overview

### **`OutfitGenerator.tsx`**

* Sends prompts to Gemini
* Renders outfit suggestions
* Integrates weather + wardrobe data

### **`Wardrobe.tsx`**

* Displays clothing items
* Handles category filtering

### **`Profile.tsx`**

* Allows style customization
* Saves user preferences

### **`CalendarView.tsx`**

* Lets users schedule outfits by date

---

## 🧪 Running & Building

```bash
npm run dev      # start dev server
npm run build    # create production build
npm run preview  # preview production build
```

---

## 📜 License

This project is licensed under the **MIT License** — free to use and modify.

---

## ⭐ Support

If you enjoy using DripFrame, please ⭐ star the repository!

---

## 🙌 Contributions

Contributions are welcome!
Follow the existing `/components` and `/services` architecture when adding new features.
