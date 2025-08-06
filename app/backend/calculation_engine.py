import math
from typing import Dict, List, Any, Optional
from datetime import datetime

class CalculationEngine:
    """Engine for performing various calculations and data processing"""
    
    def __init__(self):
        self.calculation_history = []
    
    def basic_math(self, operation: str, values: List[float]) -> Dict[str, Any]:
        """Perform basic mathematical operations"""
        try:
            if operation == "sum":
                result = sum(values)
            elif operation == "average":
                result = sum(values) / len(values) if values else 0
            elif operation == "min":
                result = min(values) if values else 0
            elif operation == "max":
                result = max(values) if values else 0
            elif operation == "count":
                result = len(values)
            else:
                raise ValueError(f"Unsupported operation: {operation}")
            
            calculation_record = {
                "operation": operation,
                "values": values,
                "result": result,
                "timestamp": datetime.utcnow()
            }
            self.calculation_history.append(calculation_record)
            
            return {
                "success": True,
                "result": result,
                "operation": operation,
                "input_count": len(values)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "operation": operation
            }
    
    def statistical_analysis(self, values: List[float]) -> Dict[str, Any]:
        """Perform statistical analysis on a list of values"""
        if not values:
            return {"success": False, "error": "No values provided"}
        
        try:
            n = len(values)
            mean = sum(values) / n
            variance = sum((x - mean) ** 2 for x in values) / n
            std_dev = math.sqrt(variance)
            
            # Sort for median calculation
            sorted_values = sorted(values)
            if n % 2 == 0:
                median = (sorted_values[n//2 - 1] + sorted_values[n//2]) / 2
            else:
                median = sorted_values[n//2]
            
            return {
                "success": True,
                "count": n,
                "mean": mean,
                "median": median,
                "std_dev": std_dev,
                "variance": variance,
                "min": min(values),
                "max": max(values),
                "range": max(values) - min(values)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def custom_formula(self, formula: str, variables: Dict[str, float]) -> Dict[str, Any]:
        """Evaluate a custom mathematical formula with variables"""
        try:
            # Create a safe evaluation environment
            safe_dict = {
                'abs': abs,
                'round': round,
                'min': min,
                'max': max,
                'sum': sum,
                'math': math
            }
            safe_dict.update(variables)
            
            # Replace common mathematical symbols
            formula = formula.replace('^', '**')
            
            result = eval(formula, {"__builtins__": {}}, safe_dict)
            
            calculation_record = {
                "formula": formula,
                "variables": variables,
                "result": result,
                "timestamp": datetime.utcnow()
            }
            self.calculation_history.append(calculation_record)
            
            return {
                "success": True,
                "result": result,
                "formula": formula,
                "variables": variables
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "formula": formula
            }
    
    def get_calculation_history(self) -> List[Dict[str, Any]]:
        """Get the history of all calculations performed"""
        return self.calculation_history
    
    def clear_history(self):
        """Clear the calculation history"""
        self.calculation_history = []

# Global instance
calculation_engine = CalculationEngine()
