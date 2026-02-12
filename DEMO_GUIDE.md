# NMDC Energy - Digital Solutions Demo Guide

> **Platform Overview**: AI-powered industrial asset management platform demonstrating IoT sensor integration, real-time monitoring, and predictive analytics for crane operations, marine vessels, and offshore assets.

---

## Table of Contents

1. [Crane Efficiency Improvement](#1-crane-efficiency-improvement)
2. [Marine Asset Monitoring](#2-marine-asset-monitoring)
3. [Predictive Maintenance](#3-predictive-maintenance)
4. [ESG & Emissions Tracking](#4-esg--emissions-tracking)
5. [Fleet Orchestration](#5-fleet-orchestration)
6. [Demo Navigation Quick Reference](#6-demo-navigation-quick-reference)

---

## 1. Crane Efficiency Improvement

**URL**: `/crane-iot`

### Overview
The Crane IoT Dashboard demonstrates how IoT sensors mounted on crane hooks capture and analyze data on material flow, production rates, and crane utilization. AI technology classifies items, measures weights, and tracks lift cycles.

### Key Features to Demo

#### 1.1 Live Camera Feeds
**Location**: Left panel, "Live Camera Feeds" section

- **4 Camera Views**: Hook cam, load cam, boom cam, ground cam
- **AI-Enabled Detection**: Purple "AI" badge indicates active machine vision
- **Live Status**: Amber pulsing indicator shows cameras connecting/streaming
- **Use Case**: "These cameras provide live feeds for review of lift sequences and enable AI to classify materials being lifted."

#### 1.2 Hook IoT Sensors
**Location**: Left panel, "Hook IoT Sensors" section

| Sensor | What It Measures | Demo Point |
|--------|------------------|------------|
| Load Cell | Current weight on hook | "Real-time weight ensures we don't exceed safe working load" |
| Boom Angle | Crane arm angle | "Monitors for tip-over risk conditions" |
| Hoist Speed | Lifting velocity | "Detects overspeeding that could compromise safety" |
| Vibration | Hook/cable vibration | "Early warning for mechanical issues" |
| Proximity | Objects near hook | "Collision avoidance with personnel and structures" |
| Accelerometer | Sudden movements | "Detects swing, shock loads, and unsafe maneuvers" |

**Demo Flow**:
1. Point out the real-time updating values
2. Show the normal range indicators (green = normal, amber = warning, red = critical)
3. Explain: "Each sensor has configurable thresholds based on crane specifications"

#### 1.3 Production Metrics Dashboard
**Location**: Center panel, top metrics row

| Metric | Description | Demo Point |
|--------|-------------|------------|
| Today's Lifts | Progress toward daily target | "We can track against daily production goals" |
| Lifts/Hour | Current production rate | "Real-time productivity measurement" |
| Total Tonnage | Cumulative material moved | "Tracks material flow for planning" |
| Efficiency % | Utilization rate | "Identifies idle time and optimization opportunities" |

**Talking Point**: "This data improves construction planning and scheduling by providing accurate material flow insights."

#### 1.4 AI Item Classification
**Location**: Center panel, "AI Item Classification" section

- Shows recently detected items: steel beams, concrete blocks, pipes, equipment
- Each item shows:
  - **Classification**: What the AI identified
  - **Weight**: Measured from load cell
  - **Confidence**: AI certainty percentage
  - **Timestamp**: When detected

**Demo Flow**:
1. Click on an item to expand details
2. Explain: "AI classifies items automatically, enabling inventory tracking and ensuring correct rigging procedures"

#### 1.5 Lift Cycle Timeline
**Location**: Center panel, "Lift Cycle Timeline" section

Each lift shows:
- **Item Classification**: What was lifted
- **Load Weight**: In tonnes
- **Duration**: Cycle time in seconds
- **Safety Score**: Overall safety rating

**Click to Expand** a lift to see:
- **Safety Score Breakdown**:
  - Load Control (swing, stability)
  - Speed Compliance
  - Zone Safety (exclusion zone compliance)
  - Rigging Quality
  - Communication score
- **Warnings**: Any safety issues detected
- **AI Recommendation**: Suggested actions

**Talking Point**: "This detailed breakdown helps identify and correct unsafe behaviors among operators."

#### 1.6 Safety Monitoring
**Location**: Right panel, "Safety Monitoring" section

Shows real-time safety events:
- **Near Miss**: Close call incidents
- **Unsafe Behavior**: Worker safety violations
- **Zone Violation**: Personnel in exclusion zones
- **Overload**: Weight limit exceeded
- **Speed Violation**: Operating too fast
- **Fatigue Warning**: Operator shift duration

**Demo Flow**:
1. Click on a safety event
2. Show the linked lift cycle (if applicable)
3. Highlight the AI recommendation

**Talking Point**: "Safety events are linked to specific lift cycles, enabling precise incident analysis and training."

#### 1.7 Predictive AI Panel
**Location**: Right panel, bottom section

Shows AI-generated predictions:
- **Failure Predictions**: "Main Hoist Failure Risk - 24-48 hours"
- **Maintenance Alerts**: "Boom System Maintenance Due - 7-14 days"
- **Optimization Suggestions**: "Performance Optimization Opportunity"

**Demo Flow**:
1. Show the analysis steps (scanning, analyzing, correlating, generating)
2. Click on a prediction to expand
3. Show the confidence score and recommendation

---

## 2. Marine Asset Monitoring

**URL**: `/` (Main Dashboard) and `/live` (Fleet Map)

### Overview
Real-time visibility and control over all marine vessels and offshore assets by tracking location, health, performance, fuel usage, and safety conditions.

### Key Features to Demo

#### 2.1 Fleet Dashboard
**URL**: `/`

**Left Sidebar - Fleet Status**:
| Metric | Description | Data Source |
|--------|-------------|-------------|
| Online | Vessels transmitting AIS | Live AIS |
| At Sea | Vessels with health > 60% | Simulated |
| Total Crew | Personnel across fleet | Static profiles |
| Health % | Average equipment health | Simulated |

**Demo Flow**:
1. Show the vessel list with health indicators
2. Click a vessel to select it
3. Show the status badge (green pulse = online)

#### 2.2 Live Fleet Map
**URL**: `/live`

- **Interactive Map**: Dark-themed CartoDB basemap
- **Vessel Markers**: Color-coded by type
  - 🟠 Dredger
  - 🔴 Hopper Dredger
  - 🟣 CSD (Cutter Suction Dredger)
  - 🟢 Tug
  - 🔵 Supply Vessel
  - 🟡 Barge/Crane Barge
  - 🔵 Survey Vessel

**Demo Flow**:
1. Click on a vessel marker
2. Show the vessel info popup (speed, heading, health)
3. Click "Details" to navigate to vessel detail page

#### 2.3 Live Vessels Panel
**Location**: Right sidebar, "Live" tab

Shows real-time AIS data:
- **Position**: Lat/Lng coordinates
- **Speed**: Current speed in knots
- **Heading**: Compass direction
- **Last Update**: Time since last AIS transmission

**Data Source Indicator**:
- 🟢 Live AIS - Real-time data
- 🔵 Cached - Saved data (conserves API credits)
- 🟡 Simulated - Demo data when offline

#### 2.4 Vessel Detail Page
**URL**: `/vessel/[mmsi]` (click on any vessel)

**Tabs**:
| Tab | Features |
|-----|----------|
| Overview | Specifications, live sensors, capabilities, equipment status |
| 3D Digital Twin | Interactive 3D model with sensor overlays |
| Systems & Maintenance | Equipment list, work orders, PM recommendations |
| Resolve | AI-powered troubleshooting assistant |

**Live Sensor Data** (Overview tab):
- **Main Engine**: RPM, temperature, oil pressure, fuel rate, running hours
- **Generator**: Load %, voltage, frequency, fuel level
- **Navigation**: GPS accuracy, compass heading, wind speed/direction
- **Safety Systems**: Fire alarms, bilge level, lifeboat status, EPIRB

**Demo Flow**:
1. Navigate to vessel detail
2. Show the live sensor panel with real-time values
3. Point out status indicators (green = normal, amber = warning, red = critical)

#### 2.5 Project Site Tracking
**Location**: Left sidebar, "Projects" tab

Shows all project sites:
- **Status**: Active, Planned, Completed
- **Progress**: % complete with progress bar
- **Assigned Vessels**: Ships working on project
- **Client**: Project owner

**Demo Flow**:
1. Switch to Projects tab
2. Click on an active project
3. Show assigned vessels and progress metrics

---

## 3. Predictive Maintenance

**URL**: Accessible from any vessel detail page

### Overview
AI-powered system that analyzes real-time sensor data to provide actionable insights for equipment health, failure prediction, and maintenance optimization.

### Key Features to Demo

#### 3.1 Predictive AI Panel
**Location**: Vessel detail page (right column) or Crane IoT (right panel)

**Analysis Steps** (animated):
1. Scanning equipment health scores
2. Analyzing sensor patterns
3. Correlating alert signatures
4. Running predictive models
5. Generating recommendations

**Prediction Types**:
| Type | Icon | Description |
|------|------|-------------|
| 🔴 Failure | ⚠️ | Imminent component failure risk |
| 🔧 Maintenance | 🔧 | Scheduled maintenance needed |
| 🛡️ Safety | 🛡️ | Safety-related concerns |
| ⚡ Optimization | ⚡ | Performance improvement opportunities |

**Demo Flow**:
1. Wait for analysis animation to complete
2. Click on a prediction to expand
3. Show the metrics (health %, temperature, vibration)
4. Highlight the AI recommendation
5. Point out the confidence score and timeframe

#### 3.2 3D Digital Twin with Sensor Overlay
**URL**: Vessel detail page, "3D Digital Twin" tab

**Features**:
- **3D Vessel Model**: Rotatable, zoomable ship model
- **Sensor Points**: Color-coded dots on equipment
  - 🟢 Green = Normal
  - 🟡 Yellow = Warning
  - 🔴 Red = Critical
- **Heatmap Views**: Temperature, vibration, stress patterns

**Demo Flow**:
1. Navigate to Digital Twin tab
2. Rotate the model using mouse
3. Click on a sensor point to see details
4. Toggle heatmap modes (left controls)
5. Show the Predictions Panel on the right

#### 3.3 Systems & Maintenance Tab
**URL**: Vessel detail page, "Systems & Maintenance" tab

**Left Panel - Systems List**:
- All vessel systems with health scores
- Click to see component details

**Center Panel - System Details**:
- Components and manufacturers
- Failure modes with MTBF (Mean Time Between Failures)
- PM intervals

**Right Panel - Maintenance Intelligence**:
- **Past Work Orders**: Recent CM (Corrective) and PM (Preventive) maintenance
- **PM Recommendations**: AI-generated suggestions
  - "Increase PM frequency for bearings"
  - "Extend oil change interval based on analysis"
  - "Schedule overhaul at OEM-recommended hours"
- **PM Schedule**: Upcoming maintenance windows

**Talking Points**:
- "Acting on predictive insights avoids failures, downtime, waste and inefficiencies"
- "Provides real-time project and asset health status"
- "Live insights offer new ways to control, coordinate and collaborate"

#### 3.4 Resolve - AI Troubleshooting
**URL**: Vessel detail page, "Resolve" tab or `/troubleshoot`

**Features**:
- **AI Chat Interface**: Natural language queries about equipment issues
- **OEM Manual Integration**: Queries manufacturer documentation
- **P&ID Access**: Links to piping and instrumentation diagrams
- **Root Cause Analysis**: Suggests diagnostic steps

**Demo Flow**:
1. Navigate to Resolve tab
2. Show how to query about a specific issue
3. Demonstrate equipment context (vessel, system)
4. Show quick action buttons (Upload Photo, Report Issue)

---

## 4. ESG & Emissions Tracking

**URL**: `/esg`

### Overview
Environmental, Social & Governance intelligence center for tracking emissions, compliance, and decarbonization pathways.

### Key Features to Demo

#### 4.1 Overview Dashboard
| Metric | Description |
|--------|-------------|
| Total CO₂ | Fleet-wide emissions in tonnes |
| Fuel Consumed | Total fuel usage in kiloliters |
| Avg Efficiency | g CO₂ per tonne-mile |
| ESG Score | Overall score out of 100 |
| Compliance | Targets on track |

#### 4.2 ESG Score Breakdown
- **Environmental**: Emissions, fuel efficiency, spill prevention
- **Social**: Crew safety, training, welfare
- **Governance**: Compliance, reporting, audits

#### 4.3 Vessel Emissions Tab
Detailed per-vessel emissions:
- CO₂, NOx, SOx emissions
- Fuel type (HFO, MDO, LNG)
- CII Rating (A-E)
- Efficiency vs fleet average

#### 4.4 Compliance Tab
Regulatory targets with status:
- IMO 2030 targets
- EU ETS requirements
- MARPOL compliance
- Status: On Track / At Risk / Behind

#### 4.5 Decarbonization Pathway
Multi-year roadmap:
- Investment required
- Expected savings
- Payback period
- Phase initiatives (LNG conversion, shore power, etc.)

**Export Features**:
- Export CSV: Download emissions data
- Generate ESG Report: Printable HTML report

**Talking Point**: "Increased visibility of emissions and energy usage, driving greater understanding, ownership and action to reduce emissions in support of net-zero goals."

---

## 5. Fleet Orchestration

**URL**: `/orchestration`

### Overview
Mission control and resource allocation for optimizing vessel assignments across projects.

### Key Features to Demo

#### 5.1 Gantt Chart
Visual timeline of:
- Vessel assignments
- Project timelines
- Conflicts highlighted in red

#### 5.2 Schedule Optimizer
AI-powered suggestions:
- **Reschedule**: Move tasks to optimal times
- **Reroute**: Change vessel paths
- **Reassign**: Switch vessels between projects
- **Delay/Accelerate**: Adjust timelines

**Demo Flow**:
1. Hover over a suggestion to see affected vessels highlighted
2. Click "Optimize Schedule" to run AI optimization
3. Review the optimization results

#### 5.3 Conflict Detection
Automatic detection of:
- Double-booking
- Resource conflicts
- Maintenance overlaps

#### 5.4 Project Cards
Quick view of:
- Project progress
- Budget spent vs allocated
- Assigned vessels
- Location

---

## 6. Demo Navigation Quick Reference

| Feature | URL | Key Demo Points |
|---------|-----|-----------------|
| **Main Dashboard** | `/` | Fleet overview, vessel list, alerts |
| **Crane IoT** | `/crane-iot` | IoT sensors, AI classification, safety |
| **Fleet Map** | `/live` | AIS tracking, vessel positions |
| **Vessel Detail** | `/vessel/[mmsi]` | Specifications, sensors, 3D model |
| **ESG Center** | `/esg` | Emissions, compliance, decarbonization |
| **Orchestration** | `/orchestration` | Scheduling, optimization, conflicts |
| **Troubleshoot** | `/troubleshoot` | AI-powered fault diagnosis |
| **Routes** | `/routes` | Route planning and optimization |

---

## Demo Script - Suggested Flow

### Opening (2 min)
1. Start at main dashboard (`/`)
2. Show fleet overview and metrics
3. Point out live data indicators

### Crane Efficiency (5 min)
1. Navigate to `/crane-iot`
2. Show live sensors and camera feeds
3. Demonstrate lift timeline with safety scores
4. Expand a safety event to show AI recommendation

### Marine Asset Monitoring (5 min)
1. Return to `/`
2. Select a vessel from the list
3. Navigate to vessel detail page
4. Show live sensor data and specifications
5. Quick demo of 3D Digital Twin

### Predictive Maintenance (5 min)
1. Stay on vessel detail page
2. Show Predictive AI panel predictions
3. Navigate to Systems & Maintenance tab
4. Show work order history and PM recommendations
5. Quick demo of Resolve troubleshooting

### ESG & Compliance (3 min)
1. Navigate to `/esg`
2. Show emissions dashboard
3. Highlight compliance status
4. Show decarbonization pathway

### Closing (2 min)
1. Navigate to `/orchestration`
2. Show Gantt chart and optimization
3. Summarize key benefits:
   - Real-time visibility
   - Predictive insights
   - Operational efficiency
   - Safety enhancement
   - ESG compliance

---

## Technical Notes for Demo

### Data Sources
- **Live AIS**: Real vessel positions (rate-limited)
- **Simulated**: Sensor data, health scores, emissions
- **Static**: Vessel specifications, fleet profiles

### Performance Tips
- First load may take 2-3 seconds (API calls)
- Use "Cached" mode to conserve API credits
- 3D Digital Twin requires WebGL support

### Common Questions

**Q: Is this real AIS data?**
A: Yes, vessel positions are from live AIS feeds. Sensor data is simulated for demo purposes.

**Q: How does the AI work?**
A: The predictive models analyze patterns in sensor readings, correlate with historical failure data, and generate predictions with confidence scores.

**Q: Can this integrate with existing systems?**
A: Yes, the platform is designed with API-first architecture and can integrate with SCADA, ERP, and CMMS systems.

---

*Last Updated: January 2026*
*Platform Version: 2.0*







