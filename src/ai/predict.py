import pandas as pd
import numpy as np
import joblib
import logging
import json
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def predict_risk(data_point):
    logger.info("Starting risk prediction...")

    # Load scaler, model, and thresholds
    scaler = joblib.load('cnc_scaler.pkl')
    iso_forest = joblib.load('cnc_anomaly_model.pkl')
    thresholds = joblib.load('cnc_parameter_thresholds.pkl')

    # Convert data point to DataFrame
    data = pd.DataFrame([data_point])

    # Use simplified feature set
    feature_cols = list(data.columns)

    # Scale data
    data_scaled = scaler.transform(data[feature_cols])

    # Predict anomaly using custom threshold
    anomaly_score = iso_forest.decision_function(data_scaled)[0]
    threshold = -0.1  # Adjust based on test.py results
    is_anomaly = anomaly_score < threshold

    # Normalize anomaly score to risk probability (0-100%)
    risk_prob = 1 / (1 + np.exp(anomaly_score)) * 100  # Sigmoid transformation

    # Identify critical parameters
    critical_params = []
    for feature, value in data[feature_cols].iloc[0].items():
        if feature in thresholds:
            if value > thresholds[feature]['upper'] or value < thresholds[feature]['lower']:
                critical_params.append(f"{feature}: {value:.2f}")

    # Generate risk assessment
    risk_level = "HIGH RISK" if is_anomaly else "LOW RISK"
    recommendations = []
    if is_anomaly:
        recommendations.append("Immediate inspection required within 24 hours")
        recommendations.append("Halt operations if critical parameters persist")
    else:
        recommendations.append("Continue regular monitoring")
        recommendations.append("Schedule maintenance as per standard protocol")

    return {
        "riskLevel": risk_level,
        "anomalyScore": float(anomaly_score),
        "riskProbability": float(risk_prob),
        "criticalParameters": critical_params,
        "recommendations": recommendations
    }

if __name__ == "__main__":
    # Read input from command line
    data_point = json.loads(sys.argv[1])
    result = predict_risk(data_point)
    print(json.dumps(result))