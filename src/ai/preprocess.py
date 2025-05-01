import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import joblib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def preprocess_data(input_file='cnc_data.csv', output_file='preprocessed_cnc_data.csv'):
    logger.info("Starting data preprocessing...")

    # Load data
    try:
        data = pd.read_csv(input_file)
        logger.info(f"Loaded dataset with {len(data)} rows")
        logger.info(f"Unique values in Failure_Status before processing: {data['Failure_Status'].unique()}")
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        raise

    # Convert Failure_Status to string
    data['Failure_Status'] = data['Failure_Status'].astype(str)
    logger.info(f"Number of failure events: {sum(data['Failure_Status'] == 'Failure')}")

    # Generate synthetic failures (5% of data)
    n_synthetic = int(0.05 * len(data))
    synthetic_indices = np.random.choice(data.index, size=n_synthetic, replace=False)
    
    # Ensure Spindle_Speed_RPM is float
    data['Spindle_Speed_RPM'] = data['Spindle_Speed_RPM'].astype(float)
    data.loc[synthetic_indices, 'Spindle_Speed_RPM'] = np.random.uniform(5000, 9000, n_synthetic)
    data.loc[synthetic_indices, 'Vibration_Level_mm_s'] = np.random.uniform(3.5, 7.0, n_synthetic)
    data.loc[synthetic_indices, 'Tool_Wear_mm'] = np.random.uniform(0.3, 0.7, n_synthetic)
    data.loc[synthetic_indices, 'Temperature_C'] = np.random.uniform(50.0, 70.0, n_synthetic)
    data.loc[synthetic_indices, 'Energy_Consumption_kWh'] = np.random.uniform(10.0, 15.0, n_synthetic)
    data.loc[synthetic_indices, 'Failure_Status'] = 'Failure'
    logger.info(f"Generated {n_synthetic} synthetic failure events")

    # Handle missing values
    data.fillna(0, inplace=True)

    # Define features and target
    feature_cols = [col for col in data.columns if col not in ['Timestamp', 'Failure_Status', 'Failure_Reason']]
    X = data[feature_cols]
    y = data['Failure_Status'].apply(lambda x: 1 if x in ['Failure', '1'] else 0)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    scaled_data = pd.DataFrame(X_scaled, columns=feature_cols)
    scaled_data['Failure_Status'] = y

    # Save preprocessed data
    scaled_data.to_csv(output_file, index=False)
    joblib.dump(scaler, 'cnc_scaler.pkl')
    logger.info(f"Saved preprocessed data to {output_file} and scaler to cnc_scaler.pkl")

    # Save parameter thresholds
    thresholds = {
        'Spindle_Speed_RPM': {'lower': X['Spindle_Speed_RPM'].quantile(0.05), 'upper': X['Spindle_Speed_RPM'].quantile(0.95)},
        'Vibration_Level_mm_s': {'lower': X['Vibration_Level_mm_s'].quantile(0.05), 'upper': X['Vibration_Level_mm_s'].quantile(0.95)},
        'Tool_Wear_mm': {'lower': X['Tool_Wear_mm'].quantile(0.05), 'upper': X['Tool_Wear_mm'].quantile(0.95)},
        'Temperature_C': {'lower': X['Temperature_C'].quantile(0.05), 'upper': X['Temperature_C'].quantile(0.95)},
        'Energy_Consumption_kWh': {'lower': X['Energy_Consumption_kWh'].quantile(0.05), 'upper': X['Energy_Consumption_kWh'].quantile(0.95)}
    }
    joblib.dump(thresholds, 'cnc_parameter_thresholds.pkl')
    logger.info("Saved parameter thresholds")

if __name__ == "__main__":
    preprocess_data()