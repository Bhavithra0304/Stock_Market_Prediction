# 5-Day Stock Market Forecasting ML

Models:
- XGBoost: supervised multi-output regression using historical OHLCV and technical indicators.
- LSTM: sequence-to-five-day forecasting trained on historical closing prices.
- TimesFM 2.5: pretrained time-series foundation model; used for zero-shot forecasting, not trained from scratch.

## 1. Recommended environment
Use Google Colab with a GPU runtime for the LSTM if available. TimesFM also needs enough RAM and downloads pretrained weights on first run. Local Windows setup can be harder because TensorFlow and TimesFM dependencies may conflict; use a clean virtual environment or Colab.

## 2. Install
```bash
pip install -r requirements.txt
```

If TimesFM installation causes dependency conflicts, install the core packages first and install TimesFM separately according to its official Google Research repository:
https://github.com/google-research/timesfm

## 3. Run
Indian stock example:
```bash
python train_models.py --ticker RELIANCE.NS --period 5y
```

Other examples:
```bash
python train_models.py --ticker TCS.NS --period 5y
python train_models.py --ticker AAPL --period 5y
```

To test the XGBoost and LSTM pipeline without loading TimesFM:
```bash
python train_models.py --ticker RELIANCE.NS --period 5y --skip-timesfm
```

## 4. Output files
- `outputs/historical_data.csv`: downloaded daily OHLCV history.
- `outputs/next_5_day_forecast.csv`: five forecasts from each model.
- `outputs/model_metrics.json`: held-out evaluation metrics.
- `outputs/forecast_chart.png`: historical close plus forecasts.
- `artifacts/xgboost_5day.joblib`: trained XGBoost model.
- `artifacts/lstm_5day.keras`: trained LSTM model.
- `artifacts/close_scaler.joblib`: scaler required by the LSTM.
- `artifacts/feature_columns.joblib`: ordered XGBoost feature names.

## 5. Important methodology notes
- The script uses chronological data splitting, not random shuffling.
- TimesFM is pretrained; this project uses it for inference.
- The latest forecast is a model estimate, not a guarantee or investment recommendation.
- Forecast dates use business days as an approximation and do not exclude exchange holidays.
- The models have different inputs: XGBoost uses engineered features; LSTM uses closing-price sequences; TimesFM uses the closing-price series.
- Evaluate model metrics before selecting a preferred model. Do not select a winner based on training loss.
