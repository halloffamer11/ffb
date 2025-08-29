- Player: VARCHAR(100) - Player full name
- Position: VARCHAR(10) - NFL position abbreviation  
- Team: VARCHAR(5) - NFL team abbreviation (NEW FIELD)
- Updated: DATE - Last injury report update date
- Injury: VARCHAR(50) - Injury type/body part
- Injury_Status: VARCHAR(200) - Detailed availability status

Golden Dataset
{
  "source": "CBS Injury Report",
  "data_type": "player_injuries", 
  "last_updated": "2025-08-09",
  "records": [
    {
      "player": "Will Hernandez",
      "position": "G", 
      "team": "ARI",
      "updated": "2025-08-08",
      "injury": "knee - ACL",
      "injury_status": "Physically Unable to Perform, Expected Return - Week 2"
    },
    {
      "player": "Sam LaPorta", 
      "position": "TE",
      "team": "DET", 
      "updated": "2025-08-03",
      "injury": "Undisclosed",
      "injury_status": "IR-Injured Reserve"
    },
    {
      "player": "Joey Blount",
      "position": "SAF",
      "team": "NO", 
      "updated": "2025-08-02",
      "injury": "Illness", 
      "injury_status": "Questionable for Week 1 at New Orleans"
    }
  ]
}