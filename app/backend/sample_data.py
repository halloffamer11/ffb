#!/usr/bin/env python3
"""
Sample data script for Fantasy Football application
Populates the database with example data for testing
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.backend.database import SessionLocal
from app.backend.models import LeagueSettings, RawSourceData, Player, DraftLog
from datetime import datetime

def create_sample_data():
    """Create sample data for testing"""
    db = SessionLocal()
    
    try:
        # Create sample league settings
        league_settings = LeagueSettings(
            league_name="Sample Fantasy League",
            team_names=["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"],
            scoring_rules={
                "passing_yards": 0.04,
                "passing_touchdowns": 4,
                "rushing_yards": 0.1,
                "rushing_touchdowns": 6,
                "receiving_yards": 0.1,
                "receiving_touchdowns": 6,
                "receptions": 1,
                "interceptions": -2,
                "fumbles_lost": -2
            },
            roster_positions={
                "QB": 1,
                "RB": 2,
                "WR": 2,
                "TE": 1,
                "FLEX": 1,
                "K": 1,
                "DEF": 1,
                "BENCH": 6
            },
            auction_budget=200
        )
        db.add(league_settings)
        
        # Create sample raw source data
        raw_data_samples = [
            {
                "source_name": "ESPN",
                "player_name": "Patrick Mahomes",
                "position": "QB",
                "team": "KC",
                "raw_data": {
                    "rank": 1,
                    "projected_points": 320.5,
                    "adp": 1.2,
                    "url": "https://espn.com/player/mahomes"
                }
            },
            {
                "source_name": "Yahoo",
                "player_name": "Christian McCaffrey",
                "position": "RB",
                "team": "SF",
                "raw_data": {
                    "rank": 2,
                    "projected_points": 298.3,
                    "adp": 2.1,
                    "url": "https://yahoo.com/player/mccaffrey"
                }
            },
            {
                "source_name": "FantasyPros",
                "player_name": "Tyreek Hill",
                "position": "WR",
                "team": "MIA",
                "raw_data": {
                    "rank": 3,
                    "projected_points": 285.7,
                    "adp": 3.5,
                    "url": "https://fantasypros.com/player/hill"
                }
            }
        ]
        
        for raw_data in raw_data_samples:
            db_raw = RawSourceData(**raw_data)
            db.add(db_raw)
        
        # Create sample players
        players_data = [
            {
                "player_name": "Patrick Mahomes",
                "position": "QB",
                "team": "KC",
                "ecr": 1,
                "ecr_position_rank": 1,
                "ecr_overall_rank": 1,
                "vbd_value": 85.2,
                "vbd_tier": 1,
                "projected_points": 320.5,
                "projected_floor": 280.0,
                "projected_ceiling": 380.0,
                "adp": 1.2,
                "auction_value": 45,
                "bye_week": 10
            },
            {
                "player_name": "Christian McCaffrey",
                "position": "RB",
                "team": "SF",
                "ecr": 2,
                "ecr_position_rank": 1,
                "ecr_overall_rank": 2,
                "vbd_value": 78.9,
                "vbd_tier": 1,
                "projected_points": 298.3,
                "projected_floor": 250.0,
                "projected_ceiling": 350.0,
                "adp": 2.1,
                "auction_value": 42,
                "bye_week": 9
            },
            {
                "player_name": "Tyreek Hill",
                "position": "WR",
                "team": "MIA",
                "ecr": 3,
                "ecr_position_rank": 1,
                "ecr_overall_rank": 3,
                "vbd_value": 72.4,
                "vbd_tier": 1,
                "projected_points": 285.7,
                "projected_floor": 240.0,
                "projected_ceiling": 330.0,
                "adp": 3.5,
                "auction_value": 38,
                "bye_week": 11
            },
            {
                "player_name": "Travis Kelce",
                "position": "TE",
                "team": "KC",
                "ecr": 4,
                "ecr_position_rank": 1,
                "ecr_overall_rank": 4,
                "vbd_value": 68.1,
                "vbd_tier": 1,
                "projected_points": 275.2,
                "projected_floor": 230.0,
                "projected_ceiling": 320.0,
                "adp": 4.8,
                "auction_value": 35,
                "bye_week": 10
            },
            {
                "player_name": "Saquon Barkley",
                "position": "RB",
                "team": "PHI",
                "ecr": 5,
                "ecr_position_rank": 2,
                "ecr_overall_rank": 5,
                "vbd_value": 65.3,
                "vbd_tier": 1,
                "projected_points": 268.9,
                "projected_floor": 220.0,
                "projected_ceiling": 310.0,
                "adp": 5.2,
                "auction_value": 32,
                "bye_week": 7
            },
            {
                "player_name": "Justin Jefferson",
                "position": "WR",
                "team": "MIN",
                "ecr": 6,
                "ecr_position_rank": 2,
                "ecr_overall_rank": 6,
                "vbd_value": 62.7,
                "vbd_tier": 1,
                "projected_points": 262.4,
                "projected_floor": 215.0,
                "projected_ceiling": 305.0,
                "adp": 6.1,
                "auction_value": 30,
                "bye_week": 13
            },
            {
                "player_name": "Josh Allen",
                "position": "QB",
                "team": "BUF",
                "ecr": 7,
                "ecr_position_rank": 2,
                "ecr_overall_rank": 7,
                "vbd_value": 59.8,
                "vbd_tier": 2,
                "projected_points": 255.6,
                "projected_floor": 210.0,
                "projected_ceiling": 295.0,
                "adp": 7.3,
                "auction_value": 28,
                "bye_week": 13
            },
            {
                "player_name": "Austin Ekeler",
                "position": "RB",
                "team": "LAC",
                "ecr": 8,
                "ecr_position_rank": 3,
                "ecr_overall_rank": 8,
                "vbd_value": 57.2,
                "vbd_tier": 2,
                "projected_points": 248.7,
                "projected_floor": 200.0,
                "projected_ceiling": 285.0,
                "adp": 8.5,
                "auction_value": 25,
                "bye_week": 5
            }
        ]
        
        created_players = []
        for player_data in players_data:
            db_player = Player(**player_data)
            db.add(db_player)
            db.flush()  # Get the ID
            created_players.append(db_player)
        
        # Create sample draft picks
        draft_picks = [
            {
                "pick_number": 1,
                "team_name": "Team Alpha",
                "player_id": created_players[0].id,  # Mahomes
                "player_name": "Patrick Mahomes",
                "position": "QB",
                "team": "KC",
                "bid_amount": 45,
                "draft_round": 1,
                "draft_position": 1
            },
            {
                "pick_number": 2,
                "team_name": "Team Beta",
                "player_id": created_players[1].id,  # McCaffrey
                "player_name": "Christian McCaffrey",
                "position": "RB",
                "team": "SF",
                "bid_amount": 42,
                "draft_round": 1,
                "draft_position": 2
            },
            {
                "pick_number": 3,
                "team_name": "Team Gamma",
                "player_id": created_players[2].id,  # Hill
                "player_name": "Tyreek Hill",
                "position": "WR",
                "team": "MIA",
                "bid_amount": 38,
                "draft_round": 1,
                "draft_position": 3
            },
            {
                "pick_number": 4,
                "team_name": "Team Delta",
                "player_id": created_players[3].id,  # Kelce
                "player_name": "Travis Kelce",
                "position": "TE",
                "team": "KC",
                "bid_amount": 35,
                "draft_round": 1,
                "draft_position": 4
            }
        ]
        
        for pick_data in draft_picks:
            db_pick = DraftLog(**pick_data)
            db.add(db_pick)
        
        db.commit()
        print("✅ Sample data created successfully!")
        print(f"📊 Created {len(players_data)} players")
        print(f"📋 Created {len(draft_picks)} draft picks")
        print(f"⚙️  Created league settings")
        print(f"📥 Created {len(raw_data_samples)} raw data entries")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating sample data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()
