#!/usr/bin/env python3
"""
Seed legal_section_mappings from the three source CSVs:
  BNS_to_IPC.csv, BNSS_to_CrPC.csv, BSA_to_IEA.csv

Usage:
    # Either export DATABASE_URL directly...
    export DATABASE_URL="postgresql://user:password@host:5432/dbname"
    python3 seed_data.py --csv-dir /path/to/csvs

    # ...or put it in a .env file next to this script (auto-loaded):
    #   echo 'DATABASE_URL=postgresql://user:password@host:5432/dbname' > .env
    python3 seed_data.py --csv-dir /path/to/csvs

Options:
    --csv-dir   Directory containing the three CSV files (default: current dir)
    --truncate  Wipe the table before seeding (default: off, i.e. append/upsert-free insert)
    --env-file  Path to a .env file to load (default: .env in the current directory)
"""

import argparse
import csv
import os
import sys
from dotenv import load_dotenv

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

import psycopg2
from psycopg2.extras import execute_values

# Each entry: (filename, act_pair, new_act, old_act, new_col, old_col, subject_col, summary_col)
FILES = [
    ("BNS_to_IPC.csv",   "BNS_IPC",   "BNS",  "IPC",  "BNS_Section",  "IPC_Section",  "Subject", "Summary_of_Comparison"),
    ("BNSS_to_CrPC.csv", "BNSS_CRPC", "BNSS", "CrPC", "BNSS_Section", "CrPC_Section", "Subject", "Summary_of_Comparison"),
    ("BSA_to_IEA.csv",   "BSA_IEA",   "BSA",  "IEA",  "BSA_Section",  "IEA_Section",  "Subject", "Summary_of_Comparison"),
]


def clean(value):
    """Normalize blank/placeholder values; keep everything else as-is text."""
    if value is None:
        return None
    v = value.strip()
    return v if v else None


def load_rows(csv_dir):
    all_rows = []
    for fname, act_pair, new_act, old_act, new_col, old_col, subj_col, summ_col in FILES:
        path = os.path.join(csv_dir, fname)
        if not os.path.exists(path):
            print(f"ERROR: expected file not found: {path}", file=sys.stderr)
            sys.exit(1)

        with open(path, encoding="utf-8-sig", newline="") as fh:
            reader = csv.DictReader(fh)
            missing = {new_col, old_col, subj_col, summ_col} - set(reader.fieldnames or [])
            if missing:
                print(f"ERROR: {fname} is missing expected columns: {missing}", file=sys.stderr)
                sys.exit(1)

            count = 0
            for row in reader:
                all_rows.append((
                    act_pair,
                    new_act,
                    old_act,
                    clean(row[new_col]),
                    clean(row[old_col]),
                    clean(row[subj_col]),
                    clean(row[summ_col]),
                ))
                count += 1
            print(f"  parsed {count} rows from {fname}")

    return all_rows


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv-dir", default=".", help="Directory containing the source CSVs")
    parser.add_argument("--truncate", action="store_true", help="Truncate the table before seeding")
    parser.add_argument("--env-file", default=".env", help="Path to a .env file to load (default: .env)")
    args = parser.parse_args()

    if load_dotenv is not None:
        if os.path.exists(args.env_file):
            load_dotenv(args.env_file)
            print(f"Loaded environment variables from {args.env_file}")
    elif os.path.exists(args.env_file):
        print(f"WARNING: found {args.env_file} but python-dotenv is not installed "
              "(pip install python-dotenv); it will NOT be auto-loaded.", file=sys.stderr)

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set. Either export it, e.g.\n"
              '  export DATABASE_URL="postgresql://user:password@host:5432/dbname"\n'
              "or add it to a .env file (DATABASE_URL=...) in the current directory.", file=sys.stderr)
        sys.exit(1)

    print("Reading CSVs...")
    rows = load_rows(args.csv_dir)
    print(f"Total rows to insert: {len(rows)}")

    conn = psycopg2.connect(database_url)
    try:
        with conn:
            with conn.cursor() as cur:
                if args.truncate:
                    print("Truncating legal_section_mappings...")
                    cur.execute("TRUNCATE TABLE legal_section_mappings RESTART IDENTITY;")

                execute_values(
                    cur,
                    """
                    INSERT INTO legal_section_mappings
                        (act_pair, new_act, old_act, new_section, old_section, subject, summary_of_comparison)
                    VALUES %s
                    """,
                    rows,
                    page_size=500,
                )
        print(f"Done. Inserted {len(rows)} rows into legal_section_mappings.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()