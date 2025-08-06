from sqlalchemy import Column, Integer, String, DateTime, Float, Text, JSON, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any

Base = declarative_base()

# SQLAlchemy Models
class DataRecord(Base):
    __tablename__ = "data_records"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    value = Column(Float, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Calculation(Base):
    __tablename__ = "calculations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    formula = Column(Text, nullable=False)
    result = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Fantasy Football Models
class LeagueSettings(Base):
    __tablename__ = "league_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    league_name = Column(String(255), nullable=False, default="Default League")
    team_names = Column(JSON, nullable=False, default=list)  # List of team names
    scoring_rules = Column(JSON, nullable=False, default=dict)  # Scoring configuration
    roster_positions = Column(JSON, nullable=False, default=dict)  # Roster requirements
    auction_budget = Column(Integer, nullable=False, default=200)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RawSourceData(Base):
    __tablename__ = "raw_source_data"
    
    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(100), nullable=False, index=True)  # e.g., "ESPN", "Yahoo", "FantasyPros"
    player_name = Column(String(255), nullable=False, index=True)
    position = Column(String(10), nullable=False, index=True)  # QB, RB, WR, TE, etc.
    team = Column(String(10), nullable=True, index=True)
    raw_data = Column(JSON, nullable=False)  # All scraped data as JSON
    scraped_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    player_name = Column(String(255), nullable=False, index=True)
    position = Column(String(10), nullable=False, index=True)
    team = Column(String(10), nullable=True, index=True)
    
    # ECR (Expert Consensus Ranking)
    ecr = Column(Integer, nullable=True, index=True)
    ecr_position_rank = Column(Integer, nullable=True)
    ecr_overall_rank = Column(Integer, nullable=True)
    
    # VBD (Value Based Drafting)
    vbd_value = Column(Float, nullable=True)
    vbd_tier = Column(Integer, nullable=True)
    
    # Projections
    projected_points = Column(Float, nullable=True)
    projected_floor = Column(Float, nullable=True)
    projected_ceiling = Column(Float, nullable=True)
    
    # Injury and Status
    injury_status = Column(String(50), nullable=True, index=True)  # "Questionable", "Out", "IR", etc.
    injury_notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # Additional Data
    adp = Column(Float, nullable=True, index=True)  # Average Draft Position
    auction_value = Column(Float, nullable=True)
    bye_week = Column(Integer, nullable=True)
    
    # Timestamps
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class DraftLog(Base):
    __tablename__ = "draft_log"
    
    id = Column(Integer, primary_key=True, index=True)
    pick_number = Column(Integer, nullable=False, index=True)
    team_name = Column(String(255), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    player_name = Column(String(255), nullable=False)  # Denormalized for easy access
    position = Column(String(10), nullable=False)
    team = Column(String(10), nullable=True)
    
    # Auction specific fields
    bid_amount = Column(Float, nullable=True)  # For auction drafts
    nomination_order = Column(Integer, nullable=True)  # Order of nomination
    
    # Draft metadata
    draft_round = Column(Integer, nullable=False, index=True)
    draft_position = Column(Integer, nullable=False, index=True)  # Position in round
    
    # Timestamps
    drafted_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    player = relationship("Player", backref="draft_picks")

# Pydantic Models for API
class DataRecordCreate(BaseModel):
    title: str
    value: float
    category: str
    description: Optional[str] = None

class DataRecordResponse(BaseModel):
    id: int
    title: str
    value: float
    category: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CalculationCreate(BaseModel):
    name: str
    formula: str

class CalculationResponse(BaseModel):
    id: int
    name: str
    formula: str
    result: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Fantasy Football Pydantic Models
class LeagueSettingsCreate(BaseModel):
    league_name: str
    team_names: list[str]
    scoring_rules: Dict[str, Any]
    roster_positions: Dict[str, Any]
    auction_budget: int = 200

class LeagueSettingsResponse(BaseModel):
    id: int
    league_name: str
    team_names: list[str]
    scoring_rules: Dict[str, Any]
    roster_positions: Dict[str, Any]
    auction_budget: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RawSourceDataCreate(BaseModel):
    source_name: str
    player_name: str
    position: str
    team: Optional[str] = None
    raw_data: Dict[str, Any]

class RawSourceDataResponse(BaseModel):
    id: int
    source_name: str
    player_name: str
    position: str
    team: Optional[str] = None
    raw_data: Dict[str, Any]
    scraped_at: datetime
    processed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PlayerCreate(BaseModel):
    player_name: str
    position: str
    team: Optional[str] = None
    ecr: Optional[int] = None
    ecr_position_rank: Optional[int] = None
    ecr_overall_rank: Optional[int] = None
    vbd_value: Optional[float] = None
    vbd_tier: Optional[int] = None
    projected_points: Optional[float] = None
    projected_floor: Optional[float] = None
    projected_ceiling: Optional[float] = None
    injury_status: Optional[str] = None
    injury_notes: Optional[str] = None
    is_active: bool = True
    adp: Optional[float] = None
    auction_value: Optional[float] = None
    bye_week: Optional[int] = None

class PlayerResponse(BaseModel):
    id: int
    player_name: str
    position: str
    team: Optional[str] = None
    ecr: Optional[int] = None
    ecr_position_rank: Optional[int] = None
    ecr_overall_rank: Optional[int] = None
    vbd_value: Optional[float] = None
    vbd_tier: Optional[int] = None
    projected_points: Optional[float] = None
    projected_floor: Optional[float] = None
    projected_ceiling: Optional[float] = None
    injury_status: Optional[str] = None
    injury_notes: Optional[str] = None
    is_active: bool
    adp: Optional[float] = None
    auction_value: Optional[float] = None
    bye_week: Optional[int] = None
    last_updated: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class DraftLogCreate(BaseModel):
    pick_number: int
    team_name: str
    player_id: int
    player_name: str
    position: str
    team: Optional[str] = None
    bid_amount: Optional[float] = None
    nomination_order: Optional[int] = None
    draft_round: int
    draft_position: int

class DraftLogResponse(BaseModel):
    id: int
    pick_number: int
    team_name: str
    player_id: int
    player_name: str
    position: str
    team: Optional[str] = None
    bid_amount: Optional[float] = None
    nomination_order: Optional[int] = None
    draft_round: int
    draft_position: int
    drafted_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
