# AgriNova - AI-Powered Smart Agriculture Platform

## 🌾 Project Overview

AgriNova is an intelligent agricultural management system that helps farmers optimize crop yields, manage resources efficiently, and make data-driven decisions through real-time monitoring, predictive analytics, and AI-powered recommendations.

---

## 🏗️ Technology Stack

- **Frontend**: Next.js 15.5.6, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Next.js API Routes
- **Charts**: Recharts library
- **Authentication**: Supabase Auth
- **AI Integration**: Google Gemini AI (planned)

---

## 📊 Data Sources & Flow

### Input Data
1. **User-Provided**: Farm details (location, area, soil type, irrigation), Crop information (name, planting date, area)
2. **External**: Weather API (OpenWeatherMap), IoT sensors (future)
3. **Database**: Supabase PostgreSQL with tables: users, farms, crops, ai_predictions, weather_data

### Data Processing
All user inputs are stored in Supabase with Row Level Security (RLS). The system queries farmer-specific data using `farmer_id` and generates predictions using research-based agricultural formulas.

---

## 🧮 Calculation Methods

### 1. Yield Prediction
```
Formula: Yield = Yield_per_hectare × Area
```
**Crop-Specific Rates** (ICAR standards):
- Rice: 5.5 t/ha | Wheat: 4.8 t/ha | Corn: 6.2 t/ha | Sugarcane: 70 t/ha
- Potato: 25 t/ha | Cotton: 2.5 t/ha | Soybean: 3.2 t/ha

### 2. Water Requirements
```
Formula: Water = Base_water × Area × Soil_adjustment
```
**Base Requirements** (FAO guidelines):
- Rice: 1200 mm/ha | Wheat: 450 mm/ha | Corn: 600 mm/ha | Sugarcane: 1500 mm/ha

**Soil Adjustments**: Sandy +20%, Clay -10%, Loamy 0%

### 3. Analytics Metrics

**Average Yield**: `Total_yield / Total_area` across all crops

**Water Efficiency**: `60 + (Efficient_irrigation_ratio × 30)` where efficient = drip/sprinkler

**Soil Health**: `5.0 + Soil_type_bonus + Crop_diversity × 1.5` (out of 10)

**Active Crops**: Direct count from database with status = 'active'

### 4. Sustainability Metrics

**Carbon Offset**: `Total_area × 2.5 tonnes CO2/hectare/year` (IPCC standard)

**Water Efficiency Score**: Based on % of area with efficient irrigation (60-100%)

**Soil Health Index**: Composite of soil type, crop diversity, irrigation practices (0-10 scale)

**Biodiversity**: `(Unique_crops / Total_crops) × 10` - measures crop diversity

**Overall Score**: Weighted average (Carbon 30%, Water 25%, Soil 25%, Bio 20%)

### 5. Chart Data Generation

**Yield Trends**: 6-month simulation with growth progression 85%→100%

**Water Usage**: 4-week bar chart comparing actual vs target (target = 110% of avg)

**Soil Composition**: NPK pie chart (Organic Matter 30-40%, N 20-30%, P 18-26%, K remainder)

**Health Trend**: 8-point lifecycle curve showing 70%→95% health progression

---

## 🎯 Key Features

### Dashboard
- **Quick Stats**: Active crops, water needs, predicted yield, farm count
- **Live Weather**: Real-time temperature, humidity, conditions
- **Active Crops**: List with growth stage, planting date, area
- **Sustainability Score**: Carbon offset, water efficiency, soil health

### Analytics Page
- **Performance Metrics**: Avg yield, water efficiency, soil health, active crops
- **Interactive Charts**: Yield trends, water usage, soil composition, crop health
- **Crop Performance**: Individual crop analysis with expected yields

### Smart Recommendations
- **AI Alerts**: Water requirements, growth phase, harvest timing
- **Recommendations**: Yield optimization, irrigation upgrades, soil improvements
- **Plant Analysis**: Image and sound (.wav) analysis for stress detection

---

## 🔧 Setup Instructions

1. **Clone Repository**
```bash
git clone https://github.com/Pankaj52141/AgriNova.git
cd AgriNova
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup** (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_key
OPENWEATHER_API_KEY=your_weather_key
```

4. **Database Setup**
Run `scripts/setup-supabase.sql` in Supabase SQL Editor

5. **Run Development Server**
```bash
npm run dev
```
Access at `http://localhost:3000`

---

## 📱 User Workflow

1. **Register/Login** → Farmer profile created with unique farmer_id
2. **Add Farm** → Input location, area, soil type, irrigation method
3. **Add Crops** → Select crop, planting date, area (auto-generates predictions)
4. **Monitor Dashboard** → View real-time stats, weather, alerts
5. **Analyze Data** → Check yield trends, water usage, sustainability metrics
6. **Act on Recommendations** → Follow AI suggestions for optimization

---

## 📈 Data Accuracy & Standards

- **Yield Rates**: Based on ICAR (Indian Council of Agricultural Research) benchmarks
- **Water Requirements**: FAO (Food and Agriculture Organization) guidelines
- **Carbon Calculations**: IPCC (Intergovernmental Panel on Climate Change) standards
- **All formulas**: Derived from peer-reviewed agricultural research

---

## 🚀 Future Enhancements

- IoT sensor integration (soil moisture, pH, temperature)
- Satellite imagery analysis (NDVI)
- Machine learning model training on historical data
- Mobile app (iOS/Android)
- Pest/disease image recognition
- Marketplace integration

---

## 👥 Project Information

**Developer**: Pankaj Jaiswal  
**GitHub**: [Pankaj52141/AgriNova](https://github.com/Pankaj52141/Fasal-AI)  
**Purpose**: Educational project for sustainable agriculture  
**Last Updated**: December 2, 2025  
**Version**: 1.0.0

---

## 📚 References

1. FAO - Crop Water Requirements and Irrigation Scheduling
2. ICAR - All India Coordinated Research Project on Agrometeorology  
3. IPCC - Climate Change and Agriculture: Carbon Sequestration
4. OpenWeatherMap API Documentation
5. Supabase & Next.js Documentation

---
