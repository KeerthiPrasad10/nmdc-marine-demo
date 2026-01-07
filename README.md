# NMDC Marine Operations Platform

A next-generation maritime fleet management and digital twin platform built with Next.js, featuring real-time vessel tracking, AI-powered insights, and predictive maintenance.

![Fleet Operations Dashboard](https://via.placeholder.com/800x400?text=Fleet+Operations+Dashboard)

## Features

### 🚢 Fleet Management
- Real-time vessel tracking and monitoring
- Digital twin visualization with 3D vessel models
- Equipment health monitoring and predictive maintenance
- Crew management and safety scoring

### 📡 Live AIS Tracking (Datalastic Integration)
- Real-time vessel positions from global AIS network
- Vessel search by name, MMSI, or IMO number
- Location-based vessel traffic monitoring
- Historical vessel track playback
- Port information and nearby vessel discovery

### 🤖 AI-Powered Insights
- Intelligent operational recommendations
- Predictive maintenance alerts
- Weather impact analysis
- Natural language fleet queries

### 🌍 Route Optimization
- Fuel-efficient route planning
- Weather-aware navigation
- Multi-vessel orchestration
- ETA predictions

### 📊 ESG & Compliance
- Emissions monitoring and reporting
- Regulatory compliance tracking
- Sustainability metrics

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account (for database)
- Optional: Datalastic API key (for live AIS data)
- Optional: Mapbox token (for enhanced maps)

### Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Optional: for image uploads

# AI Configuration (Required for AI features)
ANTHROPIC_API_KEY=your_anthropic_api_key
# or
OPENAI_API_KEY=your_openai_api_key

# Datalastic API (Required for Live AIS Tracking)
# Get your API key at https://datalastic.com/pricing
DATALASTIC_API_KEY=your_datalastic_api_key

# Mapbox (Optional - enhances map visuals)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Live AIS Tracking

This application integrates with the [Datalastic Maritime API](https://datalastic.com/api-reference/) for real-time vessel tracking.

### Available Endpoints

| Feature | API Endpoint | Description |
|---------|-------------|-------------|
| Vessels in Area | `/api/live-vessels?action=radius` | Get all vessels within a radius |
| Single Vessel | `/api/live-vessels?action=single&mmsi=XXX` | Track a specific vessel |
| Vessel Search | `/api/live-vessels?action=search&query=XXX` | Search vessels by name |
| Historical Track | `/api/live-vessels?action=history&mmsi=XXX` | Get historical positions |
| Vessel Details | `/api/live-vessels?action=info&mmsi=XXX` | Get vessel specifications |
| Port Search | `/api/ports?action=search&name=XXX` | Search for ports |
| Nearby Ports | `/api/ports?action=nearby&lat=XX&lng=XX` | Find ports near a location |

### API Usage Examples

```javascript
// Get vessels near Abu Dhabi
const response = await fetch('/api/live-vessels?action=radius&lat=24.8&lng=54.0&radius=100');
const { vessels } = await response.json();

// Search for a specific vessel
const response = await fetch('/api/live-vessels?action=search&query=MAERSK');
const { vessels } = await response.json();

// Get historical track (last 7 days)
const response = await fetch('/api/live-vessels?action=history&mmsi=123456789&days=7');
const { history } = await response.json();
```

### Credit Usage

The Datalastic API uses a credit-based system:
- `/vessel` or `/vessel_pro`: 1 credit per request
- `/vessel_inradius`: 1 credit per vessel found (max 500)
- `/vessel_history`: 1 credit per day per vessel
- `/vessel_info`: 1 credit per request
- `/port_find`: 1 credit per port found

## Project Structure

```
nmdc-marine-demo/
├── app/
│   ├── api/
│   │   ├── live-vessels/     # Datalastic live vessel endpoints
│   │   ├── ports/            # Port search endpoints
│   │   ├── simulation/       # Fleet simulation API
│   │   └── chat/             # AI chat API
│   ├── components/
│   │   ├── FleetMapClient    # Interactive fleet map
│   │   ├── LiveVesselsPanel  # Live AIS vessel list
│   │   ├── ChatPanel         # AI assistant
│   │   └── ...
│   ├── live/                 # Live AIS tracking page
│   ├── orchestration/        # Fleet orchestration
│   ├── routes/               # Route optimization
│   └── esg/                  # ESG dashboard
├── lib/
│   ├── datalastic/           # Datalastic API client
│   ├── simulation/           # Fleet simulation engine
│   └── ...
└── ...
```

## Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Main fleet operations dashboard |
| Live AIS | `/live` | Real-time AIS vessel tracking |
| Orchestration | `/orchestration` | Multi-vessel coordination |
| Routes | `/routes` | Route optimization |
| ESG | `/esg` | Environmental & compliance |
| Demo | `/demo` | Interactive demo scenarios |

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Maps**: Leaflet + Mapbox
- **3D**: Three.js + React Three Fiber
- **AI**: Anthropic Claude / OpenAI
- **AIS Data**: Datalastic Maritime API
- **Charts**: Recharts

## API Rate Limits

Datalastic API has a rate limit of 600 requests per minute. The application implements:
- Request caching
- Automatic retry with backoff
- Batch requests where possible

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Make sure to add all environment variables in the Vercel dashboard.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Acknowledgments

- [Datalastic](https://datalastic.com) - Maritime vessel tracking API
- [OpenSeaMap](https://openseamap.org) - Nautical chart overlay
- [Mapbox](https://mapbox.com) - Map tiles and styling
