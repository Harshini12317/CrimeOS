from datasets import load_dataset
import psycopg2
import os
from datetime import datetime
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('intfloat/multilingual-e5-large')

load_dotenv()
db_url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

ds = load_dataset("SnehaDeshmukh/IndianBailJudgments-1200")

ONLY_LANDMARKS = True  # set False to ingest all 1200

def parse_date(val):
    if not val:
        return None
    try:
        return datetime.fromisoformat(str(val)[:10]).date()
    except ValueError:
        return None

total = len(ds['train'])
inserted = 0
skipped = 0

for i, row in enumerate(ds['train']):
    if ONLY_LANDMARKS and not row.get("landmark_case", False):
        skipped += 1
        continue

    embed_input = " ".join(filter(None, [
        row.get("crime_type", ""),
        row.get("summary", ""),
        row.get("judgment_reason", ""),
        row.get("legal_issues", ""),
        row.get("legal_principles_discussed") or ""
    ])).strip()

    if not embed_input:
        skipped += 1
        continue

    embedding = model.encode(f"passage: {embed_input}").tolist()

    cur.execute("""
        INSERT INTO landmarks (
            case_id, case_title, court, case_date, judge, ipc_sections,
            bail_type, bail_cancellation_case, is_landmark, accused_gender,
            prior_cases, bail_outcome, bail_outcome_detailed, crime_type,
            facts, legal_issues, judgment_reason, summary, bias_flag,
            parity_argument_used, legal_principles_discussed, region,
            special_laws, source_filename, embedding
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        row.get("case_id"),
        row.get("case_title"),
        row.get("court"),
        parse_date(row.get("date")),
        row.get("judge"),
        row.get("ipc_sections"),
        row.get("bail_type"),
        row.get("bail_cancellation_case"),
        row.get("landmark_case"),
        row.get("accused_gender"),
        row.get("prior_cases"),
        row.get("bail_outcome"),
        row.get("bail_outcome_label_detailed"),
        row.get("crime_type"),
        row.get("facts"),
        row.get("legal_issues"),
        row.get("judgment_reason"),
        row.get("summary"),
        row.get("bias_flag"),
        row.get("parity_argument_used"),
        row.get("legal_principles_discussed"),
        row.get("region"),
        row.get("special_laws"),
        row.get("source_filename"),
        embedding
    ))
    inserted += 1

    if (i + 1) % 100 == 0:
        conn.commit()
        print(f"Progress: {i+1}/{total} | inserted: {inserted}")

conn.commit()
cur.close()
conn.close()
print(f"Done. Inserted {inserted}, skipped {skipped}.")