"""Short demo rulebooks (own wording) for the seeded games, used to try the rules assistant.

Each manual is a list of pages. In a page, "## " starts a heading, "- " a bullet, a blank line a new paragraph.
Text must stay Latin-1 (the PDF helper uses the standard Helvetica font). The titles match games.title.
"""

MANUALS = [
    {
        "title": "Pandemic",
        "slug": "pandemic",
        "pages": [
            """
## Overview
Pandemic is a cooperative game. The players are a team of disease-control specialists. Four
diseases (blue, yellow, black and red) spread across 48 cities. The team wins together by
discovering the cure for all four diseases, or loses together.

## Setup
Place a research station in Atlanta and all pawns in Atlanta. Draw 3 infection cards and put
3 cubes on each city, then 3 cards with 2 cubes, then 3 cards with 1 cube. Cubes always match
the color of the city.
Deal player cards: 4 cards each with 2 players, 3 cards each with 3 players, 2 cards each with
4 players. Then shuffle 4 (introductory), 5 (standard) or 6 (heroic) Epidemic cards evenly into
the player deck.

## Your turn
On your turn you do three steps in this order:
1. Take 4 actions.
2. Draw 2 player cards.
3. Infect cities: draw as many infection cards as the current infection rate.

## Actions
- Drive / Ferry: move to a city connected by a line.
- Direct Flight: discard a city card to move to that city.
- Charter Flight: discard the card of the city you are in to move to any city.
- Shuttle Flight: move from a research station to another research station.
- Build a Research Station: discard the card of the city you are in.
- Treat Disease: remove 1 cube from your city. If that disease is cured, remove all its cubes.
- Share Knowledge: give or take the card of the city where both players stand.
- Discover a Cure: at a research station, discard 5 city cards of the same color.
You may do the same action several times. Unused actions are lost.
""",
            """
## Epidemics
When you draw an Epidemic card: increase the infection rate by one step, draw the bottom card of
the infection deck and put 3 cubes on that city, then shuffle the infection discard pile and put
it on top of the infection deck.

## Outbreaks
If a city would get a 4th cube of one color, there is an outbreak instead: put 1 cube of that
color on every connected city and move the outbreak marker. Outbreaks can chain, but each city
has at most one outbreak per chain.

## Hand limit
Each player may hold at most 7 cards. Discard or play event cards immediately if you have more.
Event cards can be played at any time and do not cost an action.

## Eradication
A disease is eradicated when it is cured and no cube of that color is left on the board. Cities
of that color are no longer infected.

## Roles
- Medic: removes all cubes of one color when treating; cured diseases vanish where the Medic is.
- Scientist: needs only 4 cards of the same color to discover a cure.
- Researcher: may give any city card when sharing knowledge.
- Operations Expert: builds a research station without discarding a card.
- Dispatcher: may move other players' pawns.
- Quarantine Specialist: prevents cube placement in its city and the connected cities.

## Winning and losing
The team wins immediately when all 4 cures are discovered. The team loses if there are 8
outbreaks, if a disease runs out of cubes, or if the player deck runs out when a player must draw.
""",
        ],
    },
    {
        "title": "Dixit",
        "slug": "dixit",
        "pages": [
            """
## Overview
Dixit is a storytelling game with 84 illustrated cards. One player is the storyteller each round.
The goal is to give clues that are neither too obvious nor too obscure.

## Setup
Each player takes a voting set and a rabbit on the score track. Deal 6 cards to each player.
With 3 players, deal 7 cards each.

## A round
1. The storyteller secretly picks a card from their hand and says a clue: a word, a sentence,
   a sound or a song. They place the card face down.
2. Every other player picks the card from their hand that best fits the clue and gives it to the
   storyteller face down. With 3 players, each other player gives 2 cards.
3. The storyteller shuffles the cards and lays them face up in a row.
4. The other players secretly vote for the card they think belongs to the storyteller.
   You may not vote for your own card. The storyteller does not vote.
""",
            """
## Scoring
- If all players, or no player, found the storyteller's card: the storyteller scores 0 and every
  other player scores 2 points.
- Otherwise: the storyteller and each player who found the card score 3 points.
- Every player except the storyteller scores 1 point for each vote their own card received.

## End of the round
Everyone draws back up to 6 cards. The next player clockwise becomes the storyteller.

## End of the game
The game ends when the draw pile is empty, or when a player reaches 30 points. The player with
the most points wins.

## Tip
A good clue is found by some players, not by all of them. Vague clues let other players bluff
with their own cards and earn bonus points.
""",
        ],
    },
    {
        "title": "Codenames",
        "slug": "codenames",
        "pages": [
            """
## Overview
Two teams, red and blue, compete to find their secret agents first. Each team has a spymaster
who knows which words belong to which team and gives one-word clues.

## Setup
Lay out 25 word cards in a 5 x 5 grid. The spymasters sit on the same side and draw a key card
that shows the secret identity of each word: 9 agents for the starting team, 8 for the other
team, 7 innocent bystanders and 1 assassin. The light on the key card shows which team starts.

## Giving a clue
The spymaster says one word and one number, for example "Fruit: 3". The word is a hint about the
meaning of the agents; the number says how many agents are related to it.
- The clue must be about meaning, not about letters or position on the table.
- You may not say a word that is visible on the table, or part of one.
- Spymasters keep a straight face and do not gesture.
""",
            """
## Guessing
The team discusses and touches one card. The spymaster covers it with the matching card:
- Own agent: the team may guess again.
- Bystander: the turn ends.
- Other team's agent: the turn ends and that agent counts for the other team.
- Assassin: the team loses the game immediately.

The team may make as many guesses as the number in the clue plus one extra guess. A team may
always stop guessing after its first correct guess.

## Clue of zero
A spymaster may say "zero" or "unlimited" as the number. With zero, the team may guess as many
times as it wants and the clue tells them which words to avoid.

## Winning
The first team to cover all of its agents wins. A team also wins if the other team touches the
assassin.
""",
        ],
    },
    {
        "title": "Ticket to Ride",
        "slug": "ticket-to-ride",
        "pages": [
            """
## Overview
Players build train routes across a map of North America. You score points for claimed routes,
for completed destination tickets and for the longest continuous railway.

## Components
45 trains per player, 110 train cards (12 of each of 8 colors plus 14 locomotives) and
destination tickets.

## Setup
Each player gets 4 train cards. Turn 5 train cards face up next to the deck. Each player draws
3 destination tickets and must keep at least 2.

## Your turn
On your turn you do exactly one of these three actions:
1. Draw train cards: take 2 cards, face up or from the deck. If you take a face-up locomotive,
   it is your only card for the turn. You may not take a face-up locomotive as your second card.
2. Claim a route: play as many cards of the route's color as the route has spaces, then put
   your trains on it. Gray routes can be claimed with cards of any single color. Locomotives
   are wild and replace any color.
3. Draw destination tickets: draw 3 tickets and keep at least 1.

If three locomotives are face up at the same time, discard all five cards and turn up five new.
""",
            """
## Double routes
Some cities are linked by two parallel routes. One player may not claim both. In games with
2 or 3 players only one of the two routes can be used.

## Route scoring
Route length 1: 1 point. 2: 2 points. 3: 4 points. 4: 7 points. 5: 10 points. 6: 15 points.
Points are scored immediately when the route is claimed.

## End of the game
When a player has 2 or fewer trains left at the end of their turn, every player, including that
player, gets one final turn.

## Final scoring
- Each completed destination ticket adds its value; each incomplete ticket subtracts its value.
- The player with the longest continuous path of trains gets a 10-point bonus.
The player with the most points wins. On a tie, the player with the most completed tickets wins.
""",
        ],
    },
    {
        "title": "Carcassonne",
        "slug": "carcassonne",
        "pages": [
            """
## Overview
Players build a medieval landscape tile by tile and place followers (meeples) on roads, cities,
monasteries and fields to score points.

## Setup
Put the start tile in the middle and shuffle the remaining 71 tiles face down. Each player takes
8 followers of one color and puts one on the score track, keeping 7 in supply.

## Your turn
1. Draw a tile and place it touching at least one tile already in play. All touching edges must
   match: roads to roads, cities to cities, fields to fields. If a tile cannot be placed anywhere,
   discard it and draw another.
2. You may place one follower from your supply on the tile you just placed: on a road (thief),
   in a city (knight), on a monastery (monk) or on a field (farmer). You may not place a follower
   on a feature that already has a follower, even far away.
3. Score every feature completed by your tile. Followers on scored features go back to their
   owners.
""",
            """
## Scoring during the game
- Completed road: 1 point per tile.
- Completed city: 2 points per tile and 2 points per pennant (shield).
- Completed monastery (surrounded by 8 tiles): 9 points.
If several players have followers on the same completed feature, the player with the most
followers scores all the points. On a tie, all tied players score the full points.

## End of the game
The game ends after the last tile is placed. Then incomplete features score:
- Incomplete road: 1 point per tile.
- Incomplete city: 1 point per tile and 1 point per pennant.
- Incomplete monastery: 1 point plus 1 point per tile around it.
- Fields: each farmer field scores 3 points for each completed city it touches.
The player with the most points wins.
""",
        ],
    },
    {
        "title": "Azul",
        "slug": "azul",
        "pages": [
            """
## Overview
Players draft colored tiles and use them to decorate the wall of a palace. Points come from
placing tiles next to each other and from completing rows, columns and colors.

## Setup
Use 5 factory displays with 2 players, 7 with 3 players and 9 with 4 players. Fill each display
with 4 random tiles from the bag. The first player marker goes in the center of the table.

## Phase 1: factory offer
On your turn, either:
- take all tiles of one color from one factory display and push the rest to the center, or
- take all tiles of one color from the center. The first player to take from the center also
  takes the first player marker and puts it on their floor line.
Then place the tiles on one of your 5 pattern lines (they hold 1 to 5 tiles). A pattern line may
hold only one color, and not a color already placed in the matching row of your wall. Tiles that
do not fit go to your floor line.
The phase ends when all displays and the center are empty.
""",
            """
## Phase 2: wall tiling
For each complete pattern line, move one tile to the matching color space of the same wall row
and score it immediately; the other tiles of that line go to the box lid.
- A tile with no neighbours scores 1 point.
- Otherwise count the tiles connected horizontally (including itself) and the tiles connected
  vertically (including itself) and add both numbers.
Incomplete pattern lines stay for the next round.

## Floor line
Each tile on the floor line loses points: -1, -1, -2, -2, -2, -3, -3. Your score can not drop
below 0. The player with the first player marker starts the next round.

## End of the game
The game ends after the round in which at least one player completes a horizontal row of 5 tiles.
End bonuses: 2 points per complete row, 7 points per complete column and 10 points for each color
that has all 5 tiles on the wall. The most points wins; on a tie, the most complete rows wins.
""",
        ],
    },
    {
        "title": "Splendor",
        "slug": "splendor",
        "pages": [
            """
## Overview
Players are gem merchants. They collect gem tokens to buy development cards that give permanent
gem bonuses and prestige points, and they attract nobles.

## Setup
Use all 7 tokens of each gem with 4 players, 5 with 3 players and 4 with 2 players. Always use the
5 gold tokens. Reveal 4 cards of each of the 3 levels and one more noble than players.

## Your turn
Do exactly one action:
- Take 3 gem tokens of different colors.
- Take 2 gem tokens of the same color. This is allowed only if that pile has at least 4 tokens.
- Reserve a development card (face up or the top card of a deck) and take 1 gold token (joker).
  You may never have more than 3 reserved cards.
- Buy a face-up development card or one of your reserved cards.
""",
            """
## Buying cards
Pay the cost with tokens. Each card you own gives a permanent bonus of its color and reduces the
cost of future cards by 1 gem of that color. Gold tokens replace any color. A card with enough
bonuses can be bought for free. Replace a bought face-up card from the same level.

## Token limit
At the end of your turn you may hold at most 10 tokens (gold included). Return extras of your
choice.

## Nobles
At the end of your turn, if your card bonuses meet a noble's requirement, that noble visits you
automatically. Each noble is worth 3 prestige points. Only one noble can visit per turn.

## End of the game
When a player reaches 15 prestige points, finish the current round so everyone had the same number
of turns. The player with the most prestige points wins. On a tie, the player with fewer
development cards wins.
""",
        ],
    },
    {
        "title": "Terraforming Mars",
        "slug": "terraforming-mars",
        "pages": [
            """
## Overview
Players lead corporations that make Mars habitable. Three global parameters must be raised:
temperature (from -30 to +8 degrees), oxygen (from 0 to 14 percent) and oceans (9 ocean tiles).
Each step you raise increases your Terraform Rating (TR) by 1. TR is both income and points.

## A generation
1. Player order: the first player marker passes left.
2. Research: each player looks at 4 cards and buys any of them for 3 MegaCredits (MC) each.
3. Action phase: in turn order, each player takes 1 or 2 actions, then the next player. A player
   who passes is out until the next generation.
4. Production: energy turns into heat, then every player gains resources from their production.
   MC income equals TR plus MC production.

## Actions
- Play a card from your hand (pay its cost and meet its requirements).
- Use a standard project.
- Claim a milestone (8 MC; at most 3 milestones are claimed per game).
- Fund an award (8, 14 and then 20 MC; at most 3 awards).
- Use the action of a blue card (once per generation).
- Convert 8 plants into a greenery tile (raises oxygen).
- Convert 8 heat to raise the temperature by one step.
""",
            """
## Standard projects
- Sell patents: discard cards for 1 MC each.
- Power plant: 11 MC for +1 energy production.
- Asteroid: 14 MC to raise the temperature.
- Aquifer: 18 MC to place an ocean tile.
- Greenery: 23 MC to place a greenery tile.
- City: 25 MC to place a city and gain +1 MC production.

## Tile placement
Placing a tile next to an ocean gives 2 MC per adjacent ocean. Greenery must be placed next to one
of your tiles when possible. Cities may not be placed next to another city.

## End of the game
The game ends after the generation in which all three parameters reach their maximum. Players may
then convert plants into greenery one last time.

## Final scoring
TR + awards (5 points first, 2 points second) + milestones (5 points each) + 1 point per greenery
tile + 1 point per greenery next to each of your cities + victory points on cards.
""",
        ],
    },
    {
        "title": "7 Wonders",
        "slug": "7-wonders",
        "pages": [
            """
## Overview
Players lead ancient cities over three ages. They build structures, develop their wonder and
fight their two neighbours. Everyone plays at the same time.

## Setup
Each player takes a wonder board and 3 coins. Each age uses a deck of cards prepared for the
number of players; each player is dealt 7 cards.

## A turn
Everyone chooses one card from their hand at the same time and then:
- builds the structure (pays its cost in resources or coins), or
- builds the next stage of their wonder, tucking the card under the board, or
- discards the card to gain 3 coins.
Then pass the remaining cards to a neighbour: to the left in Ages I and III, to the right in
Age II. After 6 turns, the 7th card of each hand is discarded.

## Resources and trading
Resources come from brown and gray cards and from the wonder board. You may buy a missing resource
from a neighbour for 2 coins; some yellow cards reduce this price. Some buildings are free if you
already own the building they chain from.
""",
            """
## Military conflict
At the end of each age, compare your shields with each neighbour. The player with more shields
gains a victory token: 1 point in Age I, 3 points in Age II, 5 points in Age III. The player with
fewer shields takes a -1 defeat token. A tie gives nothing.

## Final scoring
- Military tokens.
- Treasury: 1 point for every 3 coins.
- Wonder stages.
- Civilian structures (blue cards).
- Scientific structures (green cards): each group of identical symbols scores the number of
  symbols squared, and each set of three different symbols scores 7 extra points.
- Commercial structures (yellow) and guilds (purple) as printed.
The player with the most points wins. On a tie, the richest player wins.
""",
        ],
    },
    {
        "title": "The Crew",
        "slug": "the-crew",
        "pages": [
            """
## Overview
The Crew is a cooperative trick-taking game played as a campaign of missions. The crew wins or
loses each mission together. Talking about the cards in your hand is not allowed.

## Cards
40 cards in 4 colors (1 to 9) and 4 rocket cards (1 to 4). Rockets are trumps.

## Setup of a mission
Deal all cards. The player holding the rocket 4 is the commander. The logbook shows how many task
cards the mission uses. Reveal them; starting with the commander, players take one task at a time
until all are taken.

## Playing a trick
The commander leads the first trick. Players must follow the color that was led if they can.
If they cannot, they may play any card, including a rocket. The highest card of the led color wins,
unless a rocket was played: then the highest rocket wins. The winner leads the next trick.
""",
            """
## Tasks
A task is completed when the player who took it wins the trick that contains the task card.
If a task card is won by another player, the mission fails immediately and is restarted.

## Communication
Once per mission each player may place one card face up in front of them and mark it with their
communication token:
- on top if it is their highest card of that color,
- at the bottom if it is their lowest card of that color,
- in the middle if it is their only card of that color.
Rocket cards can never be communicated. A communicated card is still played normally later.

## Distress signal
Before the first trick, the crew may use the distress signal: every player passes one card to the
neighbour. Rockets can not be passed. The mission then counts as one extra attempt.

## Winning
A mission succeeds when all tasks are completed. The campaign continues with the next mission.
""",
        ],
    },
    {
        "title": "Forbidden Island",
        "slug": "forbidden-island",
        "pages": [
            """
## Overview
Forbidden Island is a cooperative game. Adventurers must capture four treasures from a sinking
island and escape by helicopter from Fools' Landing.

## Setup
Build the island with 24 tiles. Flood 6 tiles from the flood deck (flip them to the blue side).
Each player gets a random adventurer role and 2 treasure cards. Set the water level as chosen.

## Your turn
1. Take up to 3 actions.
2. Draw 2 treasure cards. A "Waters Rise!" card raises the water level and the flood discard pile
   is shuffled and put on top of the flood deck.
3. Draw as many flood cards as the water level shows and flood those tiles. If a tile is already
   flooded, it sinks and is removed from the game.

## Actions
- Move one tile up, down, left or right (not diagonally).
- Shore up a flooded tile next to you or under you (flip it back).
- Give a treasure card to a player on the same tile.
- Capture a treasure: discard 4 matching treasure cards while standing on one of its two tiles.
""",
            """
## Special cards
Helicopter Lift moves one or more players on the same tile to any other tile. Sandbags shore up
any tile. Both can be played at any time and do not cost an action. Hand limit: 5 cards.

## Adventurers
- Pilot: once per turn, fly to any tile for 1 action.
- Engineer: shore up 2 tiles for 1 action.
- Explorer: may move and shore up diagonally.
- Diver: may move through flooded and missing tiles.
- Navigator: moves other players up to 2 tiles per action.
- Messenger: may give treasure cards to a player anywhere.

## Sinking with a pawn
If a tile sinks under a pawn, that player swims to an adjacent tile. If they cannot, the team loses.

## Winning and losing
The team wins when all 4 treasures are captured, everyone is on Fools' Landing and a Helicopter
Lift is played. The team loses if both tiles of an uncaptured treasure sink, if Fools' Landing sinks,
if a player drowns, or if the water level reaches the skull.
""",
        ],
    },
    {
        "title": "Wingspan",
        "slug": "wingspan",
        "pages": [
            """
## Overview
Players are bird enthusiasts who attract birds to their wildlife preserve. The game lasts 4 rounds.
Each bird card adds a power to one of three habitats: forest, grassland or wetland.

## Setup
Each player gets 5 bird cards, 2 bonus cards and 5 food tokens (one of each type). Keep up to 5
birds; for each bird kept, discard 1 food token. Keep 1 bonus card. Roll the 5 dice into the
birdfeeder.

## Actions
In round 1 you have 8 action cubes, then 7, 6 and 5. Each turn you use one cube for one action:
- Play a bird: pay its food cost and an egg cost depending on the column (0, 1, 1, 2, 2 eggs).
- Gain food: take dice from the birdfeeder (forest row).
- Lay eggs: put eggs on birds that have room (grassland row).
- Draw bird cards: from the tray or the deck (wetland row).
""",
            """
## Activating a habitat
When you use the forest, grassland or wetland action, put your cube in the leftmost empty space of
that row and take the base reward. Then activate the brown powers of the birds in that row, from
right to left. Each power is optional.

## Other powers
- White powers act once, when the bird is played.
- Pink powers act once between your turns, when the condition happens.

## Birdfeeder
If the birdfeeder is empty, or all remaining dice show the same face, you may reroll all dice
before taking food.

## End of a round
Score the round goal, then remove one action cube for the next round.

## Final scoring
Points on bird cards, bonus cards, round goals, 1 point per egg, 1 point per food cached on a bird
and 1 point per card tucked under a bird. The most points wins; on a tie, the most unused food wins.
""",
        ],
    },
    {
        "title": "Exploding Kittens",
        "slug": "exploding-kittens",
        "pages": [
            """
## Overview
Exploding Kittens is a card game of luck and timing. If you draw an Exploding Kitten and can not
defuse it, you are out. The last player left wins.

## Setup
Remove the Exploding Kittens and Defuse cards from the deck. Deal 7 cards to each player and give
each player 1 Defuse card. Put Exploding Kittens back into the deck: one fewer than the number of
players. Put the remaining Defuse cards back too (only 2 of them with 2 or 3 players). Shuffle.

## Your turn
Play as many cards as you want from your hand, or none. Then draw the top card of the deck; this
ends your turn.

## Exploding Kitten
If you draw an Exploding Kitten, play a Defuse card and secretly put the kitten back anywhere in the
deck. Without a Defuse you explode and leave the game.
""",
            """
## Action cards
- Attack: end your turn without drawing; the next player takes 2 turns.
- Skip: end your turn without drawing.
- Favor: one player must give you a card of their choice.
- Shuffle: shuffle the draw pile.
- See the Future: look at the top 3 cards.
- Nope: stop any action except an Exploding Kitten or a Defuse. A Nope can be Noped.

## Cat cards and combos
Cat cards have no power alone.
- Two of a kind: steal a random card from another player.
- Three of a kind: name a card; if the chosen player has it, they must give it to you.
- Five different cards: take any card from the discard pile.

## Winning
The last player who has not exploded wins.
""",
        ],
    },
    {
        "title": "Gloomhaven: Jaws of the Lion",
        "slug": "gloomhaven-jaws-of-the-lion",
        "pages": [
            """
## Overview
A cooperative campaign of tactical battles. Each player controls a hero with a personal deck of
ability cards. Scenarios have an objective; failing it means you replay the scenario.

## A round
1. Card selection: each player secretly chooses 2 ability cards. One of them is the leading card:
   its initiative number decides when you act. You may instead declare a long rest.
2. Monster ability cards are revealed for each monster type.
3. Everyone acts in initiative order, lowest first.
4. End of round: element infusions wane and players may take a short rest.

## Your turn
Perform the top action of one card and the bottom action of the other card. Cards with a loss
symbol go to the lost pile when you use that action; other cards go to the discard pile.
Instead of an action you may always do a basic attack 2 (top) or a basic move 2 (bottom).
""",
            """
## Resting
- Long rest (initiative 99, takes the whole turn): heal 2, refresh spent items and return your
  discard pile to your hand, losing one discarded card of your choice.
- Short rest (end of round): return your discard pile to your hand, losing one random card.

## Exhaustion
A hero is exhausted when their hit points reach 0 or when they cannot play 2 cards or rest.

## Attack modifiers
Each attack draws one modifier card: +0, +1, -1, +2, -2, x2 (double) or null (miss). If x2 or null
was drawn, shuffle the modifier deck at the end of the round.

## Conditions
Poison (+1 damage taken), Wound (1 damage at the start of each turn), Immobilize (no move), Disarm
(no attack), Stun (no actions), Muddle (disadvantage), Strengthen (advantage), Invisible (cannot be
targeted).

## Elements
Fire, ice, air, earth, light and dark can be infused. A new infusion is strong; it becomes waning at
the end of the round and then inert. Consuming an element improves some abilities.
""",
        ],
    },
    {
        "title": "Kingdomino",
        "slug": "kingdomino",
        "pages": [
            """
## Overview
Players build a 5 x 5 kingdom from dominoes. Each domino has two terrain squares. Crowns on the
squares multiply the value of your territories.

## Setup
Each player takes a castle tile and a king. With 2 players each player uses 2 kings and 24 dominoes
are used; with 3 players use 36 dominoes; with 4 players use all 48.

## A turn
Dominoes are numbered on the back; low numbers are less valuable. Lay out a line of new dominoes
(as many as kings) sorted by number. In the order of the kings on the current line, each player:
1. adds the domino under their king to their kingdom, then
2. places their king on a domino of the new line.
The position on the new line decides the order of the next turn: a lower number plays earlier.
""",
            """
## Connection rules
A domino must touch your castle (any terrain) or a domino with at least one matching terrain.
The kingdom must fit in a 5 x 5 grid, castle included. If you can not place a domino legally, you
discard it.

## Scoring
A territory is a group of connected squares of the same terrain. Each territory scores its number of
squares multiplied by the number of crowns in it. A territory without crowns scores 0.

## Optional bonuses
- Middle Kingdom: 10 points if your castle is in the center of your 5 x 5 kingdom.
- Harmony: 5 points if your kingdom is complete and no domino was discarded.

## Winner
The most points wins. On a tie, the player with the largest territory wins, then the player with
the most crowns.
""",
        ],
    },
    {
        "title": "Sushi Go!",
        "slug": "sushi-go",
        "pages": [
            """
## Overview
A fast card drafting game over 3 rounds. Pick the best sushi dishes from the hand that passes
around the table and score combinations.

## Dealing
Deal 10 cards each with 2 players, 9 with 3 players, 8 with 4 players and 7 with 5 players.

## A turn
Everyone picks one card at the same time and puts it face down. All picked cards are revealed
together, then each player passes the rest of their hand to the left. The round ends when all
cards are played.

## Chopsticks
On a later turn, a player with chopsticks in front of them may take 2 cards from the hand they
hold and return the chopsticks to that hand.
""",
            """
## Scoring at the end of each round
- Maki rolls: the most maki symbols score 6 points, the second most 3 points. Ties split.
- Tempura: 5 points for each pair.
- Sashimi: 10 points for each set of 3.
- Dumplings: 1, 3, 6, 10 or 15 points for 1, 2, 3, 4, 5 or more.
- Nigiri: egg 1 point, salmon 2 points, squid 3 points.
- Wasabi: triples the value of the next nigiri played on it.
- Chopsticks: 0 points.

## Puddings
Puddings stay in front of you until the end of the game. The player with the most puddings scores
6 points and the player with the fewest loses 6 points. With 2 players, nobody loses points.

## Winner
After 3 rounds the most points wins. On a tie, the most puddings wins.
""",
        ],
    },
    {
        "title": "Love Letter",
        "slug": "love-letter",
        "pages": [
            """
## Overview
Players try to deliver a love letter to the princess. Each player holds one card; the card with
the highest value at the end of a round, or being the last player in the round, wins a token.

## Setup
Shuffle the deck and remove the top card face down. With 2 players, also remove 3 cards face up.
Deal 1 card to each player.

## Your turn
Draw a card, then play one of your 2 cards face up and apply its effect.

## Cards (value, count)
- Spy (0, 2): no effect when played. At the end of the round, if you are the only player who played
  or discarded a Spy, you gain a token.
- Guard (1, 6): name a card other than Guard; if the chosen player has it, they are out.
- Priest (2, 2): look at another player's hand.
- Baron (3, 2): compare hands with another player; the lower value is out.
- Handmaid (4, 2): you are protected until your next turn.
""",
            """
## Cards (continued)
- Prince (5, 2): choose any player, yourself included, to discard their card and draw a new one.
- Chancellor (6, 2): draw 2 cards, keep 1 of your 3 cards and put 2 at the bottom of the deck.
- King (7, 1): trade hands with another player.
- Countess (8, 1): if you also hold the King or a Prince, you must play the Countess.
- Princess (9, 1): if you play or discard it, you are out of the round.

## End of a round
The round ends when only one player is left, or when the deck is empty: then the remaining players
reveal their cards and the highest value wins the round. The winner gains a token.

## Winning the game
Tokens needed to win: 6 with 2 players, 5 with 3 players, 4 with 4 players, 3 with 5 or 6 players.
""",
        ],
    },
    {
        "title": "King of Tokyo",
        "slug": "king-of-tokyo",
        "pages": [
            """
## Overview
Giant monsters fight for Tokyo. Win by reaching 20 victory points or by being the last monster
standing. Each monster starts with 10 life points and 0 victory points.

## Rolling dice
Roll 6 dice. You may reroll any of them up to 2 more times (3 rolls in total). Then resolve the
final faces:
- Numbers: three of a kind scores that many points (three 2s = 2 points). Each extra die of the
  same number adds 1 point.
- Heart: heal 1 life point (not while you are in Tokyo). The maximum is 10.
- Energy: take 1 energy cube.
- Claw: deal 1 damage.
""",
            """
## Tokyo
- If you are in Tokyo, your claws damage every monster outside Tokyo.
- If you are outside, your claws damage the monster in Tokyo. That monster may yield Tokyo; then
  you must take its place.
- If Tokyo is empty, the active monster must enter it.
- Entering Tokyo gives 1 victory point. Starting your turn in Tokyo gives 2 victory points.
With 5 or 6 players, Tokyo Bay is also used as a second place in Tokyo.

## Buying cards
After resolving the dice you may buy face-up power cards with energy. You may pay 2 energy to
discard the 3 face-up cards and reveal new ones. Keep cards stay in front of you; Discard cards
work once.

## Winning
The first monster to reach 20 victory points wins, or the last monster still alive.
""",
        ],
    },
    {
        "title": "Dobble",
        "slug": "dobble",
        "pages": [
            """
## Overview
Dobble has 55 round cards with 8 symbols on each. Any two cards always share exactly one symbol.
Be the fastest to spot it and say its name. Several mini-games use the same cards.

## The Tower
Deal one card face down to each player and put the rest face up in a pile in the center. On "go",
players turn their card over. Find the symbol shared by your card and the center card, name it and
take the center card onto your pile. Your top card changes each time. When the center pile is empty,
the player with the most cards wins.

## The Well
Deal all cards except one, which goes face up in the center. Players turn their pile face up. Be
the first to find the symbol shared by your top card and the center card, name it and put your card
on the center. The first player with no cards left wins.
""",
            """
## The Hot Potato
Played in several rounds. Each player holds one card face down. On "go", players reveal their card
in an open hand. Find a symbol shared by your card and another player's card, name it and put your
card on theirs. That player now holds all those cards. The last player holding cards loses the round
and keeps them. After 5 rounds, the player with the fewest cards wins.

## The Poisoned Gift
Each player gets one card face down and the rest go face up in the center. Find the symbol shared
between the center card and another player's card, name it and give the center card to that player.
When the pile is empty, the player with the fewest cards wins.

## Rules for all mini-games
If two players name a symbol at the same time, the first one to place the card wins. The size and
color of a symbol do not matter: only its shape.
""",
        ],
    },
    {
        "title": "Jaipur",
        "slug": "jaipur",
        "pages": [
            """
## Overview
A two-player trading game. Players are merchants in Jaipur. They collect goods and sell them for
tokens; the richest merchant at the end of a round wins a seal of excellence. Two seals win the game.

## Setup
Put 3 camel cards face up in the market and fill it with 2 cards from the deck (5 cards in total).
Deal 5 cards to each player. Players put their camels face up in front of them as their herd.
Sort the goods tokens by type, highest values on top.

## Your turn
Do one of these two actions:
1. Take cards:
   - take several goods by exchanging the same number of cards (goods from hand or camels), or
   - take 1 single good, or
   - take all camels from the market.
2. Sell cards: sell any number of cards of one type of goods and take that many tokens from the top
   of that pile.
Refill the market to 5 cards from the deck after taking.
""",
            """
## Selling rules
- Diamonds, gold and silver can only be sold 2 or more at a time.
- Selling 3, 4 or 5 or more cards at once earns a bonus token of that size.

## Hand limit
At the end of your turn you may hold at most 7 cards. Camels in your herd do not count.

## End of a round
The round ends immediately when 3 types of goods tokens are gone, or when the deck is empty and the
market can not be refilled. The player with the most camels gets the camel token (5 rupees).
The player with the most rupees wins the round and a seal of excellence. On a tie, the player with
more bonus tokens wins, then the player with more goods tokens.

## Winning
The first player with 2 seals of excellence wins the game.
""",
        ],
    },
    {
        "title": "Patchwork",
        "slug": "patchwork",
        "pages": [
            """
## Overview
A two-player puzzle game. Each player sews a quilt on a 9 x 9 board using patches. Patches cost
buttons (the currency) and time. The game ends when both players reach the center of the time board.

## Setup
Each player gets a quilt board and 5 buttons. Put the 33 patches in a circle around the time board
and the neutral token after the smallest patch.

## Whose turn
The player whose time token is further behind takes the turn. That player may play several turns in a
row. If both tokens are on the same space, the token on top plays first.

## Your turn
Choose one action:
- Advance: move your time token to the space directly in front of your opponent and take 1 button
  for each space moved.
- Buy a patch: choose one of the 3 patches in front of the neutral token, pay its button cost, place
  it on your quilt and move your time token by its time cost. The neutral token moves to that spot.
""",
            """
## Placing patches
Patches may be rotated and flipped but must not overlap other patches.

## Button income
When your time token passes a button symbol on the time board, earn as many buttons as there are
button symbols on the patches of your quilt.

## Leather patches
The first player who passes a leather patch on the time board takes it and places it on their quilt
immediately. Leather patches are single squares.

## Bonus tile
The first player to fill a 7 x 7 square on their quilt takes the bonus tile worth 7 points.

## Scoring
At the end, each player counts their buttons and loses 2 points for each empty square of their quilt.
The bonus tile adds 7 points. The highest score wins; on a tie, the player who arrived first at the
end wins.
""",
        ],
    },
    {
        "title": "Hanabi",
        "slug": "hanabi",
        "pages": [
            """
## Overview
A cooperative card game. Players launch a fireworks show by playing cards of five colors in
ascending order from 1 to 5. The twist: you hold your cards facing away from you, so you see
everyone's cards except your own.

## Cards
50 cards in 5 colors. Each color has three 1s, two 2s, two 3s, two 4s and one 5.
There are 8 blue information tokens and 3 red fuse tokens.

## Setup
With 2 or 3 players each player gets 5 cards; with 4 or 5 players, 4 cards. Hold them so the other
players can see them.
""",
            """
## Your turn
Do exactly one action:
1. Give information: spend a blue token and tell one player either all cards of one color in their
   hand or all cards of one number in their hand. You must point to all matching cards.
2. Discard a card: put it in the discard pile, draw a new card and regain one blue token.
3. Play a card: if it continues a firework of its color (for example a red 3 after the red 2),
   place it. Otherwise discard it and lose one red fuse token. Draw a new card.

Completing a firework with its 5 gives back one blue token.

## End of the game
- If the third red fuse token is lost, the game ends at once and the team loses.
- If all five fireworks are complete, the team scores the maximum of 25 points.
- When the deck runs out, each player plays one last turn.
The score is the sum of the highest card of each firework.
""",
        ],
    },
    {
        "title": "Dominion",
        "slug": "dominion",
        "pages": [
            """
## Overview
Dominion is a deck-building game. Each player starts with a small deck and buys cards from the
supply to improve it. Victory cards give points at the end but do nothing during the game.

## Setup
The supply has Copper, Silver and Gold, Estates, Duchies and Provinces, Curses and 10 piles of
Kingdom cards. Use 8 of each Victory card with 2 players and 12 with 3 or 4 players. Each player
starts with 7 Coppers and 3 Estates, shuffles them and draws 5 cards.

## Your turn (A-B-C)
- A, Action phase: you may play 1 Action card. "+Actions" on cards let you play more.
- B, Buy phase: play Treasures from your hand and buy 1 card with a cost up to their total.
  "+Buy" on cards lets you buy more.
- C, Clean-up: discard all played cards and your hand, then draw 5 new cards.
When you need to draw and your deck is empty, shuffle your discard pile to form a new deck.
""",
            """
## Costs and values
- Copper: costs 0, gives 1 coin. Silver: costs 3, gives 2. Gold: costs 6, gives 3.
- Estate: costs 2, worth 1 point. Duchy: costs 5, worth 3. Province: costs 8, worth 6.
- Curse: worth -1 point; usually given to you by an opponent's attack.

## Reading Kingdom cards
"+1 Card" draws a card. "+1 Action" lets you play another Action. "+1 Buy" gives one more buy.
"+1 coin" adds money for the Buy phase. Attack cards affect the other players.

## End of the game
The game ends at the end of a turn when the Province pile is empty or when any 3 supply piles are
empty. Count the victory points in your whole deck. The most points wins; on a tie, the player who
had fewer turns wins.
""",
        ],
    },
    {
        "title": "Small World",
        "slug": "small-world",
        "pages": [
            """
## Overview
The world is too small for everyone. Players choose a fantasy race with a special power, conquer
regions, and later put the race in decline to start a new one. Coins are victory points.

## Choosing a race
Six race and power combinations are visible. The first one is free. To take a lower one, put 1 coin
on each combination you skip; you gain the coins lying on the combination you take.

## Conquering
- Your first conquest with a new race must be a region on the edge of the map.
- Conquering a region costs 2 race tokens plus 1 for each token, mountain, fortress or other piece
  in it. Seas and lakes can not be conquered normally.
- The defender loses 1 token and takes the rest back to redeploy at the end of your turn.
- Final conquest: if you lack tokens, roll the reinforcement die once and add its result.
At the end of your turn you may redeploy your tokens among your regions.
""",
            """
## Decline
Instead of conquering, you may put your active race into decline: flip its banner and keep one token
per region. A race in decline does not conquer any more but still scores. You may only have one race
in decline; an older declined race is removed. On your next turn you choose a new race.

## Scoring
At the end of each turn, earn 1 coin for each region you occupy, plus bonuses from your race and
special power.

## Game length
The game lasts 10 turns with 2 or 3 players, 9 turns with 4 players and 8 turns with 5 players.
The player with the most coins at the end wins. Coins are kept face down until the end.
""",
        ],
    },
    {
        "title": "Cascadia",
        "slug": "cascadia",
        "pages": [
            """
## Overview
Players build an ecosystem in the Pacific Northwest with habitat tiles and place wildlife tokens on
them. Points come from wildlife patterns and from large connected habitats.

## Setup
Each player takes a starter habitat (3 tiles). Choose one wildlife scoring card for each of the 5
animals: bear, elk, salmon, hawk and fox. Reveal 4 habitat tiles, each paired with a wildlife token.

## Your turn
1. Take one tile and the token paired with it.
2. Place the tile next to your existing tiles.
3. You may place the token on one of your tiles that shows that animal and has no token yet.
   If you can not or do not want to, return it to the bag.
4. Refill the display.

## Overpopulation
If the 4 tokens on display are the same animal, they are replaced automatically. If 3 are the same,
the active player may replace those 3 once.
""",
            """
## Keystone tiles and nature tokens
Keystone tiles show a single habitat and a single animal. Placing a matching token on a keystone tile
gives you a nature token. Spend a nature token to take any tile with any token from the display, or to
replace any number of tokens on display.

## End of the game
The game ends after each player has taken 20 turns.

## Scoring
- Wildlife: each animal scores according to its scoring card.
- Habitats: for each of the 5 habitats, score 1 point per tile in your largest connected area. The
  player with the largest area of a habitat scores 3 bonus points (2 each on a tie). With 2 players the
  bonus is 2 points.
- Each unused nature token: 1 point.
The most points wins; on a tie, the player with more nature tokens wins.
""",
        ],
    },
    {
        "title": "Just One",
        "slug": "just-one",
        "pages": [
            """
## Overview
A cooperative party game. Players help one player guess a mystery word by each writing a one-word
clue. Identical clues cancel out, so be original. The team tries to guess as many of 13 cards as
possible.

## A round
1. The active player draws a card without looking at it and puts it on their easel, facing the
   others. They say a number from 1 to 5; that word is the mystery word.
2. Every other player secretly writes one clue on their easel.
3. Clue comparison: the active player closes their eyes. The others reveal their clues and remove
   identical or invalid clues.
4. The active player sees the remaining clues and has one guess.
""",
            """
## Valid clues
A clue is a single word. Not allowed: the mystery word in another language, an invented word, a word
of the same family as the mystery word (Prince for Princess), or a word that sounds the same.
Numbers, acronyms and symbols count as words.

## Result of a guess
- Correct: put the card face up in the success pile.
- Wrong: discard the card and also the top card of the deck.
- Skip: if unsure, the active player may skip; only that card is discarded.

## Scoring
After the 13 cards are used, count the cards in the success pile: 13 is a perfect score.

## With 3 players
Each non-active player writes two different clues on two easels.
""",
        ],
    },
    {
        "title": "Santorini",
        "slug": "santorini",
        "pages": [
            """
## Overview
An abstract building game for 2 to 4 players on a 5 x 5 board. Each player has 2 workers. Move a
worker up onto the third level of a building to win.

## Setup
Starting with the youngest player, each player places their 2 workers on any free spaces.

## Your turn
Choose one of your workers. It must move and then build.
1. Move to one of the 8 neighbouring spaces. A worker may move up at most one level, and may move
   down any number of levels. It may not move onto a space with a worker or a dome.
2. Build next to the worker that moved: a block on a free space, or a dome on top of a level 3
   building. A space with a dome is complete and can not be entered.
""",
            """
## Winning
You win immediately when one of your workers moves up onto the third level. Being forced to stay on
level 3 or building it does not count; only moving up onto it wins.

## Losing
If you can not move any worker and then build, you lose.

## God powers
In the full game each player has a God Power card that changes one rule, for example Apollo may swap
places with an opponent's worker and Atlas may build a dome at any level. Beginners play without them.

## 3 and 4 players
With 3 players, everybody plays alone. With 4 players, play in two teams of two: teammates share
their 4 workers and take turns alternately.
""",
        ],
    },
    {
        "title": "Hive",
        "slug": "hive",
        "pages": [
            """
## Overview
An abstract strategy game for 2 players with no board. The pieces form the hive. Surround your
opponent's Queen Bee on all six sides to win.

## Pieces
Each player has 11 pieces: 1 Queen Bee, 2 Spiders, 2 Beetles, 3 Grasshoppers and 3 Soldier Ants.

## Placing a piece
On your turn either place a new piece or move a placed piece. A new piece must touch at least one
of your own pieces and none of your opponent's (the second piece of the game is the exception).
Your Queen Bee must be placed by your fourth turn. You can not move pieces until your Queen is placed.

## One hive rule
The pieces must stay connected at all times, also during a move. A piece whose removal would split
the hive can not move.

## Freedom to move
Pieces slide around the hive. A piece can not squeeze through a gap too narrow for it, except the
Grasshopper and a Beetle climbing.
""",
            """
## Movement
- Queen Bee: moves one space.
- Beetle: moves one space, and may climb on top of the hive. A piece under a Beetle can not move.
- Grasshopper: jumps in a straight line over one or more pieces to the first empty space.
- Spider: moves exactly three spaces around the hive, without going back.
- Soldier Ant: moves any number of spaces around the hive.

## Passing
If you can not place or move any piece, you pass. Otherwise you must play.

## End of the game
You win when your opponent's Queen Bee is surrounded on all six sides, by pieces of any color. If
both Queens become surrounded at the same time, the game is a draw.
""",
        ],
    },
    {
        "title": "Spirit Island",
        "slug": "spirit-island",
        "pages": [
            """
## Overview
A cooperative strategy game. The players are spirits of an island defending it from Invaders
(explorers, towns and cities) who spread blight. The native Dahan can help you.

## A round
1. Spirit phase: each spirit chooses one growth option (gain presence, power cards or energy), gains
   energy from its presence track and plays power cards up to its card play limit by paying energy.
2. Fast powers resolve.
3. Invader phase: blighted island effects, fear cards, then Ravage, Build and Explore, and finally
   the invader cards move one step along the track.
4. Slow powers resolve.
5. Time passes: damage on pieces heals, played cards are discarded.

## Invader actions
- Explore: lands shown on the card get an explorer if they touch a town, a city or the ocean.
- Build: lands shown on the card that have invaders get a new town or city.
- Ravage: invaders in the shown lands deal damage: explorer 1, town 2, city 3.
""",
            """
## Damage and blight
If a ravage deals 2 or more damage to a land, add 1 blight there. Damage is also dealt to the Dahan
(2 health each). Surviving Dahan fight back and deal 2 damage each. Invader health: explorer 1,
town 2, city 3.

## Fear
Destroying a town gives 1 fear and destroying a city 2 fear. When enough fear is gathered, the
spirits earn fear cards and the terror level rises.

## Winning
The spirits win immediately when the victory condition of the current terror level is met:
- Terror level 1: no invaders on the island.
- Terror level 2: no towns or cities on the island.
- Terror level 3: no cities on the island.
They also win if the fear card deck is emptied.

## Losing
The spirits lose if the blight card runs out of blight, if a spirit has no presence left on the
island, or if the invader deck runs out when it must be drawn.
""",
        ],
    },
]
