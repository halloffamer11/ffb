#!/usr/bin/env python3
"""
Database Setup Test Script
Tests the database setup and verifies all tables are created correctly.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app', 'backend'))

from sqlalchemy import inspect, text
from database import engine, SessionLocal
from models import Base, DataRecord, Calculation, LeagueSettings, RawSourceData, Player, DraftLog

def test_database_connection():
    """Test database connection"""
    print("🔌 Testing database connection...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_tables_exist():
    """Test that all expected tables exist"""
    print("\n📋 Testing table existence...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    expected_tables = [
        'data_records',
        'calculations', 
        'league_settings',
        'raw_source_data',
        'players',
        'draft_log'
    ]
    
    missing_tables = []
    for table in expected_tables:
        if table in existing_tables:
            print(f"✅ Table '{table}' exists")
        else:
            print(f"❌ Table '{table}' missing")
            missing_tables.append(table)
    
    if missing_tables:
        print(f"\n❌ Missing tables: {missing_tables}")
        return False
    else:
        print("✅ All expected tables exist")
        return True

def test_table_schemas():
    """Test that table schemas match our models"""
    print("\n🏗️  Testing table schemas...")
    inspector = inspect(engine)
    
    # Test data_records table
    data_records_columns = {col['name']: col['type'] for col in inspector.get_columns('data_records')}
    expected_data_records = {
        'id': 'INTEGER',
        'title': 'VARCHAR(255)',
        'value': 'FLOAT',
        'category': 'VARCHAR(100)',
        'description': 'TEXT',
        'created_at': 'DATETIME',
        'updated_at': 'DATETIME'
    }
    
    print("📊 data_records table schema:")
    for col, expected_type in expected_data_records.items():
        if col in data_records_columns:
            print(f"  ✅ {col}: {data_records_columns[col]}")
        else:
            print(f"  ❌ {col}: missing")
    
    # Test players table (most complex)
    players_columns = {col['name']: col['type'] for col in inspector.get_columns('players')}
    expected_players = {
        'id': 'INTEGER',
        'player_name': 'VARCHAR(255)',
        'position': 'VARCHAR(10)',
        'team': 'VARCHAR(10)',
        'ecr': 'INTEGER',
        'ecr_position_rank': 'INTEGER',
        'ecr_overall_rank': 'INTEGER',
        'vbd_value': 'FLOAT',
        'vbd_tier': 'INTEGER',
        'projected_points': 'FLOAT',
        'projected_floor': 'FLOAT',
        'projected_ceiling': 'FLOAT',
        'injury_status': 'VARCHAR(50)',
        'injury_notes': 'TEXT',
        'is_active': 'BOOLEAN',
        'adp': 'FLOAT',
        'auction_value': 'FLOAT',
        'bye_week': 'INTEGER',
        'last_updated': 'DATETIME',
        'created_at': 'DATETIME'
    }
    
    print("\n🏈 players table schema:")
    for col, expected_type in expected_players.items():
        if col in players_columns:
            print(f"  ✅ {col}: {players_columns[col]}")
        else:
            print(f"  ❌ {col}: missing")

def test_model_operations():
    """Test basic CRUD operations with our models"""
    print("\n🧪 Testing model operations...")
    
    try:
        db = SessionLocal()
        
        # Test creating a data record
        test_record = DataRecord(
            title="Test Record",
            value=42.5,
            category="test",
            description="This is a test record"
        )
        db.add(test_record)
        db.commit()
        db.refresh(test_record)
        print(f"✅ Created test record with ID: {test_record.id}")
        
        # Test creating a player
        test_player = Player(
            player_name="Test Player",
            position="QB",
            team="TEST",
            ecr=1,
            projected_points=250.0,
            is_active=True
        )
        db.add(test_player)
        db.commit()
        db.refresh(test_player)
        print(f"✅ Created test player with ID: {test_player.id}")
        
        # Test querying
        players = db.query(Player).filter(Player.position == "QB").all()
        print(f"✅ Found {len(players)} QB players")
        
        # Clean up test data
        db.delete(test_record)
        db.delete(test_player)
        db.commit()
        print("✅ Cleaned up test data")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Model operations failed: {e}")
        return False

def test_foreign_key_constraints():
    """Test foreign key constraints"""
    print("\n🔗 Testing foreign key constraints...")
    
    try:
        db = SessionLocal()
        
        # Create a test player first
        test_player = Player(
            player_name="Draft Test Player",
            position="RB",
            team="TEST",
            is_active=True
        )
        db.add(test_player)
        db.commit()
        db.refresh(test_player)
        
        # Test creating a draft log entry with foreign key
        test_draft = DraftLog(
            pick_number=1,
            team_name="Test Team",
            player_id=test_player.id,
            player_name=test_player.player_name,
            position=test_player.position,
            team=test_player.team,
            draft_round=1,
            draft_position=1
        )
        db.add(test_draft)
        db.commit()
        db.refresh(test_draft)
        print(f"✅ Created draft log entry with ID: {test_draft.id}")
        
        # Clean up
        db.delete(test_draft)
        db.delete(test_player)
        db.commit()
        print("✅ Cleaned up test data")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Foreign key test failed: {e}")
        return False

def main():
    """Run all database tests"""
    print("🚀 Starting Database Setup Tests\n")
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Table Existence", test_tables_exist),
        ("Table Schemas", test_table_schemas),
        ("Model Operations", test_model_operations),
        ("Foreign Key Constraints", test_foreign_key_constraints)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "="*50)
    print("📊 TEST RESULTS")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Database setup is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the database setup.")
        return False

if __name__ == "__main__":
    main()
