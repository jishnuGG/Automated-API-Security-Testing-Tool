import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# Load Data
DATA_PATH = "../../../dataset/security_logs.csv" # Relative to where script might be run, adjusted below
try:
    df = pd.read_csv("dataset/security_logs.csv")
except FileNotFoundError:
    try:
        df = pd.read_csv("../../../dataset/security_logs.csv")
    except:
        print("Error: Dataset not found.")
        exit(1)

print(f"Loaded {len(df)} samples.")

# Features and Target
X = df.drop(columns=['risk_level'])
y = df['risk_level']

# Preprocessing
categorical_features = ['request_method', 'protocol']
numerical_features = ['payload_entropy', 'status_code', 'request_frequency']
binary_features = ['auth_present', 'token_in_url', 'sensitive_keywords_detected', 'cors_policy_open', 'failed_login_patterns']

# We need to handle categorical features with OneHotEncoder
# Numerical features with StandardScaler (optional but good for LR)
# Binary features are already 0/1

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numerical_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
        ('passthrough', 'passthrough', binary_features)
    ])

# Model Pipeline - Random Forest (Primary)
rf_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Model Pipeline - Logistic Regression (Baseline)
lr_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', LogisticRegression(max_iter=1000))
])

# Split Data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest
print("\nTraining Random Forest...")
rf_pipeline.fit(X_train, y_train)
y_pred_rf = rf_pipeline.predict(X_test)

# Evaluate Random Forest
print("Random Forest Performance:")
print(classification_report(y_test, y_pred_rf))

# Train Logistic Regression
print("\nTraining Logistic Regression (Baseline)...")
lr_pipeline.fit(X_train, y_train)
y_pred_lr = lr_pipeline.predict(X_test)

# Evaluate Logistic Regression
print("Logistic Regression Performance:")
print(classification_report(y_test, y_pred_lr))

# Save the best model (Random Forest)
model_path = "backend/app/ml/models/security_model.joblib"
# Ensure directory exists
import os
os.makedirs(os.path.dirname(model_path), exist_ok=True)

joblib.dump(rf_pipeline, model_path)
print(f"\nModel saved to {model_path}")

# Verify loading
loaded_model = joblib.load(model_path)
print("Model loaded successfully.")
