from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..calculation_engine import calculation_engine
from pydantic import BaseModel

router = APIRouter(prefix="/api/calculations", tags=["calculations"])

class BasicCalculationRequest(BaseModel):
    operation: str
    values: List[float]

class StatisticalRequest(BaseModel):
    values: List[float]

class FormulaRequest(BaseModel):
    formula: str
    variables: Dict[str, float]

@router.post("/basic")
async def perform_basic_calculation(request: BasicCalculationRequest):
    """Perform basic mathematical operations"""
    result = calculation_engine.basic_math(request.operation, request.values)
    return result

@router.post("/stats")
async def perform_statistical_analysis(request: StatisticalRequest):
    """Perform statistical analysis on a list of values"""
    result = calculation_engine.statistical_analysis(request.values)
    return result

@router.post("/formula")
async def evaluate_custom_formula(request: FormulaRequest):
    """Evaluate a custom mathematical formula with variables"""
    result = calculation_engine.custom_formula(request.formula, request.variables)
    return result

@router.get("/history")
async def get_calculation_history():
    """Get the history of all calculations performed"""
    return calculation_engine.get_calculation_history()

@router.delete("/history")
async def clear_calculation_history():
    """Clear the calculation history"""
    calculation_engine.clear_history()
    return {"message": "Calculation history cleared successfully"}
