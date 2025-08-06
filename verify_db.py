#!/usr/bin/env python3
"""
Database Verification Script
Comprehensive verification of database setup and data.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app', 'backend'))

from sqlalchemy import inspect, text
from database import engine, SessionLocal
from models import Base, DataRecord, Calculation, LeagueSettings, RawSourceData, Player, DraftLog

def show_table_info():
    """Show information about all tables"""
    print("📊 DATABASE TABLE INFORMATION")
    print("=" * 50)
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    for table in tables:
        print(f"\n📋 Table: {table}")
        print("-" * 30)
        
        # Get column information
        columns = inspector.get_columns(table)
        print("Columns:")
        for col in columns:
            nullable = "NULL" if col['nullable'] else "NOT NULL"
            print(f"  - {col['name']}: {col['type']} ({nullable})")
        
        # Get index information
        indexes = inspector.get_indexes(table)
        if indexes:
            print("Indexes:")
            for idx in indexes:
                print(f"  - {idx['name']}: {idx['column_names']}")
        
        # Get foreign key information
        foreign_keys = inspector.get_foreign_keys(table)
        if foreign_keys:
            print("Foreign Keys:")
            for fk in foreign_keys:
                print(f"  - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")

def show_table_counts():
    """Show row counts for all tables"""
    print("\n📈 TABLE ROW COUNTS")
    print("=" * 30)
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    with engine.connect() as conn:
        for table in tables:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"{table:20} : {count:5} rows")

def show_sample_data():
    """Show sample data from each table"""
    print("\n📝 SAMPLE DATA")
    print("=" * 30)
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    with engine.connect() as conn:
        for table in tables:
            print(f"\n📋 {table}:")
            print("-" * 20)
            
            # Get first 3 rows
            result = conn.execute(text(f"SELECT * FROM {table} LIMIT 3"))
            rows = result.fetchall()
            
            if rows:
                # Get column names
                columns = [desc[0] for desc in result.description]
                print(f"Columns: {', '.join(columns)}")
                
                for i, row in enumerate(rows, 1):
                    print(f"Row {i}: {dict(zip(columns, row))}")
            else:
                print("No data")

def test_alembic_status():
    """Test Alembic status"""
    print("\n🔄 ALEMBIC STATUS")
    print("=" * 30)
    
    try:
        import subprocess
        result = subprocess.run(["alembic", "current"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"Current revision: {result.stdout.strip()}")
        else:
            print("❌ Alembic not properly configured")
    except Exception as e:
        print(f"❌ Error checking Alembic status: {e}")

def test_model_imports():
    """Test that all models can be imported and used"""
    print("\n🧪 MODEL IMPORT TESTS")
    print("=" * 30)
    
    models = [DataRecord, Calculation, LeagueSettings, RawSourceData, Player, DraftLog]
    
    for model in models:
        try:
            # Test creating an instance
            if model == DataRecord:
                instance = model(title="Test", value=1.0, category="test")
            elif model == Calculation:
                instance = model(name="Test", formula="1+1")
            elif model == LeagueSettings:
                instance = model(league_name="Test", team_names=[], scoring_rules={}, roster_positions={})
            elif model == RawSourceData:
                instance = model(source_name="Test", player_name="Test", position="QB", raw_data={})
            elif model == Player:
                instance = model(player_name="Test", position="QB")
            elif model == DraftLog:
                instance = model(pick_number=1, team_name="Test", player_id=1, player_name="Test", position="QB", draft_round=1, draft_position=1)
            
            print(f"✅ {model.__name__}: OK")
        except Exception as e:
            print(f"❌ {model.__name__}: {e}")

def main():
    """Run comprehensive database verification"""
    print("🔍 COMPREHENSIVE DATABASE VERIFICATION")
    print("=" * 50)
    
    # Test database connection
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection: OK")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    # Run all verification functions
    functions = [
        ("Table Information", show_table_info),
        ("Row Counts", show_table_counts),
        ("Sample Data", show_sample_data),
        ("Alembic Status", test_alembic_status),
        ("Model Imports", test_model_imports)
    ]
    
    for name, func in functions:
        try:
            func()
        except Exception as e:
            print(f"❌ {name} failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 VERIFICATION COMPLETE")
    print("=" * 50)

if __name__ == "__main__":
    main()
