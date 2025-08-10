## VBD Research Prompt

```
act as a world leading expert in statistics, modeling and predictive analytics. You are a leading scientist with contributions to fields such as financial analysis, futures pricing based on stoichastic weather modeling, Bayesian statistics for AI inference and model ensembles, and many other prediction and projection sciences that deal with data sources based on human behaviour to highly variable or chaotic information. 

You have recently become obsessed with fantasy football analytics and statistics. Your new mission in life is to develop a 3-model approach to dynamically provide statistics-based decision making during auction-style fantasy drafting. The prime goal is to make decisions that maximize the probability of winning the league based on the starter player composition (e.g. 1 QB, 2 RB, 3 WR, 1 Flex, 1 K, 1 DST) and statistical analysis of projected scoring and fantasy points. the smallest units of decision making are "what to bid for a nominated player" based on all the context available. The available context includes the consensus draft rank of each player, the remaining picks for each position (based on known number of teams, rounds, and starter/bench composition), projected seasonal fantasy points projections (from multiple sources and pre-calculated based on league scoring rules). One concept to keep in mind is the fact that VBD does not account for the fact that you can only start starters and bench players do not contribute to weekly scoring directly or unless there is a bye-week or injury. The algorithms should include variables for adjusting the values of starters vs bench players during the draft process. There is also likely a tendency to want higher consistency players for the starters and more risk for players on the bench with higher upside but maybe not very impressive average VBD. This is also known as a "sleeper pick".

level 0: model already exists as the value-based-drafting (VDB) calculation based on a simple replacement-value calculation that updates as players are drafted. in an auction draft the VBD is normalized by the remaining budgets across all team and across all positions. 

level 1: model is a basic, simple prediction that is a level-up from the value-based-drafting (VDB) method. leveraging your deep expertise it should factor in some of the probabilities that player points projections are not correct or have an uncertainty associated with them. you also research historical player scoring projections with actual projections as a model historical performance benchmark. this insight should help inform the price to pay for a nominated player during the auction in terms of the range of price to pay for that player that makes sense. 

level 2: model takes this a step further and incorporates real time context and insight on the decisions that other players are making. this incorporates the data on remaining budget, over or under paying for players, the statistical distribution of remaining players on the field (e.g. QBs 1-5 are similar within 1 std deviation, but drop off significantly at pick-6). And other cognitive bias from psychology where when the last remaining player before a dropoff is nominated it is more likely people may overpay for that player. 

level 3: Blow my mind. I probably won't understand what you come up with, but leverage the full extent of your existing expertise and also your acquired knowledge through reading all of the research papers out there on bayesian inferences and fantasy sports statistics performance and modeling. also incorporate game theory as we will have data on the decision making being made by other players so we can make and update expected decision making based on the history that is developed as the draft continues. 

tip: one resource I discovered with a focus on fantasy sports analytics is https://fantasyfootballanalytics.net/. be sure you include the content here in your research step.
```

## Feature Ideas
- concept where during bidding the tool provides context overlay on a bid range. It should include the P10 and P90 confidence intervals for player value in $auction, but also have flags for where players cannot outbid you or a projected bid by a player or list of players that are likely to need that position. 
- concept when nominating on the strategy for baiting or supply and demand manipulation based on the needs and trends of other players. basically a way to bait other players who are likely to have a bidding war or overpay to reduce the competition for other players.
- concept when nominating a player where you pick someone deep in the field during the initial draft rounds. everyone is focused on the top talent that they might not be ready to bid on a smaller player early.
- Concept of establishing a floor price that the user should bid purely to avoid significant underpayment for a player. we don't want anyone to steal a player without at least hitting the lower end as that could have upside for us or at least give them more ability to spend later in the game after locking in a cheap starter.
- Concept for alerts when the users team is converging on some strategic guardrails such as
	- too many players on the same team
	- too many players with the same bye week
	- underspending on starters
	- Etc...

## Data
### Manual Data Inputs
- Roster settings
	- QTY of starters and bench
- Scoring Settings
	- Passing
	- Rushing
	- Receiving
	- Misc
	- IDP Scoring
- League Settings
	- number of teams
	- draft type
	- (calc) number of rounds (calculated from roster settings)
	- you team name
	- auction budget
	- minimum bid
- Team Settings - data array
	- (Assumption) Teams are ordered in draft order
	- (Calc) Number of rows based on number of teams input
	- Field for each custom team name

### External Data Inputs:
- Player master data
	- Player Name (primary key)
	- Position (QB, RB, WR, TE, K, DST, DB, LB, DL)
	- NFL Team 
	- Age
	- Bye Week
	- Rookie Status (Y/N)
- Rankings data (multiple sources)
	- ESPN Rankings
	- Yahoo Rankings  
	- NFL.com Rankings
	- ECR (Expert Consensus Rankings)
	- PPR Rankings
	- 2QB/Superflex Rankings
	- Dynasty Rankings
	- Position-specific rankings
- Average Draft Position Data
	- ESPN ADP
	- Yahoo ADP
	- NFL.com ADP
	- Overall consensus ADP
	- PPR-specific ADP
- Auction Values/Pricing
	- ESPN auction values
	- Yahoo auction values
	- NFL.com auction values
	- Projected auction values
	- Average auction values
- Fantasy Points Projection
	- Total projected fantasy points
	- Position-specific projections
	- Scoring system variations (Standard, PPR, Half-PPR)
	- Weekly projections
	- Season projections
		- Passing
			- att
			- cmp
			- yds
			- tds
			- int
		- Rushing
			- att
			- yds
			- tds
		- Receiving
			- rec
			- yds
			- tds
		- Misc
			- fl
			- 1D
	- Individual Defensive Player (IDP) Projections
		- position
		- assistT
		- Fumble
		- FumbRec
		- INT
		- PassDef
		- Sack
		- Tackle
		- Tackleforloss
		- TD
- Depth Chart Data
	- Team depth chart position
	- Starter/backup designation
	- Target share projections

### **External Data Sheets:**
- **Off PrjImport**: Offensive player projections
- **IDP PrjImport**: Individual Defensive Player projections
- **AuctionImport**: Auction pricing data
- **DepthChartData**: Team depth chart information
- **Ranks**: Multi-source rankings compilation

### **Ranking Sources Referenced:**
- **ESPN Rankings & ADP**
- **Yahoo Rankings & ADP**
- **NFL.com Rankings & Pricing**
- **ECR (Expert Consensus Rankings)**
- **FantasyPros (5PPR, Dynasty, Rookie rankings)**
- **BeerSheets** (Value & scarcity calculations)

Data source settings
![[Pasted image 20250809130701.png]]

## References
### Reference 1: Instructions for using a fantasy football helper tool
https://old.reddit.com/user/CanadianSandGoggles/comments/15b9m04/csg_fantasy_football_guide_2023/

### Reference 2: 
![[CSG Fantasy Football Sheet - 2025 v13.01-auction.xlsm]]

### Reference 3: Injury data
- https://www.cbssports.com/nfl/injuries


ok i will need to develop these links. for now I want to define the data sources, types of data extracted, and target database format for each import. before we proceed I want you to generate a systematic prompt to enumerate through each imported data source. at each step validate the target source origin (e.g. ESPN data), the data fields being extracted, prompt me for an image of the requisite excel tab to confirm the data, and produce a "golden data set" representing a good import from this data source. you must confirm with me each step of the way before proceeding. do not deviate from this process until it is complete or i respond "exit".

### Reference 4: Beer Sheets
https://www.reddit.com/r/fantasyfootball/comments/1mijupv/draftsheets_fantasy_tool_v30_beersheets/?chainedPosts=t3_1mj9grk