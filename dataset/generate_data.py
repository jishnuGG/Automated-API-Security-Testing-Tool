import pandas as pd
import numpy as np
import random
from faker import Faker

fake = Faker()

NUM_SAMPLES = 10000

def generate_synthetic_data():
    data = []
    
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    protocols = ['HTTP', 'HTTPS']
    risk_levels = ['low', 'medium', 'high']

    print(f"Generating {NUM_SAMPLES} samples...")

    for _ in range(NUM_SAMPLES):
        # Base features
        method = random.choice(methods)
        protocol = random.choice(protocols)
        auth_present = random.choice([True, False])
        token_in_url = random.choice([True, False])
        sensitive_keywords = random.choice([True, False])
        cors_policy_open = random.choice([True, False])
        status_code = random.choice([200, 201, 400, 401, 403, 404, 500])
        request_frequency = random.randint(1, 100) # req/min
        failed_login_patterns = random.choice([True, False])
        payload_entropy = random.uniform(3.0, 8.0) # approx entropy

        # Determine Risk Level based on rules
        risk = "low"
        
        # High Risk Rules
        if token_in_url and not auth_present:
            risk = "high"
        elif protocol == "HTTP" and sensitive_keywords:
            risk = "high"
        elif failed_login_patterns and request_frequency > 50:
            risk = "high"
        elif method == "POST" and not auth_present and sensitive_keywords:
            risk = "high"
            
        # Medium Risk Rules
        elif cors_policy_open and sensitive_keywords:
            risk = "medium"
        elif protocol == "HTTP" and auth_present:
            risk = "medium"
        elif status_code in [401, 403] and request_frequency > 20:
            risk = "medium"
        elif payload_entropy > 7.0: # High entropy might indicate encrypted payload or injection
            risk = "medium"
            
        # Noise / Randomness to prevent overfitting to exact rules
        if random.random() < 0.05: # 5% noise
            risk = random.choice(risk_levels)

        data.append({
            "request_method": method,
            "protocol": protocol,
            "auth_present": int(auth_present),
            "token_in_url": int(token_in_url),
            "sensitive_keywords_detected": int(sensitive_keywords),
            "cors_policy_open": int(cors_policy_open),
            "payload_entropy": round(payload_entropy, 2),
            "status_code": status_code,
            "request_frequency": request_frequency,
            "failed_login_patterns": int(failed_login_patterns),
            "risk_level": risk
        })

    df = pd.DataFrame(data)
    
    # Save to CSV
    output_path = "dataset/security_logs.csv"
    df.to_csv(output_path, index=False)
    print(f"Dataset generated at {output_path}")
    print(df['risk_level'].value_counts())

if __name__ == "__main__":
    generate_synthetic_data()
