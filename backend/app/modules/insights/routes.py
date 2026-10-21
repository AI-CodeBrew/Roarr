"""
Insights Routes: Campaign performance insights endpoints.
v2 loads merged.csv from Bunny CDN (was S3).
"""
from flask import Blueprint, request, jsonify
import tempfile
import os
import logging
import pandas as pd
import math
import requests

from ..auth.utils import require_auth
from ..database import document_store
from app.clients.bunny_client import bunny_client

logger = logging.getLogger(__name__)

insights_bp = Blueprint("insights", __name__)


@insights_bp.route("/api/insights", methods=["GET"])
@require_auth
def get_insights():
    """Get campaign performance insights from user's data"""
    try:
        user_id = request.user_id
        user = document_store.get_user_by_cognito_id(user_id)
        if not user:
            return jsonify(
                {
                    "success": False,
                    "error": "User not found. Please authenticate again.",
                }
            ), 404

        if not bunny_client._configured():
            return jsonify(
                {
                    "success": False,
                    "error": "Bunny storage is not configured.",
                }
            ), 503

        merged_key = f"{user_id}/merged.csv"
        url = bunny_client.cdn_url(merged_key)
        temp_file_path = None
        try:
            resp = requests.get(url, timeout=60)
            if resp.status_code == 404:
                return jsonify(
                    {
                        "success": False,
                        "error": "No merged data file found for user.",
                    }
                ), 404
            if resp.status_code != 200:
                return jsonify(
                    {
                        "success": False,
                        "error": "Error checking data file availability.",
                    }
                ), 500

            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
            temp_file_path = temp_file.name
            temp_file.write(resp.content)
            temp_file.close()

            df = pd.read_csv(temp_file_path)
            df = df.fillna(0)

            required_columns = [
                "date",
                "purchase_value",
                "purchase_count",
                "spend",
                "reach",
                "impressions",
                "no_of_conversions",
            ]
            missing_columns = [c for c in required_columns if c not in df.columns]
            if missing_columns:
                return jsonify(
                    {
                        "success": False,
                        "error": f"Missing required columns in CSV: {missing_columns}",
                    }
                ), 400

            df["date"] = pd.to_datetime(df["date"])
            today = pd.Timestamp.now().normalize()
            time_periods = {
                "yesterday": {
                    "start_date": today - pd.Timedelta(days=1),
                    "end_date": today - pd.Timedelta(days=1),
                },
                "last_7_days": {
                    "start_date": today - pd.Timedelta(days=7),
                    "end_date": today - pd.Timedelta(days=1),
                },
                "last_30_days": {
                    "start_date": today - pd.Timedelta(days=30),
                    "end_date": today - pd.Timedelta(days=1),
                },
            }

            insights = {}
            for period_name, period in time_periods.items():
                mask = (df["date"] >= period["start_date"]) & (
                    df["date"] <= period["end_date"]
                )
                period_df = df.loc[mask]
                spend = float(period_df["spend"].sum()) if len(period_df) else 0.0
                purchases = (
                    float(period_df["purchase_count"].sum()) if len(period_df) else 0.0
                )
                purchase_value = (
                    float(period_df["purchase_value"].sum()) if len(period_df) else 0.0
                )
                insights[period_name] = {
                    "spend": spend,
                    "purchase_count": purchases,
                    "purchase_value": purchase_value,
                    "roas": (purchase_value / spend) if spend > 0 else 0,
                    "cpa": (spend / purchases) if purchases > 0 else 0,
                    "reach": float(period_df["reach"].sum()) if len(period_df) else 0.0,
                    "impressions": (
                        float(period_df["impressions"].sum()) if len(period_df) else 0.0
                    ),
                    "conversions": (
                        float(period_df["no_of_conversions"].sum())
                        if len(period_df)
                        else 0.0
                    ),
                }
                for k, v in list(insights[period_name].items()):
                    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                        insights[period_name][k] = 0

            return jsonify({"success": True, "insights": insights})
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except OSError:
                    pass
    except Exception as e:
        logger.error(f"Insights error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
