"""
Export endpoint for downloading security logs as CSV or styled Excel.

GET /api/v1/export-logs?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&format=csv|xlsx

Requires JWT authentication. Exports only the authenticated user's logs.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.database import get_database
from app.dependencies.auth_dependency import get_current_user
from datetime import datetime, timedelta
import pandas as pd
import io
import sys

router = APIRouter()

# Columns to export and their display names
EXPORT_COLUMNS = {
    "domain": "Domain",
    "timestamp": "Timestamp",
    "method": "Method",
    "url": "URL",
    "status_code": "Status Code",
    "ml_probability": "ML Probability",
    "heuristic_score": "Heuristic Score",
    "risk_score": "Risk Score",
    "risk_level": "Risk Level",
    "is_https": "Is HTTPS",
    "reasons": "Reasons",
}


async def _fetch_logs_for_export(
    user_id: str, start_date: str, end_date: str
) -> list[dict]:
    """Query high_risk_logs for the user within the date range."""
    db = await get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD.",
        )

    query = {
        "user_id": user_id,
        "timestamp": {
            "$gte": start_dt,   
            "$lt": end_dt
        },
    }

    cursor = db.high_risk_logs.find(query).sort("timestamp", -1)
    logs = await cursor.to_list(length=10000)

    return logs


def _logs_to_dataframe(logs: list[dict]) -> pd.DataFrame:
    """Convert raw MongoDB log dicts into a clean DataFrame."""
    rows = []
    for log in logs:
        row = {}
        for key, display in EXPORT_COLUMNS.items():
            val = log.get(key, "")
            if key == "timestamp" and val:
                try:
                    val = datetime.fromisoformat(str(val)).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                except Exception:
                    pass
            elif key in ("ml_probability", "heuristic_score", "risk_score"):
                if val not in (None, ""):
                    val = f"{float(val) * 100:.1f}%"
                else:
                    val = ""
            elif key == "is_https":
                val = "Yes" if val else "No"
            elif key == "reasons":
                if isinstance(val, list):
                    val = "; ".join(val)
            row[display] = val
        rows.append(row)

    if not rows:
        return pd.DataFrame(columns=list(EXPORT_COLUMNS.values()))

    return pd.DataFrame(rows)


def _generate_csv(df: pd.DataFrame) -> io.BytesIO:
    """Generate a CSV file buffer from a DataFrame."""
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False, encoding="utf-8-sig")
    buffer.seek(0)
    return buffer


def _generate_xlsx(df: pd.DataFrame) -> io.BytesIO:
    """Generate a styled Excel file buffer from a DataFrame."""
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Security Logs")
        workbook = writer.book
        worksheet = writer.sheets["Security Logs"]

        # Style the header row
        header_fill = PatternFill(
            start_color="0E7490", end_color="0E7490", fill_type="solid"
        )  # Cyan-700
        header_font = Font(bold=True, color="FFFFFF", size=11, name="Consolas")
        header_alignment = Alignment(horizontal="center", vertical="center")
        thin_border = Border(
            bottom=Side(style="thin", color="164E63"),
        )

        for col_idx, col_name in enumerate(df.columns, 1):
            cell = worksheet.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = header_alignment
            cell.border = thin_border

        # Auto-fit column widths (approximate)
        for col_idx, col_name in enumerate(df.columns, 1):
            column_letter = worksheet.cell(row=1, column=col_idx).column_letter
            max_length = len(str(col_name))

            for cell in worksheet[column_letter]:
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))

            worksheet.column_dimensions[column_letter].width = min(max_length + 4, 50)

        # Style data rows with alternating background
        data_font = Font(size=10, name="Consolas")
        even_fill = PatternFill(
            start_color="F0FDFA", end_color="F0FDFA", fill_type="solid"
        )
        for row_idx in range(2, len(df) + 2):
            for col_idx in range(1, len(df.columns) + 1):
                cell = worksheet.cell(row=row_idx, column=col_idx)
                cell.font = data_font
                if row_idx % 2 == 0:
                    cell.fill = even_fill

        # Freeze the header row
        worksheet.freeze_panes = "A2"

    buffer.seek(0)
    return buffer


@router.get("/export-logs")
async def export_logs(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    format: str = Query("csv", description="Export format: csv or xlsx"),
    current_user: dict = Depends(get_current_user),
):
    """
    Export security logs for the authenticated user within a date range.
    Supports CSV and styled Excel (.xlsx) formats.
    """
    try:
        logs = await _fetch_logs_for_export(
            user_id=current_user["user_id"],
            start_date=start_date,
            end_date=end_date,
        )

        df = _logs_to_dataframe(logs)

        print(
            f"[export] user={current_user['user_id']} range={start_date}→{end_date} "
            f"format={format} rows={len(df)}",
            flush=True,
        )

        if format == "xlsx":
            buffer = _generate_xlsx(df)
            filename = f"security_logs_{start_date}_to_{end_date}.xlsx"
            media_type = (
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        else:
            buffer = _generate_csv(df)
            filename = f"security_logs_{start_date}_to_{end_date}.csv"
            media_type = "text/csv"

        return StreamingResponse(
            buffer,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[export] Error: {e}", file=sys.stderr, flush=True)
        raise HTTPException(status_code=500, detail=str(e))
