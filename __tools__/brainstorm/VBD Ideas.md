Love this topic. You’re describing classic VBD correctly, and also why it can feel “flat” once you care about drop-offs and distribution. Here’s a clean way to level it up for auctions without overfitting.

# 1) Baselines you need

- **Replacement rank per position**:  
    rp=⌈teams×startersp⌉r_p = \lceil \text{teams} \times \text{starters}_p \rceil (adjust for flex and how your league actually drafts).  
    Replacement points: Rp=ProjPtsp,rpR_p = \text{ProjPts}_{p,r_p}.
    
- **Classic VBD**:  
    VBDi=ProjPtsi−Rp\text{VBD}_i = \text{ProjPts}_i - R_p for player ii at position pp.
    

# 2) Where plain VBD falls short

- It ignores the **shape** of the position curve. Five QBs clustered together above a cliff look very different from a smooth slope, even if VBD to replacement is the same.
    
- It does not express **how risky** a lead is. A 40-point edge in a high-variance position is “worth” less than 40 points at a low-variance position.
    

# 3) Add distribution awareness (three proven options)

## A) zVBD: normalize by positional spread

Let σp\sigma_p be the standard deviation of season projections among the **draftable pool** at position pp (or among starters only if you prefer).

- **z-score**: zi=ProjPtsi−μpσpz_i = \frac{\text{ProjPts}_i - \mu_p}{\sigma_p}
    
- **zVBD**: zVBDi=ProjPtsi−Rpσp\text{zVBD}_i = \frac{\text{ProjPts}_i - R_p}{\sigma_p}
    

This keeps VBD’s intuition but scales it by how “hard” those points are to get in that position.

**Variant**: use the **tail sigma**, not full-position sigma:  
σp,tail=SD(ProjPtsp,rp…rp+k)\sigma_{p,\text{tail}} = \text{SD}(\text{ProjPts}_{p, r_p \ldots r_p+k}).  
Then zVBDi=ProjPtsi−Rpσp,tail\text{zVBD}_i = \frac{\text{ProjPts}_i - R_p}{\sigma_{p,\text{tail}}}.  
This specifically answers “how far above a streamer is he, in streamer-sized units?”

## B) Quantile VBD (QVBD)

Convert projections to percentiles within the position.  
qi=percentile(ProjPtsi∣p)q_i = \text{percentile}(\text{ProjPts}_i \mid p).  
Score: QVBDi=(ProjPtsi−Rp)⋅f(qi)\text{QVBD}_i = (\text{ProjPts}_i - R_p)\cdot f(q_i), where ff upweights scarcity at the top. A simple choice: f(q)=1+λ⋅max⁡(0,q−0.8)f(q)=1 + \lambda \cdot \max(0, q-0.8). This magnifies tiers near the top without changing rank order too much.

## C) Wins-aware VBD (WAVBD)

Estimate **points to wins** for your league from historical weekly scoring: fit a logistic between point differential and win probability, get a slope β\beta near 0.  
Then map season points to **expected wins added**:  
WAVBDi≈β⋅VBDi⋅weeks\text{WAVBD}_i \approx \beta \cdot \text{VBD}_i \cdot \sqrt{\text{weeks}}.  
This lets you weight positions by how weekly variance translates into wins. It is more work but most principled.

# 4) Tiering the right way (to capture the drop-offs)

You want tiers that your model can use during the draft, not just a pretty list.

Practical tier algorithm:

1. Sort by projection within position.
    
2. Compute adjacent gaps gj=ProjPtsj−ProjPtsj+1g_j = \text{ProjPts}_{j} - \text{ProjPts}_{j+1}.
    
3. Define a **tier-break threshold** tied to spread. A robust default:  
    τp=0.33⋅σp\tau_p = 0.33 \cdot \sigma_p (or use the median gap + one MAD of gaps).
    
4. Start a new tier whenever gj≥τpg_j \ge \tau_p.
    

Useful derived numbers:

- **Drop-off next** for player ii: gap to the next rank or to the next tier floor.
    
- **Excess-within-tier**: EVBDi=VBDi−min⁡(VBD in current tier)\text{EVBD}_i = \text{VBD}_i - \min(\text{VBD in current tier}). This separates “best in tier” from “tier average.”
    

# 5) A single combined score for auctions

Keep it linear and interpretable:

Scorei=w1⋅VBDiσp,tail+w2⋅zi+w3⋅TierBonusi−w4⋅Riski\text{Score}_i = w_1 \cdot \frac{\text{VBD}_i}{\sigma_{p,\text{tail}}} + w_2 \cdot z_i + w_3 \cdot \text{TierBonus}_i - w_4 \cdot \text{Risk}_i

- Use w1≈0.6w_1 \approx 0.6, w2≈0.2w_2 \approx 0.2, w3≈0.2w_3 \approx 0.2 to start.
    
- **TierBonus** can be 1 for the top tier, 0.5 for tier 2, etc., or proportional to distance above the next tier.
    
- **Risk** can be projection variance, injury flags, or an age/role stability penalty.
    

# 6) Map score to **auction dollars**

Let:

- Total dollars to be spent above minimum bids:  
    D=teams⋅budget−minBid⋅total roster spotsD = \text{teams}\cdot\text{budget} - \text{minBid}\cdot \text{total roster spots}.
    
- Let S+=∑max⁡(0,Scorei)S^+ = \sum \max(0,\text{Score}_i) over all players you expect to be bought.
    

Set a scale factor α=D/S+\alpha = D / S^+ and price:

Pricei=minBid+α⋅max⁡(0,Scorei)\text{Price}_i = \text{minBid} + \alpha \cdot \max(0,\text{Score}_i)

This is the **sum-to-budget** method. If you want fatter top-end prices (more realistic), apply a gentle power before scaling:

Score^i=(max⁡(0,Scorei))γwith γ∈[1.1,1.3]\widehat{\text{Score}}_i = (\max(0,\text{Score}_i))^\gamma \quad \text{with } \gamma \in [1.1,1.3]

then recompute α\alpha using the transformed scores.

# 7) Live draft adjustments that matter

- **Replacement ranks move** as the room buys players. Recompute RpR_p and all downstream values every pick.
    
- **Dollar scale**: rescale α\alpha by the ratio of remaining dollars to remaining positive score mass. This keeps your targets in line with the table’s spend pace.
    
- **Opportunity cost view**: at any moment, compare your top option at position A vs the best fallback at A if you pass now, and the best option at B. Use **VONB** (value over next best) to decide nominations and chase thresholds.
    

# 8) The visual that helps in-room

Two panes per position, updating in real time:

1. **VBD ladder**: VBD vs rank, shaded by tier. Annotate the next big drop-off.
    
2. **Remaining value bar**: sum of positive VBD above replacement still on the board for that position, plus “you are X points from the cliff” for your current target.
    

Optional global: a **heatmap** with positions on rows and “players remaining until cliff” on columns. It makes “wait or buy now” decisions obvious.

# 9) Keep it simple, but layered

- Use **plain VBD** as the baseline.
    
- Layer **zVBD** or tail-normalized VBD to express scarcity.
    
- Enforce **tiers** from gap statistics, not vibes.
    
- Convert to **dollars** with sum-to-budget scaling and a light top-end curve.
    
- Update all of it live as the room spends.
    

If you want, share a small CSV of projections for one position and I can spin up a quick tiered VBD chart and a price curve to show how this behaves.