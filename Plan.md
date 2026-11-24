# Shadow Gardener - Game Design & Concept

![Shadow Gardener Concept Art](C:/Users/God/.gemini/antigravity/brain/275257ec-06e7-466e-a021-623957c8e483/.user_uploaded/media_1794931049861_a6cacf9d.jpg)

## 1. Core Gameplay Loop & Mechanics

* **The Orbital Sun Dial:** Players control a miniature sun mounted on a brass ring around the terraced garden. You can manually drag the sun along its track to solve static spatial puzzles, or switch to an **Auto-Orbit Mode** where the sun moves continuously while you prune, water, and rearrange pots in real time.
* **Dynamic 2D Shadow Projection:** Use a 2D raycast or normal-mapped shadow shader so every tall object casts a real-time, directional shadow across the isometric/top-down grid. Shadow length scales dynamically based on the sun’s elevation angle (long shadows at "dawn/dusk," short shadows at "noon").
* **The Balance Meter (Thrive vs. Wilt):** Every plant has a dual-threshold comfort meter rather than a simple health bar:
* **Sun-Lovers** build *Bloom Charge* in direct light and go dormant in shade.
* **Shade-Feeders** build *Bloom Charge* in darkness and accumulate *Scorch Stress* in direct light.
* **Bloom State:** Once a plant reaches 100% Bloom Charge, it flowers permanently for that stage, releasing ambient pollen/spores that act as currency to unlock new seeds and garden upgrades.


* **Tactile Gardening Actions:** Between adjusting the sun, players water soil (which slows down Scorch Stress for shade plants), prune overgrown shadow-trees to thin out their canopy, and reposition movable stone planters.

---

## 2. Flora & Shadow-Caster Roster

| Category | Name | Light Requirement | Gameplay Role |
| --- | --- | --- | --- |
| **Sun-Lover** | **Solaris Lily** | 100% Direct Light | Needs uninterrupted exposure; acts as the baseline anchor for where you *cannot* cast shadows. |
| **Sun-Lover** | **Helio Cactus** | High Light + Dry Soil | Thrives in intense light; blocks light for tiny ground-cover plants directly behind it. |
| **Shade-Feeder** | **Ghost Fern** | 100% Deep Shadow | Withers within seconds of direct light; requires a solid stone pillar shadow path. |
| **Shade-Feeder** | **Velvet Puffball** | 70%+ Shadow | Tolerates brief sweeps of sunlight as the sun rotates, ideal for learning moving-shadow timing. |
| **Hybrid Flora** | **Dappled Orchid** | Alternating Light/Shade | Needs rhythmic cycles of sun and shade (simulating wind through leaves) to open its petals. |
| **Shadow-Caster** | **Basalt Obelisk** | Solid / Immovable | Casts a crisp, permanent shadow; can be rotated on lazy-susan tiles in later levels. |
| **Shadow-Caster** | **Whispering Banyan** | Fast-Growing | Grows taller when watered, lengthening its shadow; can be pruned back to shorten shadow reach. |

---

## 3. Level Progression & Terraced Biomes

1. **Chapter 1: The Terraced Courtyard (Tutorial & Basics)**
* Introduces manual sun rotation, immovable stone pillars, and basic Solaris Lilies paired with Ghost Ferns.
* Focuses on static geometry: finding the exact sun angle where pillars shield the ferns without starving the lilies.


2. **Chapter 2: The Living Canopy (Dynamic Shadows)**
* Introduces fast-growing trees and watering mechanics. Players must water a tree to make it tall enough to shade a distant flowerbed, then trim it when it starts blocking a neighbouring sun-lover.


3. **Chapter 3: The Tidal Conservatory (Auto-Orbit Timing)**
* Unlocks Auto-Orbit mode and Dappled Orchids. Gardens feature rotating turntables and sliding planter tracks, turning levels into relaxing, rhythmic Rube Goldberg machines of light and shadow.


4. **Chapter 4: The Prismatic Glasshouse (Light Manipulation)**
* Introduces stained-glass screens (which filter scorching light into safe, tinted light for shade-feeders) and copper mirrors (which bounce beams into dark corners).



---

## 4. Art, Audio & Development Roadmap

* **Visual Style:** Warm, hand-painted gouache textures with a cosy terracotta, sage green, and golden-ochre palette. Strong contrast between sun-drenched tiles (warm golden bloom) and shaded tiles (cool, tranquil indigo) ensures players can read shadow boundaries at a glance.
* **Sound Design:** Minimalist acoustic guitar and marimba loops that adapt dynamically—bright, airy chords play when the sun is high, shifting to soft, resonant cello notes as shadows sweep across the garden.
* **16-Week Indie Production Schedule:**
* **Weeks 1–3 (Core Prototype):** Build the top-down grid, 2D shadow-casting shader, orbital sun controller, and basic Bloom/Scorch state machines in Godot or Unity.
* **Weeks 4–7 (Vertical Slice):** Create 10 handcrafted puzzles, implement the Banyan growth/pruning mechanic, and lock in the gouache art style and adaptive audio.
* **Weeks 8–13 (Full Content & Zen Mode):** Build out all 4 biomes (40–50 levels) plus an unlocked **Sandbox Zen Garden** where players can freely decorate and experiment without fail states.
* **Weeks 14–16 (Polish & Release):** Add accessibility features (high-contrast shadow outlines, colourblind light indicators), playtest difficulty curves, and prepare storefront builds.
