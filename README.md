# COOLDOWN ✦

**Show your gear. Chase your season. Then, cool down.**

COOLDOWN is a home for cyclists and bike mechanics (road, gravel, MTB, track, cyclocross, BMX and fixed) to show off their bikes, builds and workstations, put their season goals and races in public, and get scouted by the brands that want to back them.

> The cooldown is the part after the work: you catch your breath, check your splits, look at what everyone else did. This is that place, for riders and the mechanics who keep them rolling.

---

## What it does

| Page | What you can do |
| --- | --- |
| **Home** | A short scroll-driven intro: quick cycling clips (you pick them, see below) play behind the headlines, a chrome water drop falls and COOLDOWN spins a full 360 into place (drag it to spin it again). Then straight to the point: the bike of the week (zoom into each part, try colorways), the most-liked rigs, the **station of the week** for mechanics, the top 5 leaderboard, season goals, the biggest races ahead, a brand-side comparison and ways to get started. |
| **Rigs** | Browse bikes, quivers, shoe rotations and workstations by sport and type. Like, comment and read the full build sheet. Post your own with a photo. |
| **Athletes** | Search and follow riders and mechanics (there's a 🔧 Mechanics filter), and browse **teams**: every team has a page with its crest, sponsors, roster and races, and you can join, leave or start one. Every profile has a build-your-own avatar you can spin and wave at, pinned photos and videos, recent results with podium colors, what's next, a 12-month season calendar (A/B/C races, camps, goal deadlines), season goals, top 5 songs and top 5 races, rigs, stories, current sponsors and a sponsor pitch. Mechanics also get a shop section: specialties, certifications, bikes built and their stations. |
| **Scout** | Built for brands: rank athletes by fans, engagement, rig likes, 12-week growth and a transparent **traction score**. Shortlist and compare up to three side by side. Questions (how traction is scored, verification) are at the bottom. |
| **Journal** | Athletes write about their season, with a reading-progress bar and more stories to swipe through. |
| **Profile** | The **Profile** button (top right, or the last tab on phones) takes you to your profile, or sets one up if you don't have one yet. Setup is one card: upload a photo or use the default blue avatar, pick what you do (Rider, Mechanic or Rider + Mechanic), tick every discipline you ride, choose or start a team, list your sponsors, add your shop (optional) and search for your top 5 songs or albums. |

Also: ⌘K search for everything, keyboard shortcuts (1–5, N, /, Esc), and a goal tracker that celebrates when you hit your target.

## Design

- **Apple-style scrolling.** Pages scroll vertically. The home hero is scrubbed by scroll. Sections fade up, numbers count up, bars grow and rings fill as they come into view, and they all run back to zero as you scroll back up.
- **Sideways only where it helps.** Rig and race galleries, the section nav and the Scout table swipe sideways inside their own lane. The page itself never scrolls sideways.
- **Black and white, with cool blue and light green.** Solid colors only, no gradient fades.
- **Type:** Bricolage Grotesque (self-hosted in `assets/fonts`, open font license) for headlines, the wordmark and big numbers, in sentence case; General Sans for everything else. To try another headline font, change `--f-display` in `css/styles.css`.
- **Logo:** the COOLDOWN wordmark with a chrome water drop. Each letter flips 360 on hover.
- **Tab icon:** just the chrome drop and the word COOLDOWN. The drop is drawn live (`js/tabicon.js`): a sheen and glitter sweep across it every few seconds, the reflection slides as you scroll, and it flashes when you come back to the tab or tap the logo.
- **Accessible motion.** Everything still works, without the animation, for people who turn on Reduce Motion.

## Avatars

`js/avatar3d.js` builds each rider as a glossy 3D vinyl toy with three.js (vendored in `js/vendor`, MIT license): drag to spin it, tap to make it wave and hop. Small round avatars are still pictures of the 3D head. Browsers that can't draw 3D get the flat SVG version from `js/avatar.js`, built from the same settings. Pick a discipline (Road, Gravel, MTB, Track, Cyclocross, BMX, Fixed) or the mechanic's Shop outfit, then skin tone, hair, face, pose, helmet, eyewear and lenses, kit colors and pattern, bottoms, shoes and socks, extras (gloves, knee pads, mud, race number, watch) and what they're holding. Profiles show the full body (drag to spin, tap to wave); everywhere else shows the head in the usual round bubble.

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
js/app.js         pages, scroll animations, galleries, profile setup, teams, search
js/avatar.js      avatar settings + the flat SVG fallback
js/avatar3d.js    the 3D avatars (three.js)
js/vendor/        three.js 0.170.0 (MIT)
assets/fonts/     Bricolage Grotesque (OFL)
js/clips.js       THE LIST OF HERO VIDEOS (edit this to pick your own)
js/tabicon.js     the live chrome drop in the browser tab
assets/video/clips/  the hero video clips (free Mixkit and Pexels clips)
netlify.toml      hosting config + security headers
```

Song search uses Apple's free public iTunes catalog search (no key needed); tapping a song on a profile opens it in Spotify. Spotify's own search needs a server-side key, so that is a later step.

**Current stage: front-end prototype.** Everything a visitor does (profile, posts, likes, follows, goals) is saved in their own browser, so the demo is safe to play with and nothing is shared between people yet.

## Pick your own hero videos

1. Put your `.mp4` in `assets/video/clips/`.
2. Open `js/clips.js` and add its file name to the list (or delete lines for clips you don't want, or move lines to reorder).
3. Optional: `{ file: 'long-video.mp4', start: 12, seconds: 2 }` plays just 2 seconds starting 12 seconds in.

Short (1.5–2 s), landscape, silent, under 1 MB each keeps it fast. If a file name is wrong, that clip is skipped and the rest keep playing.

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
- [ ] Spotify search and playlists (needs a small server for the Spotify key)
- [ ] Custom 3D models for avatars (for example from Tripo), swapped in for the built-in toy figure
- [ ] Brand accounts with saved shortlists and messaging
- [ ] Moderation and reporting
- [ ] Custom domain

---

© 2026 Frenk Alas Samayoa. All rights reserved. The demo athletes, events and brands are fictional. Hero footage from Mixkit (mixkit.co), used under the Mixkit Stock Video Free License.
