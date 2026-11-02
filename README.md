# COOLDOWN ✦

**Show your gear. Chase your season. Then, cool down.**

COOLDOWN is a home for athletes of every sport (cyclists, runners, skiers, lifters, climbers, triathletes) to show off their bikes, gear and workstations, put their season goals and races in public, and get scouted by the brands that want to back them.

> The cooldown is the part after the work: you catch your breath, check your splits, look at what everyone else did. This is that place, for every sport.

---

## What it does

| Page | What you can do |
| --- | --- |
| **Home** | A scroll-driven story: a fast montage of athletes (cycling, swimming, snowboarding, running, climbing, hiking) plays behind the headlines, a water drop falls and COOLDOWN spins a full 360 into place (drag it to spin it again). Then the bike of the week (zoom into each part, try colorways), the most-liked rigs, a live leaderboard, season goals, every sport, the biggest races ahead, the feed, a brand-side comparison and ways to get started. |
| **Rigs** | Browse bikes, quivers, shoe rotations and workstations by sport and type. Like, comment and read the full build sheet. Post your own with a photo. |
| **Athletes** | Search and follow people. Every profile shows season goals with progress, upcoming races, links (Strava, Instagram, Spotify, YouTube, TikTok), rigs, stories and a sponsor pitch. |
| **Scout** | Built for brands: rank athletes by fans, engagement, rig likes, 12-week growth and a transparent **traction score**. Shortlist and compare up to three side by side. |
| **Journal** | Athletes write about their season, with a reading-progress bar and more stories to swipe through. |

Also: ⌘K search for everything, keyboard shortcuts (1–5, N, /, Esc), and a goal tracker that celebrates when you hit your target.

## Design

- **Apple-style scrolling.** Pages scroll vertically. The home hero is scrubbed by scroll. Sections fade up, numbers count up, bars grow and rings fill as they come into view, and they all run back to zero as you scroll back up.
- **Sideways only where it helps.** Rig and race galleries, the section nav and the Scout table swipe sideways inside their own lane. The page itself never scrolls sideways.
- **Black and white, with cool blue and light green.** Solid colors only, no gradient fades.
- **Type:** one family, Inter Tight, for everything.
- **Logo:** the COOLDOWN wordmark with a water drop. Each letter flips 360 on hover; the browser tab icon is the drop.
- **Accessible motion.** Everything still works, without the animation, for people who turn on Reduce Motion.

## How traction is scored

One number from 0–100, designed so a small account with a loyal audience can stand next to a big one:

- **Fans:** about 9 points every time the audience grows 10× (log scale)
- **Engagement:** 2.2 points per 1%, up to 22
- **Rig likes:** about 4 points every time likes grow 10×
- **Growth:** 0.25 points per 1% of 12-week growth, up to 12.5

## Tech

Plain HTML, CSS and JavaScript. No framework, no build step.

```
index.html        app shell (nav, tab bar)
css/styles.css    all styles, including the responsive layouts
js/data.js        demo athletes, rigs, races and stories (all fictional)
js/art.js         line-art illustrations (inline SVG), including the scroll-drawn bike
js/app.js         pages, scroll animations, galleries, posting, search
assets/video/     hero montage (free Mixkit clips, trimmed and joined)
netlify.toml      hosting config + security headers
```

**Current stage: front-end prototype.** Everything a visitor does (profile, posts, likes, follows, goals) is saved in their own browser, so the demo is safe to play with and nothing is shared between people yet.

## Run it locally

```bash
cd cooldown
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploys

Every push to `main` deploys automatically to Netlify.

## Roadmap

- [ ] Real accounts and a shared database (sign-up, profiles and posts visible to everyone)
- [ ] Photo storage in the cloud instead of the browser
- [ ] Connect Strava and Instagram so fans, engagement and activities are verified, not self-reported
- [ ] Spotify "now training to" playlist on profiles
- [ ] Brand accounts with saved shortlists and messaging
- [ ] Moderation and reporting
- [ ] Custom domain

---

© 2026 Frenk Alas Samayoa. All rights reserved. The demo athletes, events and brands are fictional. Hero footage from Mixkit (mixkit.co), used under the Mixkit Stock Video Free License.
