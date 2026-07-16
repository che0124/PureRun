# PureRun Dashboard

PureRun is a beautiful, personalized Next.js dashboard for visualizing your Garmin Connect running data. It features modern UI components, interactive maps for your routes, and integrates with Google Gemini AI to generate customized training plans based on your actual Garmin telemetry.

## Features

- 🏃 **Garmin Connect Sync**: Seamlessly fetch your recent running activities, stats, and GPX route data.
- 🤖 **AI-Powered Training Plans**: Uses Google Gemini to analyze your recent performance and generate a structured marathon/running training plan.
- 🗺️ **Interactive Route Maps**: Visualizes your GPX data using Leaflet.
- 📊 **Beautiful UI/UX**: Built with Tailwind CSS, Lucide Icons, and Next.js App Router for a premium feel.
- 💾 **Local SQLite Storage**: Uses Prisma with a local SQLite database (`dev.db`), ensuring your data stays fully private and under your control.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/purerun.git
cd purerun
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

Push the Prisma schema to create the local SQLite database structure:

```bash
npx prisma db push
```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Go to the Settings/Sync page on the dashboard.
2. Enter your Garmin Connect Email and Password to sync your data. 
3. *Note: Credentials are never saved to the database. They are only passed to the Garmin API during the sync request. Alternatively, use `demo` as your email to test the dashboard with mock data.*
4. Head to the "Training Plan" section to generate your AI-assisted schedule!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
