from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional
from ..models import (
    LeagueSettings, RawSourceData, Player, DraftLog,
    LeagueSettingsCreate, LeagueSettingsResponse,
    RawSourceDataCreate, RawSourceDataResponse,
    PlayerCreate, PlayerResponse,
    DraftLogCreate, DraftLogResponse
)
from ..database import get_db

router = APIRouter(prefix="/api/fantasy", tags=["fantasy"])

# League Settings Routes
@router.get("/league-settings", response_model=LeagueSettingsResponse)
async def get_league_settings(db: Session = Depends(get_db)):
    """Get the current league settings"""
    settings = db.query(LeagueSettings).first()
    if not settings:
        # Create default settings if none exist
        settings = LeagueSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.post("/league-settings", response_model=LeagueSettingsResponse)
async def create_league_settings(settings: LeagueSettingsCreate, db: Session = Depends(get_db)):
    """Create or update league settings"""
    existing = db.query(LeagueSettings).first()
    if existing:
        # Update existing settings
        for key, value in settings.dict().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new settings
        db_settings = LeagueSettings(**settings.dict())
        db.add(db_settings)
        db.commit()
        db.refresh(db_settings)
        return db_settings

# Raw Source Data Routes
@router.get("/raw-data", response_model=List[RawSourceDataResponse])
async def get_raw_source_data(
    source_name: Optional[str] = Query(None),
    processed: Optional[bool] = Query(None),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """Get raw source data with optional filtering"""
    query = db.query(RawSourceData)
    
    if source_name:
        query = query.filter(RawSourceData.source_name == source_name)
    if processed is not None:
        query = query.filter(RawSourceData.processed == processed)
    
    return query.order_by(desc(RawSourceData.scraped_at)).limit(limit).all()

@router.post("/raw-data", response_model=RawSourceDataResponse)
async def create_raw_source_data(data: RawSourceDataCreate, db: Session = Depends(get_db)):
    """Create new raw source data entry"""
    db_data = RawSourceData(**data.dict())
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

@router.put("/raw-data/{data_id}/mark-processed")
async def mark_raw_data_processed(data_id: int, db: Session = Depends(get_db)):
    """Mark raw data as processed"""
    data = db.query(RawSourceData).filter(RawSourceData.id == data_id).first()
    if not data:
        raise HTTPException(status_code=404, detail="Raw data not found")
    
    data.processed = True
    db.commit()
    return {"message": "Data marked as processed"}

# Player Routes
@router.get("/players", response_model=List[PlayerResponse])
async def get_players(
    position: Optional[str] = Query(None),
    team: Optional[str] = Query(None),
    injury_status: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """Get players with optional filtering"""
    query = db.query(Player)
    
    if position:
        query = query.filter(Player.position == position)
    if team:
        query = query.filter(Player.team == team)
    if injury_status:
        query = query.filter(Player.injury_status == injury_status)
    if is_active is not None:
        query = query.filter(Player.is_active == is_active)
    
    return query.order_by(asc(Player.ecr_overall_rank)).limit(limit).all()

@router.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get a specific player by ID"""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@router.post("/players", response_model=PlayerResponse)
async def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    """Create a new player"""
    db_player = Player(**player.dict())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.put("/players/{player_id}", response_model=PlayerResponse)
async def update_player(player_id: int, player: PlayerCreate, db: Session = Depends(get_db)):
    """Update a player"""
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    for key, value in player.dict().items():
        setattr(db_player, key, value)
    
    db.commit()
    db.refresh(db_player)
    return db_player

@router.get("/players/search/{search_term}", response_model=List[PlayerResponse])
async def search_players(search_term: str, db: Session = Depends(get_db)):
    """Search players by name"""
    players = db.query(Player).filter(
        or_(
            Player.player_name.ilike(f"%{search_term}%"),
            Player.team.ilike(f"%{search_term}%")
        )
    ).order_by(asc(Player.ecr_overall_rank)).limit(50).all()
    return players

# Draft Log Routes
@router.get("/draft-log", response_model=List[DraftLogResponse])
async def get_draft_log(
    team_name: Optional[str] = Query(None),
    draft_round: Optional[int] = Query(None),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """Get draft log entries with optional filtering"""
    query = db.query(DraftLog)
    
    if team_name:
        query = query.filter(DraftLog.team_name == team_name)
    if draft_round:
        query = query.filter(DraftLog.draft_round == draft_round)
    
    return query.order_by(asc(DraftLog.pick_number)).limit(limit).all()

@router.post("/draft-log", response_model=DraftLogResponse)
async def create_draft_pick(pick: DraftLogCreate, db: Session = Depends(get_db)):
    """Record a new draft pick"""
    # Verify player exists
    player = db.query(Player).filter(Player.id == pick.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    db_pick = DraftLog(**pick.dict())
    db.add(db_pick)
    db.commit()
    db.refresh(db_pick)
    return db_pick

@router.delete("/draft-log/{pick_id}")
async def undo_draft_pick(pick_id: int, db: Session = Depends(get_db)):
    """Undo a draft pick"""
    pick = db.query(DraftLog).filter(DraftLog.id == pick_id).first()
    if not pick:
        raise HTTPException(status_code=404, detail="Draft pick not found")
    
    db.delete(pick)
    db.commit()
    return {"message": "Draft pick undone successfully"}

@router.get("/draft-log/team/{team_name}", response_model=List[DraftLogResponse])
async def get_team_draft(team_name: str, db: Session = Depends(get_db)):
    """Get all draft picks for a specific team"""
    picks = db.query(DraftLog).filter(
        DraftLog.team_name == team_name
    ).order_by(asc(DraftLog.pick_number)).all()
    return picks

@router.get("/draft-log/round/{round_number}", response_model=List[DraftLogResponse])
async def get_round_picks(round_number: int, db: Session = Depends(get_db)):
    """Get all picks from a specific round"""
    picks = db.query(DraftLog).filter(
        DraftLog.draft_round == round_number
    ).order_by(asc(DraftLog.draft_position)).all()
    return picks

# Analytics Routes
@router.get("/analytics/available-players")
async def get_available_players(db: Session = Depends(get_db)):
    """Get all players that haven't been drafted yet"""
    drafted_player_ids = db.query(DraftLog.player_id).distinct()
    available_players = db.query(Player).filter(
        and_(
            Player.is_active == True,
            ~Player.id.in_(drafted_player_ids)
        )
    ).order_by(asc(Player.ecr_overall_rank)).all()
    return available_players

@router.get("/analytics/draft-summary")
async def get_draft_summary(db: Session = Depends(get_db)):
    """Get draft summary statistics"""
    total_picks = db.query(DraftLog).count()
    teams = db.query(DraftLog.team_name).distinct().count()
    rounds = db.query(DraftLog.draft_round).distinct().count()
    
    # Get picks by position
    position_counts = db.query(
        DraftLog.position,
        db.func.count(DraftLog.id).label('count')
    ).group_by(DraftLog.position).all()
    
    return {
        "total_picks": total_picks,
        "teams": teams,
        "rounds": rounds,
        "position_breakdown": [{"position": pos, "count": count} for pos, count in position_counts]
    }
