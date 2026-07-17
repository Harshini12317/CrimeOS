from datasets import load_dataset
import psycopg2
import re
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# Load embedding model once, outside the loop
model = SentenceTransformer('intfloat/multilingual-e5-large')  # 1024-dim, multilingual

# DB connection
load_dotenv()
db_url = os.getenv("DATABASE_URL")
conn = psycopg2.connect(db_url)
cur = conn.cursor()

# Load dataset
ds = load_dataset("GSMS-B/indian-legal-sections-bns-bnss-bsa-2023")

def normalize_act(act_str):
    return act_str.split()[0]  # "BNS 2023" -> "BNS"

def strip_context_header(text):
    return re.sub(r'^\[Context:.*?\]\s*', '', text, flags=re.DOTALL)

total = len(ds['train'])
inserted = 0

for i, row in enumerate(ds['train']):
    act_code = normalize_act(row['act'])
    clean_text = strip_context_header(row['text'])
    embed_input = f"{row['section_title']} {row['text']}"  # keep context header for embedding

    # e5 models expect a "passage: " prefix for content being stored/retrieved
    embedding = model.encode(f"passage: {embed_input}").tolist()

    cur.execute("""
        INSERT INTO legal_sections
            (act_code, section_number, title, section_text, category, embedding)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (act_code, section_number) DO NOTHING
    """, (
        act_code,
        row['section_number'],
        row['section_title'],
        clean_text,
        row['chapter'],
        embedding
    ))
    inserted += 1

    if (i + 1) % 100 == 0:
        conn.commit()
        print(f"Progress: {i + 1}/{total}")

conn.commit()
cur.close()
conn.close()
print(f"Done. Ingested {inserted} sections")