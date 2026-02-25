# Blackjack Quest — Design Specification

## Visual Design

### Color Palette (Retro Pixel Theme — Default)
- **Background:** `#1a1a2e` (deep navy)
- **Table Felt:** `#1a6b3c` (casino green)
- **Table Border:** `#0d3d22` (dark green)
- **Primary Text:** `#f0e8d0` (warm off-white)
- **Accent/Gold:** `#ffd700` (pixel gold)
- **Win:** `#55dd55` (bright green)
- **Lose:** `#ee4444` (bright red)
- **Push:** `#ffaa00` (orange)
- **Button BG:** `#2a2a4a` (dark indigo)

### Typography
- **Primary Font:** `Press Start 2P` (Google Fonts) — pixel-art typeface
- **Sizes:** Scaled using CSS `--px` unit (base 4px) for consistent pixel-perfect rendering
- **All text is uppercase** in the retro theme

### Aesthetic Direction
- Retro 8-bit/16-bit arcade inspired
- Hard pixel shadows (`4px 4px 0px` with no blur)
- Sharp corners (`border-radius: 0`) on all elements
- `image-rendering: pixelated` for crisp scaling
- Scanline overlay on the game table (semi-transparent horizontal lines)
- Step-based CSS animations (`animation-timing-function: steps(N)`) for choppy retro motion
- Blinking cursor on message display

### Alternate Themes
1. **Classic Casino:** Georgia serif font, rounded corners, smooth gradients, wood-grain borders, realistic felt
2. **Dark Neon:** Courier monospace, neon glow effects (`text-shadow`/`box-shadow`), dark background, cyan/magenta accents, cyberpunk aesthetic

## Layout

### Desktop (> 768px)
```
┌──────────────────────────────────────────────┐
│ COUNT | SHOE     BLACKJACK     HINT|STATS|SET│  ← Top Bar
├──────────────────────────────────────────────┤
│                                              │
│          DEALER    [score]                   │
│        [card][card]                          │
│                                              │
│            "Game message"                    │  ← Game Table
│             HINT: Stand                      │
│                                              │
│        [card][card][card]                    │
│          PLAYER    [score]                   │
│                                              │
├──────────────────────────────────────────────┤
│      [HIT] [STAND] [DOUBLE] [SPLIT]         │  ← Controls
│  [5][25][100][500]  BET:$50  BANK:$950 DEAL │
└──────────────────────────────────────────────┘
```

### Mobile (< 480px)
- Title moves to top center, full width
- Stats/info collapse into compact row
- Cards scale down to `--px: 2.5`
- Betting area stacks vertically
- Action buttons wrap to fit

### Responsive Strategy
- Integer-scaled `--px` unit at discrete breakpoints (no fractional pixel blurriness)
- `>1440px`: `--px: 5px` | `769-1440px`: `--px: 4px` | `481-768px`: `--px: 3px` | `<480px`: `--px: 2.5px`
- Touch targets minimum 44x44px per accessibility standards

## Game States

### 1. BETTING
- Player can place chips ($5, $25, $100, $500) and clear bet
- DEAL button enabled only when bet >= $5
- Action buttons (Hit/Stand/Double/Split) disabled
- Message: "Place your bet to begin"

### 2. DEALING
- All controls disabled during deal animation
- Cards dealt one at a time with animation delays
- Player card 1 → Dealer card 1 (face up) → Player card 2 → Dealer card 2 (face down)
- Bet display locked

### 3. INSURANCE (conditional)
- Triggered when dealer's up card is an Ace
- "Insurance?" prompt appears with YES/NO buttons
- Insurance costs half the original bet
- If accepted, deducted from bankroll immediately

### 4. PLAYER_TURN
- Hit, Stand enabled always
- Double Down enabled only with 2 cards and sufficient bankroll
- Split enabled only with matching rank pair and sufficient bankroll
- Strategy hint displayed (if enabled)
- Auto-stand on 21
- On bust: immediate resolution or advance to next split hand

### 5. SPLIT_TURN
- Same as PLAYER_TURN but with hand tabs showing Hand 1, Hand 2, etc.
- Active hand highlighted
- Maximum 4 split hands
- Blackjack from split does not count as natural blackjack

### 6. DEALER_TURN
- Hole card revealed with flip animation
- Dealer draws per rules (hits on soft 17)
- All player controls disabled
- Cards dealt with animation delays

### 7. RESOLUTION
- Outcome message displayed with color coding (win=green, lose=red, push=orange)
- Visual effects: particle burst for wins, shake for busts/losses
- Sound effects: ascending tones for win, descending for loss
- Stats updated in localStorage
- NEW ROUND button appears
- DEAL button hidden

## Blackjack Rules

### Standard Rules
- 6-deck shoe, reshuffled when ~75% dealt
- Dealer hits on soft 17
- Blackjack pays 3:2 (1.5x the bet)
- Player can Hit, Stand, Double Down, or Split

### Edge Cases
| Scenario | Result |
|---|---|
| Player blackjack, dealer no blackjack | Player wins 1.5x bet |
| Both player and dealer blackjack | Push (bet returned) |
| Tied non-blackjack scores | Push (bet returned) |
| Player busts | Player loses (regardless of dealer) |
| Dealer busts, player didn't bust | Player wins 1:1 |
| Blackjack from split hand | Counts as 21, not natural blackjack (pays 1:1) |
| Insurance, dealer has blackjack | Insurance pays 2:1 |
| Insurance, dealer no blackjack | Insurance bet lost |
| Double down and bust | Lose doubled bet |
| Double down and win | Win doubled bet |

### Bet Rules
- Minimum bet: $5
- Maximum bet: $500
- Starting bankroll: $1,000
- Bets cannot be modified after cards are dealt
- Split requires additional bet equal to original
- Double down requires additional bet equal to original

## Testing Scenarios

### Deck Integrity
- [ ] Shoe contains exactly 312 cards (6 decks × 52)
- [ ] All 52 unique cards appear exactly 6 times
- [ ] Shuffle produces different card orders on each shuffle
- [ ] Reshuffle triggers when approximately 75% of shoe is dealt
- [ ] Card count resets on reshuffle

### Blackjack Detection
- [ ] Ace of Spades + King of Spades = blackjack
- [ ] Ace of Hearts + Queen of Diamonds = blackjack
- [ ] Ace of Clubs + Jack of Hearts = blackjack
- [ ] Ace of Diamonds + 10 of Clubs = blackjack
- [ ] All 16 Ace-Ten combinations across suits = blackjack
- [ ] Three cards totaling 21 ≠ blackjack
- [ ] Split hand with Ace + 10 ≠ natural blackjack

### Hand Scoring
- [ ] Ace + King = 21 (soft)
- [ ] Ace + 5 = 16 (soft)
- [ ] Ace + 5 + 10 = 16 (hard — ace demoted to 1)
- [ ] Ace + Ace = 12 (one ace counts as 1)
- [ ] 10 + 10 + Ace = 21 (ace as 1)
- [ ] 10 + 6 = 16 (hard)
- [ ] Ace + Ace + Ace = 13 (two aces demoted)

### Payout Accuracy
- [ ] Player blackjack pays 1.5x → $50 bet returns $125 total
- [ ] Both blackjack → $50 bet returns $50 (push)
- [ ] Normal win → $50 bet returns $100
- [ ] Normal push → $50 bet returns $50
- [ ] Player bust → $50 bet returns $0
- [ ] Double down win → $50 bet (doubled to $100) returns $200
- [ ] Insurance win → $25 insurance returns $75 (2:1 + original)
- [ ] Insurance loss → $25 insurance returns $0

### UI State Validation
- [ ] DEAL button disabled when bet = $0
- [ ] DEAL button enabled when bet >= $5
- [ ] Hit/Stand/Double/Split disabled during BETTING phase
- [ ] Hit/Stand enabled during PLAYER_TURN
- [ ] Double disabled when player has > 2 cards
- [ ] Split disabled when cards don't match
- [ ] Chip buttons disabled after deal
- [ ] Bet amount cannot be changed after deal
- [ ] NEW ROUND button appears only in RESOLUTION phase
- [ ] Insurance prompt appears only when dealer shows Ace

### Keyboard Shortcuts
- [ ] H triggers Hit during player turn
- [ ] S triggers Stand during player turn
- [ ] D triggers Double during player turn
- [ ] P triggers Split during player turn
- [ ] N triggers Deal during betting / New Round during resolution
- [ ] I triggers Insurance during insurance phase
- [ ] Escape closes modals
- [ ] Keys ignored when typing in input fields

### Statistics Persistence
- [ ] Stats persist across page reloads (localStorage)
- [ ] Win/loss/push counts are accurate
- [ ] Streak tracking works correctly
- [ ] Biggest win tracks correctly
- [ ] Reset stats clears all data
- [ ] Betting history shows last 50 rounds

### Card Counting
- [ ] Cards 2-6 increment count by +1
- [ ] Cards 7-9 do not change count
- [ ] Cards 10-A decrement count by -1
- [ ] Count resets on shoe reshuffle
- [ ] Count display toggles with setting

### Strategy Hints
- [ ] Hints match basic strategy chart for hard hands
- [ ] Hints match basic strategy chart for soft hands
- [ ] Hints correctly recommend splits for pairs
- [ ] Hints update when hand changes
- [ ] Hint display toggles with setting/button

## Architecture

### JavaScript Modules (16 files)
- `config.js` — Constants, enums, settings
- `gameState.js` — Central state store (pub/sub pattern)
- `deck.js` — Card class, Shoe class (6-deck, Fisher-Yates shuffle)
- `hand.js` — Hand scoring (soft/hard ace logic)
- `dealer.js` — Dealer AI (hit soft 17)
- `player.js` — Player actions (hit, stand, double, split, insurance)
- `betting.js` — Bet management, payout calculation
- `ui.js` — All DOM rendering (sole DOM writer)
- `animations.js` — Card deal/flip, particles, effects
- `sound.js` — Web Audio API synthesized sounds
- `stats.js` — Statistics + localStorage persistence
- `strategy.js` — Basic strategy lookup table
- `cardCount.js` — Hi-Lo card counting
- `input.js` — Click handlers + keyboard shortcuts
- `themes.js` — Theme switching
- `main.js` — Entry point + round lifecycle orchestrator

### Data Flow
Input → Action modules → State store → Rendering modules → DOM

### No External Dependencies
- Pure vanilla HTML/CSS/JS
- ES Modules via `<script type="module">`
- Google Fonts for typography
- No npm, no build tools, no frameworks
