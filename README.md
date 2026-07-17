# PureRun Dashboard 🏃‍♂️🤖

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Docker](https://img.shields.io/badge/Docker-Supported-blue?style=for-the-badge&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

PureRun is a beautiful, personalized Next.js dashboard for visualizing your Garmin Connect running data. It features modern UI components, interactive maps for your routes, and integrates with **Google Gemini AI** to generate customized training plans based on your actual Garmin telemetry.

> **Privacy First:** PureRun uses a local SQLite database (`dev.db`). Your Garmin credentials and running data stay entirely on your own machine.

---

## ✨ Features

- 🏃 **Garmin Connect Sync**: Seamlessly fetch your recent running activities, stats, and GPX route data.
- 🤖 **AI-Powered Training Plans**: Uses Google Gemini to analyze your recent performance and generate a structured marathon/running training plan.
- 🗺️ **Interactive Route Maps**: Visualizes your GPX data using Leaflet.
- 📱 **PWA Ready**: Install PureRun directly on your iOS or Android home screen for a native, full-screen app experience.
- 📊 **Beautiful UI/UX**: Built with Tailwind CSS, Lucide Icons, and Next.js App Router for a premium, glassmorphism feel.
- 🐳 **Docker Ready**: One-click deployment with Docker Compose.

---

## 🚀 Getting Started

You can run PureRun either via **Docker (Recommended)**, **locally with Node.js**, or **deploy it to the cloud**.

### Option 1: Cloud Deployment (Vercel)

We offer two ways to deploy on Vercel depending on your needs:

**A. Quick Demo (One-Click Deploy)**
If you just want to test the app quickly without receiving future updates, click the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fche0124%2FPureRun)
*(Note: This creates an independent clone. You won't be able to easily sync future updates from the original repository.)*

**B. Long-Term Use (Highly Recommended)**
If you want to keep your project updated with the latest features and bug fixes:
1. Click the **Fork** button at the top right of this repository.
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
3. **Import** your forked `PureRun` repository.
4. *How to update later:* Simply go to your GitHub repository and click **Sync fork**. Vercel will automatically deploy the latest version!

### Option 2: Run with Docker (Recommended for Self-Hosting)
The easiest way to get started without installing dependencies.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/che0124/PureRun.git
   cd PureRun
   ```

2. **Start the server:**
   ```bash
   docker-compose up -d
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser. (The database is automatically created and persisted in a Docker volume).

### Option 3: Run Locally (Node.js)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/che0124/PureRun.git
   cd PureRun
   ```

2. **One-Click Setup:**
   Run our automated setup script which installs dependencies, initializes the database, and starts the dev server:
   ```bash
   npm run setup
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration & Usage

### 1. Garmin Setup
1. Go to the **Settings** page on the dashboard.
2. Enter your **Garmin Connect Email and Password** to sync your data.
   *(Note: Credentials are never saved to the database. They are only passed to the Garmin API during the sync request. Alternatively, use `demo` as your email to test the dashboard with mock data.)*

### 2. Google Gemini AI Setup (For Training Plans)
To use the AI Coach feature, you need a free Google Gemini API Key.
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Go to the **Settings** page in PureRun and paste your API key into the "Gemini API Key" field.
3. Head to the **AI Plan** section to generate and dynamically adjust your AI-assisted schedule based on your recent Garmin performance!

---

## 🤝 Contributing
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**. Feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
