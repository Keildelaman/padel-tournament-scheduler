# Player Registry — Design Document

> Brainstormed 2026-02-24. No code yet — this captures the vision and decisions.

---

## 1. Vision

A persistent **player registry** (contacts database) that lives across tournaments. Players are
registered once, then selected when setting up new tournaments. After each tournament, raw match
results are automatically linked back to the registry, building up a rich history over time.

Long-term this enables Elo ratings, skill-based matchmaking, historical leaderboards, and more —
but the foundation is simply: **store raw data now, compute cool things later.**

---

## 2. Core Concepts

### Registry
- A self-contained database of players and their match history.
- **Only one registry is "active" at a time** — it is the single source of truth.
- Multiple registries can be saved locally (like profiles/databases).
- Registries are fully **exportable/importable** as JSON files.
- **No merging between registries.** Each registry is an independent world.
- Use cases for multiple registries: different friend groups, different clubs, different devices.

### Registered Player
- A player who exists in the active registry.
- Has a **stable identity** (ID) that persists across tournaments.
- Tracks raw match history from all tournaments played under this registry.

### Match Record
- A single match result for a player: who they partnered with, who they played against, score, result.
- Stored as raw data. All stats (win rate, Elo, streaks, etc.) are **computed on the fly** from these records.

### Tournament Inclusion
- By default, tournament results are **automatically saved** to the registry when a tournament ends.
- A toggle allows marking a tournament as **"Fun / Test — do not record"** to exclude results.
- This toggle should be prominent at tournament completion (and possibly toggleable retroactively?).

---

## 3. Data Model (Conceptual)

```
Registry
├── id: string (UUID)
├── name: string (e.g. "Tuesday Night Crew", "Beach Club")
├── createdAt: ISO date
├── updatedAt: ISO date
├── players: RegisteredPlayer[]
└── tournamentHistory: TournamentRecord[]

RegisteredPlayer
├── id: string (stable UUID, never changes)
├── name: string (editable)
├── createdAt: ISO date
├── updatedAt: ISO date
├── archived: boolean (soft delete — hidden but restorable)
└── (match history is derived from TournamentRecord data, not stored here)

TournamentRecord
├── id: string (matches the Tournament's ID)
├── date: ISO date
├── config: { courts, rounds, scoringMode, etc. } (snapshot of settings)
├── playerIds: string[] (who participated)
├── excluded: boolean (fun/test game flag)
└── matches: MatchRecord[]

MatchRecord
├── round: number
├── court: number
├── team1: { playerIds: [string, string], score: number }
├── team2: { playerIds: [string, string], score: number }
└── (winner is derived from scores)
```

### Derived Stats (Computed on the fly, never stored)

Per player, from their match records:
| Category        | Examples                                                     |
| --------------- | ------------------------------------------------------------ |
| **Participation** | Tournaments played, total matches, total rounds, last active |
| **Results**       | Wins, losses, win rate, points scored, points against        |
| **Partnerships**  | Who they've partnered with, win rate per partner             |
| **Opponents**     | Who they've faced, record vs each opponent                   |
| **Streaks**       | Current win streak, best streak, recent form                 |
| **Timeline**      | Performance over time, per-tournament breakdown              |

---

## 4. Registry Management

### Naming: "Player Groups" (not "Registries")
The term "registry" is technical. For the UI, use **"Player Groups"** — more intuitive for the
concept of "a group of people you play with." (Internal code can still use `registry` if clearer.)
This is like a **game save slot** — you pick which group to play with.

### Dedicated Top-Level Page: "Player Groups"
- View all saved player groups (name, player count, tournament count, last updated).
- **Switch** active group — **blocked if a tournament is in progress** (must complete or cancel first).
- **Create** new empty group (with a name). **Maximum 3 groups** in localStorage.
- **Delete** a group (with confirmation).
- **Export** a group as a `.json` file (download).
- **Import** a group from a `.json` file (adds as new group, does NOT merge). Blocked if already at 3.
- **Rename** a group.

### First Visit / No Group Exists
- **Auto-create** a default group silently (e.g., "My Players").
- User can rename it later from the Player Groups page.

### Storage
- Each group is stored as a separate key in localStorage (e.g., `padel-group-{id}`).
- A small index/metadata entry tracks which groups exist and which is active.
- **Maximum 3 groups** to stay within localStorage limits (~5-10MB).
- Show a warning if a group is getting very large.

---

## 5. Setup Flow Integration

### Player Selection (Autocomplete)
When adding players to a new tournament:
1. Click on / focus a player name input field.
2. **Dropdown opens** showing all registered (non-archived) players from the active registry.
3. As the user types, the dropdown **filters** to matching names (case-insensitive, substring match).
4. **Selecting** a player from the dropdown fills the input with their name and links to their registry ID.
5. If the typed name **does not match** any registered player:
   - Show a hint below/next to the input: *"New player — will be registered as [Name]"*
   - On tournament start, this player is automatically added to the active registry.
6. Already-selected players are **grayed out or hidden** in the dropdown (can't add someone twice).

### Edge Cases
- **No active group:** Auto-created silently on first visit as "My Players".
- **Empty group:** All names are new, all get registered on tournament start. Works seamlessly.
- **Archived players:** Not shown in dropdown by default. A toggle to include archived players
  in the dropdown is available (they can then be selected, which implicitly unarchives them).
- **Name uniqueness:** Enforced within a group. Cannot register two players with the same name.
  The autocomplete should make duplicates nearly impossible since existing names are always shown.

---

## 6. Tournament Result Recording

### Automatic Flow
1. Tournament is played normally (no changes to current match/scoring flow).
2. When the tournament reaches completion (all rounds scored):
   - Results are **automatically saved** to the active registry as a `TournamentRecord`.
   - New players (those entered by name, not selected from registry) are added to the registry.
3. A prominent toggle at the tournament summary/completion screen:
   **"Save to Registry"** (on by default) — with text like:
   *"Turn off for fun/test games that shouldn't count toward player stats."*

### What Gets Recorded
- Full match-level data: every round, every court, every pairing, every score.
- Tournament config snapshot (so we know context: how many courts, scoring mode, etc.).
- Date of the tournament.

### Retroactive Toggle
- **Yes** — past tournaments can be toggled to excluded/included after the fact.
- Accessible from the player group management page or tournament history view.

---

## 7. Players Page (Top-Level)

### Overview: Simple List/Table
A new top-level page accessible from the main navigation: **"Players"**

| Column             | Description                    |
| ------------------ | ------------------------------ |
| **Name**           | Player name (clickable → detail) |
| **Tournaments**    | Number of tournaments played   |
| **Matches**        | Total matches played           |
| **Win Rate**       | Wins / total matches as %      |
| **Last Active**    | Date of last tournament        |

- **Search/filter** bar at the top.
- **Sort** by any column.
- Toggle to **show archived players** (hidden by default).
- Archived players can be **unarchived** or **permanently deleted** (with confirmation warning).
- Quick-action to archive a player from the list.

### Actions
- **Click a player row** → navigates to their detail page.
- **Add player manually** (without needing a tournament) — useful for pre-registering people.
- **Archive player** — soft-removes them (hidden from setup dropdown and players list, but data preserved).
- **Edit name** — inline or via detail page.

---

## 8. Player Detail Page

Accessed by clicking a player in the Players list. Shows comprehensive stats and history.

### Sections

**Header**
- Player name (editable inline?)
- Member since (createdAt)
- Quick stats: Total tournaments, total matches, overall win rate

**Performance Summary**
- Win/Loss record (total and %)
- Points scored / against (total and average per match)
- Best tournament finish, worst tournament finish
- Current form (last N matches trend)

**Partnership Stats**
- Table of partners: name, matches together, win rate together
- "Best partner" / "Most frequent partner" highlights

**Opponent Stats**
- Table of opponents: name, matches against, win rate against
- Head-to-head records

**Tournament History**
- Chronological list of tournaments played
- Per tournament: date, placement/rank, W-L record, points

**Match Log**
- Full detailed list of every match (expandable/collapsible)
- Round, court, partner, opponents, score, result

---

## 9. Navigation & Page Structure

Current pages: **Setup** | **Round** | **Leaderboard** | **Simulator**

New pages to add:
- **Players** — Player list with stats (Section 7)
- **Player Detail** — Individual player stats (Section 8) (sub-page of Players)
- **Player Groups** — Group management, import/export (Section 4) — **top-level nav tab**

Updated nav: **Setup** | **Round** | **Leaderboard** | **Players** | **Player Groups** | **Simulator**

> Note: "Round" and "Leaderboard" are only visible during an active tournament, so the nav
> won't feel overcrowded in the default state.

---

## 10. Import/Export Format

### Registry Export (JSON)
```json
{
  "version": 1,
  "exportedAt": "2026-02-24T...",
  "registry": {
    "id": "...",
    "name": "Tuesday Night Crew",
    "createdAt": "...",
    "players": [ ... ],
    "tournamentHistory": [ ... ]
  }
}
```
- Include a `version` field for future format changes.
- The file should be **self-contained** — everything needed to reconstruct the registry.
- On import, the registry gets a **new ID** to avoid collisions with existing registries.

---

## 11. Future Ideas (Out of Scope for Now)

These are enabled by the raw data foundation but should NOT be built yet:

- **Elo Rating System** — Individual Elo, updated after each tournament. Doubles Elo is tricky
  (many approaches: average team Elo, individual adjustment based on expected vs actual outcome).
- **Skill-Based Matchmaking** — Use Elo/stats to balance teams or create competitive brackets.
- **Seasonal Stats** — View stats for a date range (e.g., "last 3 months").
- **Achievements/Badges** — Fun unlockables ("10-win streak", "played 50 matches", etc.).
- **Group Leaderboards** — All-time leaderboard across all tournaments in a registry.
- **Player Comparison** — Side-by-side stat comparison between two players.
- **Charts & Visualizations** — Win rate over time, Elo progression graph.

---

## 12. Resolved Questions

All open questions have been answered:

- [x] **Retroactive exclusion:** Yes — past tournaments can be toggled excluded/included.
- [x] **Group page location:** Top-level nav tab ("Player Groups").
- [x] **Archived player visibility in setup:** Toggle available to show them in dropdown.
- [x] **Storage limits:** Max 3 player groups in localStorage. Warning if a group gets very large.
- [x] **Tournament in progress + group switch:** Blocked entirely. Must complete or cancel first.
- [x] **What if no group exists on first visit?** Auto-create "My Players" silently.
- [x] **Player name uniqueness:** Yes, enforced within a group.
- [x] **UI terminology:** "Player Groups" instead of "Registries" (more intuitive, like game save slots).

---

## 13. Summary of Key Decisions Made

| Decision                  | Choice                                                              |
| ------------------------- | ------------------------------------------------------------------- |
| Data storage approach     | Store raw match history, compute all stats on the fly               |
| Group model               | One active group at a time, max 3 saved, no merging                 |
| UI terminology            | "Player Groups" (not "registries") — like game save slots           |
| Import/Export             | Full group as JSON file, import creates new independent group       |
| Result recording          | Automatic by default, toggle to exclude fun/test games              |
| Retroactive exclusion     | Yes — past tournaments can be toggled after the fact                |
| Player identity in setup  | Autocomplete dropdown from group, new names auto-register           |
| Player name uniqueness    | Enforced within a group                                             |
| Player deletion           | Soft delete (archive), with option to permanently delete (+ warning)|
| Archived in setup         | Toggle to show archived players in dropdown                         |
| Players page style        | Simple list/table with sortable columns                             |
| Group page location       | Top-level nav tab                                                   |
| First visit               | Auto-create "My Players" group silently                             |
| Tournament + group switch | Blocked — must complete or cancel tournament first                  |
| Storage limit             | Max 3 groups, warning if a group gets large                         |
| Elo / matchmaking         | Future feature — raw data foundation enables it later               |
| Individual vs team Elo    | Individual (when implemented)                                       |
| Elo scope                 | Global within a group                                               |
| Privacy                   | Not a concern — personal tool for friends                           |
