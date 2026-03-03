# Automated API Security Testing Tool

## Overview
This project is an intelligent API security monitoring system that captures API traffic from a browser extension, analyzes it using machine learning and heuristics to predict risk levels (Low, Medium, High), and visualizes the results on a dashboard.

## Features
- **Real-time API Capture**: Captures Fetch and XHR requests using a Chrome Extension.
- **Machine Learning Analysis**: Predicts risk using Random Forest and Logistic Regression models.
- **Hybrid Risk Scoring**: Combines ML probability with heuristic rules.
- **Explainable AI**: Provides reasons for risk assessments (e.g., "Token in URL", "Missing Auth").
- **Dashboard**: Visualizes API logs and risk metrics.

## Architecture
- **Backend**: FastAPI, MongoDB, Scikit-learn
- **Frontend**: React
- **Extension**: Chrome Manifest V3
- **ML**: Scikit-learn, Pandas, NumPy

## Setup
1. Clone the repository.
2. Create a `.env` file inside the `backend` directory with your MongoDB Atlas credentials:
   ```
   MONGODB_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   DATABASE_NAME=<your_database_name>
   ```
   Make sure the IP address of the machine running the backend is whitelisted in
   Atlas (e.g. `0.0.0.0/0` for development or your specific public IP).
3. Install backend dependencies: `pip install -r backend/requirements.txt`
4. Run the backend from the `backend` folder so that `.env` is picked up:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
   You can verify the database connection by hitting `/health`.
5. Load the Chrome Extension in Developer Mode.
6. Start the Frontend: `npm start` (or similar)

## Evaluation
This project is designed for final-year evaluation and journal publication, emphasizing explainability, scalability, and modularity.
