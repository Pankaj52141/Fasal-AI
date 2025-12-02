"""
Plant Health Sensor Model Inference Script
Loads the CatBoost model and makes predictions on sensor data
"""
import sys
import json
import pandas as pd
from catboost import CatBoostClassifier

def predict_plant_health(sensor_data):
    """
    Predict plant health from sensor data
    
    Args:
        sensor_data: dict with sensor readings (temp, humidity, moisture, etc.)
    
    Returns:
        dict with prediction result
    """
    try:
        # Load model
        model = CatBoostClassifier()
        model.load_model('models/plant_health_model.cbm')
        
        # Prepare input dataframe
        df = pd.DataFrame([sensor_data])
        
        # Make prediction
        prediction = model.predict(df)[0]
        proba = model.predict_proba(df)[0]
        
        # Get class with highest probability
        max_proba = max(proba)
        
        result = {
            'prediction': str(prediction),
            'confidence': float(max_proba),
            'probabilities': {f'class_{i}': float(p) for i, p in enumerate(proba)}
        }
        
        return result
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    # Read sensor data from stdin (JSON format)
    input_data = json.loads(sys.stdin.read())
    result = predict_plant_health(input_data)
    print(json.dumps(result))
