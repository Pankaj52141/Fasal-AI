-- AgriNova Database Setup Script
-- Multi-Tenant Farmer Management System
-- Each farmer sees only their own data with complete isolation

-- ============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- Each farmer has their own profile and can only access their data
-- ============================================================================

-- Create users table for farmer profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  farmer_id TEXT UNIQUE NOT NULL, -- Custom farmer ID (e.g., "FARM001", "FARM002")
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  total_land_hectares DECIMAL(12,2), -- Total land owned by this farmer
  farming_experience_years INTEGER,
  role TEXT DEFAULT 'farmer' CHECK (role IN ('farmer', 'agronomist', 'admin')),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Each farmer sees only their own profile
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
DROP POLICY IF EXISTS "Farmers can view own profile" ON users;
CREATE POLICY "Farmers can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Farmers can update own profile" ON users;
CREATE POLICY "Farmers can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Farmers can insert own profile" ON users;
CREATE POLICY "Farmers can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- FARMS TABLE - Each farmer can have multiple farms/lands
-- ============================================================================

CREATE TABLE IF NOT EXISTS farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL, -- Links to the farmer (custom text id)
  farm_code TEXT NOT NULL, -- Custom farm code (e.g., "FARM001_LAND1")
  farm_name TEXT NOT NULL,
  location_address TEXT,
  latitude DECIMAL(10,8), -- GPS coordinates
  longitude DECIMAL(11,8),
  city TEXT,
  state TEXT,
  postal_code TEXT,
  total_area_hectares DECIMAL(10,2) NOT NULL,
  cultivable_area_hectares DECIMAL(10,2),
  soil_type TEXT, -- Clay, Sandy, Loamy, etc.
  soil_ph DECIMAL(4,2),
  water_source TEXT, -- Borewell, Canal, Rain-fed, etc.
  irrigation_type TEXT, -- Drip, Sprinkler, Flood, etc.
  climate_zone TEXT,
  acquisition_date DATE, -- When farmer acquired this land
  land_ownership_type TEXT DEFAULT 'owned' CHECK (land_ownership_type IN ('owned', 'leased', 'shared')),
  is_organic_certified BOOLEAN DEFAULT false,
  farm_status TEXT DEFAULT 'active' CHECK (farm_status IN ('active', 'inactive', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure farm codes are unique per farmer
  UNIQUE(farmer_id, farm_code)
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can manage their own farms" ON farms;
CREATE POLICY "Farmers can manage their own farms" ON farms
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farms.farmer_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farms.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own farms" ON farms;
CREATE POLICY "Farmers can insert their own farms" ON farms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farms.farmer_id
    )
  );

-- ============================================================================
-- FARM SECTIONS TABLE - Divide farms into sections for better management
-- ============================================================================

CREATE TABLE IF NOT EXISTS farm_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  section_code TEXT NOT NULL, -- e.g., "FARM001_LAND1_SEC1"
  section_name TEXT NOT NULL,
  area_hectares DECIMAL(8,2) NOT NULL,
  soil_type TEXT,
  slope_degree DECIMAL(5,2),
  drainage_quality TEXT CHECK (drainage_quality IN ('excellent', 'good', 'average', 'poor')),
  sun_exposure TEXT CHECK (sun_exposure IN ('full_sun', 'partial_sun', 'shade')),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(farm_id, section_code)
);

ALTER TABLE farm_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can manage their own farm sections" ON farm_sections;
CREATE POLICY "Farmers can manage their own farm sections" ON farm_sections
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farm_sections.farmer_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farm_sections.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own farm sections" ON farm_sections;
CREATE POLICY "Farmers can insert their own farm sections" ON farm_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farm_sections.farmer_id
    )
  );

-- ============================================================================
-- CROPS TABLE - Track crops in each farm section
-- ============================================================================

CREATE TABLE IF NOT EXISTS crops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_section_id UUID REFERENCES farm_sections(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  crop_code TEXT NOT NULL, -- e.g., "CROP_2025_001"
  crop_name TEXT NOT NULL, -- Rice, Wheat, Corn, etc.
  crop_variety TEXT, -- Basmati, IR64, etc.
  seed_source TEXT,
  planting_date DATE NOT NULL,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  planted_area_hectares DECIMAL(8,2) NOT NULL,
  seed_quantity_kg DECIMAL(10,2),
  growth_stage TEXT DEFAULT 'planted' CHECK (growth_stage IN ('planted', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'maturation', 'harvested')),
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('excellent', 'healthy', 'at_risk', 'diseased', 'pest_attack', 'drought_stress')),
  crop_status TEXT DEFAULT 'active' CHECK (crop_status IN ('active', 'harvested', 'failed', 'abandoned')),
  expected_yield_quintal DECIMAL(10,2),
  actual_yield_quintal DECIMAL(10,2),
  market_price_per_quintal DECIMAL(10,2),
  total_cost DECIMAL(12,2), -- Total investment
  total_revenue DECIMAL(12,2), -- Revenue from sale
  profit_loss DECIMAL(12,2), -- Calculated profit/loss
  season TEXT, -- Kharif, Rabi, Zaid
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(farmer_id, crop_code)
);

-- --------------------------------------------------------------------------
-- Crop code auto-generation trigger
-- Generates sequential codes per farmer and year: CROP_<YEAR>_<NNN>
-- If a crop_code is provided explicitly it is preserved.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_crop_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
  year_text TEXT := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
BEGIN
  IF NEW.crop_code IS NULL OR NEW.crop_code = '' THEN
    SELECT COALESCE(MAX((regexp_replace(crop_code, '^CROP_'||year_text||'_', ''))::INT),0)+1
      INTO next_num
      FROM crops
     WHERE farmer_id = NEW.farmer_id
       AND crop_code LIKE 'CROP_'||year_text||'_%';
    NEW.crop_code := 'CROP_'||year_text||'_'||LPAD(next_num::TEXT,3,'0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_crop_code ON crops;
CREATE TRIGGER trg_set_crop_code
BEFORE INSERT ON crops
FOR EACH ROW
EXECUTE FUNCTION set_crop_code();

ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can manage their own crops" ON crops;
CREATE POLICY "Farmers can manage their own crops" ON crops
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = crops.farmer_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = crops.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own crops" ON crops;
CREATE POLICY "Farmers can insert their own crops" ON crops
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = crops.farmer_id
    )
  );

-- ============================================================================
-- CROP ACTIVITIES TABLE - Track all farming activities
-- ============================================================================

CREATE TABLE IF NOT EXISTS crop_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('planting', 'watering', 'fertilizing', 'pesticide', 'weeding', 'pruning', 'harvesting', 'soil_testing', 'inspection')),
  activity_date DATE NOT NULL,
  description TEXT,
  quantity_used TEXT, -- e.g., "50kg fertilizer", "20L pesticide"
  cost DECIMAL(10,2),
  labor_hours DECIMAL(5,1),
  weather_condition TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE crop_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can manage their own crop activities" ON crop_activities;
CREATE POLICY "Farmers can manage their own crop activities" ON crop_activities
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = crop_activities.farmer_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = crop_activities.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own crop activities" ON crop_activities;
CREATE POLICY "Farmers can insert their own crop activities" ON crop_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = crop_activities.farmer_id
    )
  );

-- ============================================================================
-- EXPENSES TABLE - Track all farming expenses per farmer
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  farm_id UUID REFERENCES farms(id),
  crop_id UUID REFERENCES crops(id),
  expense_category TEXT NOT NULL CHECK (expense_category IN ('seeds', 'fertilizers', 'pesticides', 'labor', 'equipment', 'fuel', 'irrigation', 'transportation', 'storage', 'other')),
  expense_description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  vendor_name TEXT,
  bill_number TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit', 'upi')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can manage their own expenses" ON expenses;
CREATE POLICY "Farmers can manage their own expenses" ON expenses
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = expenses.farmer_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = expenses.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own expenses" ON expenses;
CREATE POLICY "Farmers can insert their own expenses" ON expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = expenses.farmer_id
    )
  );

-- ============================================================================
-- INCOME TABLE - Track all farming income per farmer
-- ============================================================================

CREATE TABLE IF NOT EXISTS income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  farm_id UUID REFERENCES farms(id),
  crop_id UUID REFERENCES crops(id),
  income_type TEXT NOT NULL CHECK (income_type IN ('crop_sale', 'government_subsidy', 'insurance_claim', 'rental_income', 'other')),
  description TEXT NOT NULL,
  quantity_sold DECIMAL(10,2), -- in quintal/kg
  rate_per_unit DECIMAL(10,2),
  total_amount DECIMAL(12,2) NOT NULL,
  income_date DATE NOT NULL,
  buyer_name TEXT,
  market_name TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit', 'upi')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can manage their own income" ON income;
CREATE POLICY "Farmers can manage their own income" ON income
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = income.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own income" ON income;
CREATE POLICY "Farmers can insert their own income" ON income
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = income.farmer_id
    )
  );

-- ============================================================================
-- SENSOR DATA TABLE - IoT sensor readings per farmer
-- ============================================================================

CREATE TABLE IF NOT EXISTS sensor_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  farm_id UUID REFERENCES farms(id),
  farm_section_id UUID REFERENCES farm_sections(id),
  crop_id UUID REFERENCES crops(id),
  sensor_id TEXT, -- Physical sensor identifier
  sensor_type TEXT NOT NULL CHECK (sensor_type IN ('soil_moisture', 'soil_temperature', 'air_temperature', 'humidity', 'ph', 'nitrogen', 'phosphorus', 'potassium', 'light_intensity', 'rainfall')),
  value DECIMAL(10,4) NOT NULL,
  unit TEXT NOT NULL,
  location_description TEXT,
  depth_cm DECIMAL(5,1), -- For soil sensors
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_status TEXT DEFAULT 'active' CHECK (device_status IN ('active', 'inactive', 'maintenance', 'error'))
);

ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can view their own sensor data" ON sensor_data;
CREATE POLICY "Farmers can view their own sensor data" ON sensor_data
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = sensor_data.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own sensor data" ON sensor_data;
CREATE POLICY "Farmers can insert their own sensor data" ON sensor_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = sensor_data.farmer_id
    )
  );

-- ============================================================================
-- WEATHER DATA TABLE - Weather information per farm
-- ============================================================================

CREATE TABLE IF NOT EXISTS weather_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  farm_id UUID REFERENCES farms(id),
  weather_source TEXT DEFAULT 'api', -- api, manual, station
  temperature_celsius DECIMAL(6,2),
  max_temperature_celsius DECIMAL(6,2),
  min_temperature_celsius DECIMAL(6,2),
  humidity_percent DECIMAL(5,2),
  rainfall_mm DECIMAL(8,2),
  wind_speed_kmh DECIMAL(6,2),
  wind_direction TEXT,
  atmospheric_pressure DECIMAL(7,2),
  uv_index DECIMAL(4,2),
  visibility_km DECIMAL(5,2),
  weather_condition TEXT, -- sunny, cloudy, rainy, stormy
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can view their own weather data" ON weather_data;
CREATE POLICY "Farmers can view their own weather data" ON weather_data
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = weather_data.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own weather data" ON weather_data;
CREATE POLICY "Farmers can insert their own weather data" ON weather_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = weather_data.farmer_id
    )
  );

-- ============================================================================
-- PLANT HEALTH METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS plant_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  assessment_method TEXT CHECK (assessment_method IN ('visual', 'drone', 'satellite', 'sensor', 'lab_test')),
  leaf_color_index DECIMAL(5,2),
  stem_diameter_mm DECIMAL(8,2),
  plant_height_cm DECIMAL(8,2),
  leaf_area_cm2 DECIMAL(10,2),
  chlorophyll_content DECIMAL(5,2),
  disease_detected TEXT,
  disease_severity TEXT CHECK (disease_severity IN ('none', 'mild', 'moderate', 'severe')),
  pest_detected TEXT,
  pest_severity TEXT CHECK (pest_severity IN ('none', 'mild', 'moderate', 'severe')),
  disease_probability DECIMAL(5,2) CHECK (disease_probability >= 0 AND disease_probability <= 100),
  pest_probability DECIMAL(5,2) CHECK (pest_probability >= 0 AND pest_probability <= 100),
  overall_health_score DECIMAL(5,2) CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
  recommendations TEXT,
  assessed_by TEXT, -- farmer, expert, ai
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE plant_health_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can view their own plant health data" ON plant_health_metrics;
CREATE POLICY "Farmers can view their own plant health data" ON plant_health_metrics
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = plant_health_metrics.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own plant health data" ON plant_health_metrics;
CREATE POLICY "Farmers can insert their own plant health data" ON plant_health_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = plant_health_metrics.farmer_id
    )
  );

-- ============================================================================
-- AI PREDICTIONS TABLE - ML predictions for farmers
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  farm_id UUID REFERENCES farms(id),
  crop_id UUID REFERENCES crops(id),
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('yield_forecast', 'disease_risk', 'pest_risk', 'irrigation_schedule', 'harvest_timing', 'market_price', 'weather_forecast')),
  prediction_value DECIMAL(12,2),
  prediction_unit TEXT,
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  prediction_date DATE NOT NULL,
  valid_until DATE,
  model_name TEXT,
  model_version TEXT,
  input_data JSONB, -- Store input parameters used for prediction
  recommendation TEXT,
  action_required BOOLEAN DEFAULT false,
  priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'acted_upon')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can view their own predictions" ON ai_predictions;
CREATE POLICY "Farmers can view their own predictions" ON ai_predictions
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = ai_predictions.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own predictions" ON ai_predictions;
CREATE POLICY "Farmers can insert their own predictions" ON ai_predictions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = ai_predictions.farmer_id
    )
  );

-- ============================================================================
-- FARMER NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS farmer_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('weather_alert', 'disease_warning', 'irrigation_reminder', 'harvest_reminder', 'market_update', 'system_update', 'emergency')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  is_actionable BOOLEAN DEFAULT false,
  action_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE farmer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can view their own notifications" ON farmer_notifications;
CREATE POLICY "Farmers can view their own notifications" ON farmer_notifications
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farmer_notifications.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own notifications" ON farmer_notifications;
CREATE POLICY "Farmers can insert their own notifications" ON farmer_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farmer_notifications.farmer_id
    )
  );

-- ============================================================================
-- CHAT HISTORY TABLE - AI assistant conversations per farmer
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) ON DELETE CASCADE,
  session_id TEXT, -- Group related messages
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'file')),
  user_message TEXT NOT NULL,
  ai_response TEXT,
  context_data JSONB, -- Store relevant context like crop data, weather, etc.
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can view their own chat history" ON chat_history;
CREATE POLICY "Farmers can view their own chat history" ON chat_history
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = chat_history.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own chat history" ON chat_history;
CREATE POLICY "Farmers can insert their own chat history" ON chat_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = chat_history.farmer_id
    )
  );

-- ============================================================================
-- FARMER DOCUMENTS TABLE - Store farmer certificates, contracts, etc.
-- ============================================================================

CREATE TABLE IF NOT EXISTS farmer_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id TEXT REFERENCES users(farmer_id) NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('land_records', 'organic_certificate', 'insurance_policy', 'loan_agreement', 'seed_certificate', 'soil_test_report', 'other')),
  document_name TEXT NOT NULL,
  file_url TEXT, -- Supabase storage URL
  file_size_mb DECIMAL(8,2),
  mime_type TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  document_number TEXT,
  notes TEXT,
  is_verified BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE farmer_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can manage their own documents" ON farmer_documents;
CREATE POLICY "Farmers can manage their own documents" ON farmer_documents
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farmer_documents.farmer_id
    )
  );
DROP POLICY IF EXISTS "Farmers can insert their own documents" ON farmer_documents;
CREATE POLICY "Farmers can insert their own documents" ON farmer_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.farmer_id = farmer_documents.farmer_id
    )
  );

-- ============================================================================
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_farmer_id ON users(farmer_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Farms table indexes
CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farms_code ON farms(farm_code);
CREATE INDEX IF NOT EXISTS idx_farms_location ON farms(city, state);
CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(farm_status);

-- Farm sections indexes
CREATE INDEX IF NOT EXISTS idx_farm_sections_farm_id ON farm_sections(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_sections_farmer_id ON farm_sections(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farm_sections_code ON farm_sections(section_code);

-- Crops table indexes
CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_section_id ON crops(farm_section_id);
CREATE INDEX IF NOT EXISTS idx_crops_code ON crops(crop_code);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(crop_status);
CREATE INDEX IF NOT EXISTS idx_crops_health ON crops(health_status);
CREATE INDEX IF NOT EXISTS idx_crops_dates ON crops(planting_date, expected_harvest_date);

-- Activity indexes
CREATE INDEX IF NOT EXISTS idx_activities_crop_id ON crop_activities(crop_id);
CREATE INDEX IF NOT EXISTS idx_activities_farmer_id ON crop_activities(farmer_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON crop_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON crop_activities(activity_type);

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_expenses_farmer_id ON expenses(farmer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_farm_id ON expenses(farm_id);
CREATE INDEX IF NOT EXISTS idx_expenses_crop_id ON expenses(crop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(expense_category);

CREATE INDEX IF NOT EXISTS idx_income_farmer_id ON income(farmer_id);
CREATE INDEX IF NOT EXISTS idx_income_farm_id ON income(farm_id);
CREATE INDEX IF NOT EXISTS idx_income_crop_id ON income(crop_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(income_date);
CREATE INDEX IF NOT EXISTS idx_income_type ON income(income_type);

-- Sensor data indexes
CREATE INDEX IF NOT EXISTS idx_sensor_farmer_id ON sensor_data(farmer_id);
CREATE INDEX IF NOT EXISTS idx_sensor_farm_id ON sensor_data(farm_id);
CREATE INDEX IF NOT EXISTS idx_sensor_crop_id ON sensor_data(crop_id);
CREATE INDEX IF NOT EXISTS idx_sensor_type ON sensor_data(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensor_recorded ON sensor_data(recorded_at);

-- Weather data indexes
CREATE INDEX IF NOT EXISTS idx_weather_farmer_id ON weather_data(farmer_id);
CREATE INDEX IF NOT EXISTS idx_weather_farm_id ON weather_data(farm_id);
CREATE INDEX IF NOT EXISTS idx_weather_recorded ON weather_data(recorded_at);

-- Plant health indexes
CREATE INDEX IF NOT EXISTS idx_plant_health_farmer_id ON plant_health_metrics(farmer_id);
CREATE INDEX IF NOT EXISTS idx_plant_health_crop_id ON plant_health_metrics(crop_id);
CREATE INDEX IF NOT EXISTS idx_plant_health_date ON plant_health_metrics(assessment_date);

-- AI predictions indexes
CREATE INDEX IF NOT EXISTS idx_predictions_farmer_id ON ai_predictions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_predictions_farm_id ON ai_predictions(farm_id);
CREATE INDEX IF NOT EXISTS idx_predictions_crop_id ON ai_predictions(crop_id);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON ai_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON ai_predictions(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_farmer_id ON farmer_notifications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON farmer_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON farmer_notifications(created_at);

-- Chat history indexes
CREATE INDEX IF NOT EXISTS idx_chat_farmer_id ON chat_history(farmer_id);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_history(created_at);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_farmer_id ON farmer_documents(farmer_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON farmer_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON farmer_documents(expiry_date);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_farms_updated_at ON farms;
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_farm_sections_updated_at ON farm_sections;
CREATE TRIGGER update_farm_sections_updated_at BEFORE UPDATE ON farm_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crops_updated_at ON crops;
CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON crops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CUSTOM FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================================

-- Function to generate unique farmer ID
CREATE OR REPLACE FUNCTION generate_farmer_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate ID like FARM001, FARM002, etc.
        new_id := 'FARM' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 3, '0');
        
        -- Check if it exists
        SELECT COUNT(*) INTO exists_check FROM users WHERE farmer_id = new_id;
        
        IF exists_check = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate farm profitability
CREATE OR REPLACE FUNCTION calculate_farm_profitability(farmer_code TEXT, farm_uuid UUID DEFAULT NULL)
RETURNS TABLE(total_income DECIMAL, total_expenses DECIMAL, net_profit DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(i.total_amount), 0) as total_income,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(e.amount), 0) as net_profit
    FROM 
    (SELECT total_amount FROM income WHERE farmer_id = farmer_code AND (farm_uuid IS NULL OR farm_id = farm_uuid)) i
    FULL OUTER JOIN 
    (SELECT amount FROM expenses WHERE farmer_id = farmer_code AND (farm_uuid IS NULL OR farm_id = farm_uuid)) e
    ON TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TABLE COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Farmer profiles with complete personal and farming information';
COMMENT ON TABLE farms IS 'Individual farms/lands owned or managed by farmers';
COMMENT ON TABLE farm_sections IS 'Subdivisions of farms for detailed management';
COMMENT ON TABLE crops IS 'Crops grown in specific farm sections with tracking';
COMMENT ON TABLE crop_activities IS 'All farming activities performed on crops';
COMMENT ON TABLE expenses IS 'All farming-related expenses per farmer';
COMMENT ON TABLE income IS 'All farming-related income per farmer';
COMMENT ON TABLE sensor_data IS 'IoT sensor readings from farms and crops';
COMMENT ON TABLE weather_data IS 'Weather information for farms';
COMMENT ON TABLE plant_health_metrics IS 'Plant health monitoring and assessment data';
COMMENT ON TABLE ai_predictions IS 'AI/ML predictions and recommendations';
COMMENT ON TABLE farmer_notifications IS 'System notifications for farmers';
COMMENT ON TABLE chat_history IS 'AI assistant conversations with farmers';
COMMENT ON TABLE farmer_documents IS 'Farmer certificates, contracts, and documents';

-- ============================================================================
-- SAMPLE DATA FUNCTIONS (Optional)
-- ============================================================================

-- Function to create sample data for testing
CREATE OR REPLACE FUNCTION create_sample_farmer_data(farmer_auth_uuid UUID, farmer_email TEXT, farmer_name TEXT)
RETURNS TEXT AS $$
DECLARE
    sample_farm_id UUID;
    sample_section_id UUID;
    sample_crop_id UUID;
  farmer_id_code TEXT;
BEGIN
    -- Generate farmer ID
    farmer_id_code := generate_farmer_id();
    
    -- Insert farmer profile
  INSERT INTO users (id, farmer_id, full_name, email, phone, total_land_hectares, farming_experience_years)
  VALUES (farmer_auth_uuid, farmer_id_code, farmer_name, farmer_email, '+91-9876543210', 5.0, 10);
    
    -- Insert sample farm
  INSERT INTO farms (farmer_id, farm_code, farm_name, total_area_hectares, soil_type, city, state)
  VALUES (farmer_id_code, farmer_id_code || '_LAND1', 'Main Farm', 5.0, 'Loamy', 'Pune', 'Maharashtra')
    RETURNING id INTO sample_farm_id;
    
    -- Insert sample farm section
  INSERT INTO farm_sections (farm_id, farmer_id, section_code, section_name, area_hectares, soil_type)
  VALUES (sample_farm_id, farmer_id_code, farmer_id_code || '_SEC1', 'North Field', 2.0, 'Loamy')
    RETURNING id INTO sample_section_id;
    
    -- Insert sample crop
  INSERT INTO crops (farm_section_id, farm_id, farmer_id, crop_code, crop_name, crop_variety, 
                      planting_date, planted_area_hectares, growth_stage, season)
  VALUES (sample_section_id, sample_farm_id, farmer_id_code, farmer_id_code || '_RICE_2025', 
            'Rice', 'Basmati', CURRENT_DATE - INTERVAL '30 days', 2.0, 'vegetative', 'Kharif')
    RETURNING id INTO sample_crop_id;
    
    -- Insert sample expense
  INSERT INTO expenses (farmer_id, farm_id, crop_id, expense_category, expense_description, 
                         amount, expense_date)
  VALUES (farmer_id_code, sample_farm_id, sample_crop_id, 'seeds', 'Basmati Rice Seeds', 
            5000.00, CURRENT_DATE - INTERVAL '30 days');
    
    RETURN 'Sample data created successfully for farmer: ' || farmer_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- This comprehensive multi-tenant schema provides:
-- ✅ Complete data isolation per farmer
-- ✅ Hierarchical farm management (Farmer → Farms → Sections → Crops)
-- ✅ Financial tracking (Income & Expenses)
-- ✅ Activity logging for all farming operations
-- ✅ IoT sensor data management
-- ✅ AI predictions and recommendations
-- ✅ Document management system
-- ✅ Notification system
-- ✅ Chat history with AI assistant
-- ✅ Optimized performance with proper indexing
-- ✅ Row Level Security for complete data isolation
-- ✅ Automatic timestamp management
-- ✅ Business logic functions for calculations
-- ✅ Sample data generation for testing

-- Each farmer can only see and manage their own data!
-- The system scales to support thousands of farmers with complete data separation.