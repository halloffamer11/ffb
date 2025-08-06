import requests
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

class BaseScraper(ABC):
    """Base class for all scrapers"""
    
    def __init__(self, name: str):
        self.name = name
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.logger = logging.getLogger(f"scraper.{name}")
    
    @abstractmethod
    def scrape(self, **kwargs) -> Dict[str, Any]:
        """Main scraping method to be implemented by subclasses"""
        pass
    
    def validate_response(self, response: requests.Response) -> bool:
        """Validate if the response is successful"""
        if response.status_code != 200:
            self.logger.error(f"HTTP {response.status_code}: {response.text}")
            return False
        return True
    
    def safe_request(self, url: str, **kwargs) -> Optional[requests.Response]:
        """Make a safe HTTP request with error handling"""
        try:
            response = self.session.get(url, timeout=30, **kwargs)
            if self.validate_response(response):
                return response
        except requests.RequestException as e:
            self.logger.error(f"Request failed for {url}: {e}")
        except Exception as e:
            self.logger.error(f"Unexpected error for {url}: {e}")
        return None
    
    def parse_data(self, raw_data: Any) -> List[Dict[str, Any]]:
        """Parse raw data into structured format"""
        # Default implementation - subclasses can override
        return []
    
    def save_data(self, data: List[Dict[str, Any]]) -> bool:
        """Save scraped data to database"""
        # This would typically save to database
        # For now, just log the data
        self.logger.info(f"Scraped {len(data)} items from {self.name}")
        return True
    
    def run(self, **kwargs) -> Dict[str, Any]:
        """Run the complete scraping process"""
        start_time = datetime.utcnow()
        
        try:
            # Scrape data
            raw_data = self.scrape(**kwargs)
            
            # Parse data
            parsed_data = self.parse_data(raw_data)
            
            # Save data
            save_success = self.save_data(parsed_data)
            
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            return {
                "success": True,
                "scraper_name": self.name,
                "items_scraped": len(parsed_data),
                "duration_seconds": duration,
                "save_success": save_success,
                "timestamp": start_time.isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Scraping failed for {self.name}: {e}")
            return {
                "success": False,
                "scraper_name": self.name,
                "error": str(e),
                "timestamp": start_time.isoformat()
            }
