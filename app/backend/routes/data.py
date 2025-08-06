from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from ..models import DataRecord, DataRecordCreate, DataRecordResponse
from ..database import get_db

router = APIRouter(prefix="/api/data", tags=["data"])

@router.get("/", response_model=List[DataRecordResponse])
async def get_all_data(db: Session = Depends(get_db)):
    """Get all data records"""
    records = db.query(DataRecord).order_by(DataRecord.created_at.desc()).all()
    return records

@router.get("/{record_id}", response_model=DataRecordResponse)
async def get_data_record(record_id: int, db: Session = Depends(get_db)):
    """Get a specific data record by ID"""
    record = db.query(DataRecord).filter(DataRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

@router.post("/", response_model=DataRecordResponse)
async def create_data_record(record: DataRecordCreate, db: Session = Depends(get_db)):
    """Create a new data record"""
    db_record = DataRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.put("/{record_id}", response_model=DataRecordResponse)
async def update_data_record(record_id: int, record: DataRecordCreate, db: Session = Depends(get_db)):
    """Update an existing data record"""
    db_record = db.query(DataRecord).filter(DataRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    for key, value in record.dict().items():
        setattr(db_record, key, value)
    
    db.commit()
    db.refresh(db_record)
    return db_record

@router.delete("/{record_id}")
async def delete_data_record(record_id: int, db: Session = Depends(get_db)):
    """Delete a data record"""
    db_record = db.query(DataRecord).filter(DataRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db.delete(db_record)
    db.commit()
    return {"message": "Record deleted successfully"}

@router.get("/category/{category}", response_model=List[DataRecordResponse])
async def get_data_by_category(category: str, db: Session = Depends(get_db)):
    """Get all data records by category"""
    records = db.query(DataRecord).filter(DataRecord.category == category).all()
    return records
