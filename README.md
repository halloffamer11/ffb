# FFB Application

A modern FastAPI application with a beautiful single-page frontend for data management and calculations.

## Features

- **Dashboard**: Overview of data statistics and recent activity
- **Data Management**: CRUD operations for data records with search and filtering
- **Calculations**: Mathematical operations, statistical analysis, and custom formula evaluation
- **Modern UI**: Responsive design with smooth animations and intuitive navigation
- **SQLite Database**: Lightweight database with SQLAlchemy ORM
- **RESTful API**: Clean API endpoints for all operations

## Project Structure

```
/app
   /backend
      main.py                 # FastAPI application entry point
      models.py               # Database models and Pydantic schemas
      database.py             # Database configuration
      calculation_engine.py   # Mathematical operations engine
      routes/
         __init__.py
         data.py              # Data management routes
         calculations.py      # Calculation routes
      scrapers/
         __init__.py
         base_scraper.py     # Base scraper class
   /frontend
      index.html             # Main HTML file
      /static
         /css
            styles.css       # Modern CSS styles
         /js
            app.js          # Frontend JavaScript
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd /path/to/your/project
   ```

2. **Create and activate virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install fastapi uvicorn sqlalchemy python-multipart requests aiofiles
   ```

4. **Run the application**
   
   **Option 1: Using the startup script**
   ```bash
   ./start.sh
   ```
   
   **Option 2: Manual startup**
   ```bash
   python run.py
   ```
   
   **Option 3: Direct uvicorn**
   ```bash
   uvicorn app.backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:8000`

## API Endpoints

### Data Management
- `GET /api/data` - Get all data records
- `POST /api/data` - Create a new data record
- `GET /api/data/{id}` - Get a specific data record
- `PUT /api/data/{id}` - Update a data record
- `DELETE /api/data/{id}` - Delete a data record
- `GET /api/data/category/{category}` - Get records by category

### Calculations
- `POST /api/calculations/basic` - Perform basic mathematical operations
- `POST /api/calculations/stats` - Perform statistical analysis
- `POST /api/calculations/formula` - Evaluate custom formulas
- `GET /api/calculations/history` - Get calculation history
- `DELETE /api/calculations/history` - Clear calculation history

### Fantasy Football
- `GET /api/fantasy/league-settings` - Get league settings
- `POST /api/fantasy/league-settings` - Create/update league settings
- `GET /api/fantasy/raw-data` - Get raw source data
- `POST /api/fantasy/raw-data` - Create raw source data
- `PUT /api/fantasy/raw-data/{id}/mark-processed` - Mark data as processed
- `GET /api/fantasy/players` - Get players with filtering
- `GET /api/fantasy/players/{id}` - Get specific player
- `POST /api/fantasy/players` - Create new player
- `PUT /api/fantasy/players/{id}` - Update player
- `GET /api/fantasy/players/search/{term}` - Search players
- `GET /api/fantasy/draft-log` - Get draft log
- `POST /api/fantasy/draft-log` - Record draft pick
- `DELETE /api/fantasy/draft-log/{id}` - Undo draft pick
- `GET /api/fantasy/draft-log/team/{team}` - Get team's draft
- `GET /api/fantasy/draft-log/round/{round}` - Get round picks
- `GET /api/fantasy/analytics/available-players` - Get undrafted players
- `GET /api/fantasy/analytics/draft-summary` - Get draft statistics

### System
- `GET /` - Serve the main HTML file
- `GET /api/health` - Health check endpoint

## Usage

### Dashboard
The dashboard provides an overview of your data with:
- Total number of records
- Number of categories
- Average and maximum values
- Recent activity feed

### Data Management
- **Add Records**: Click "Add Record" to create new data entries
- **Search**: Use the search box to find specific records
- **Filter**: Use the category dropdown to filter by category
- **Edit**: Click the edit button to modify existing records
- **Delete**: Click the delete button to remove records

### Calculations
- **Basic Operations**: Sum, average, min, max, count
- **Statistical Analysis**: Mean, median, standard deviation, variance
- **Custom Formulas**: Evaluate mathematical expressions with variables

## Database

The application uses SQLite as the database with the following tables:

### Core Tables
- `data_records`: Stores the main data entries
- `calculations`: Stores calculation history

### Fantasy Football Tables
- `league_settings`: Stores team names, scoring rules, and roster requirements
- `raw_source_data`: Stores unprocessed scraped player data from various sources
- `players`: Stores processed player information with ECR, VBD, projections, and injury status
- `draft_log`: Stores auction picks for undo functionality and draft tracking

### Sample Data
To populate the database with sample fantasy football data:
```bash
cd app/backend
python sample_data.py
```

## Development

### Adding New Features

1. **Backend Routes**: Add new routes in the `routes/` directory
2. **Frontend**: Update the HTML and JavaScript files
3. **Database**: Add new models in `models.py`

### Styling

The application uses modern CSS with:
- Flexbox and Grid layouts
- Smooth transitions and animations
- Responsive design
- Glassmorphism effects

### JavaScript

The frontend uses vanilla JavaScript with:
- ES6+ features
- Async/await for API calls
- Event-driven architecture
- Modular class-based structure

## Technologies Used

- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with modern design principles
- **Icons**: Font Awesome

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
