# Aperio design spec

Aperio shows residents how their city is doing: what it spends and what it delivers, in plain English, from the city's own public data. Pages should read like a ProPublica or FT data story, not a product dashboard. Taken from the "How is Los Angeles doing?" page (October 2026).

## Identity and honesty

- Every page says it is an independent Aperio project, not affiliated with or endorsed by the city. Never use city seals, city colours or official-looking headers.
- Name the dataset, its publisher, its ID and the date it was pulled. Link to the source.
- Publish the caveats on the page itself: what the data cannot prove (for example "closed is not proof it was fixed"), what was left out and why, and what the medians exclude.
- Only make claims the data clearly supports. "Most districts" needs a clear majority, not 8 of 15.

## Page structure

1. **Headline:** a serif sentence that states the main finding. Not a question and not a label.
   - Yes: "Nearly half the streetlights Angelenos reported broken in 2025 are still waiting on the city"
   - No: "How is Los Angeles doing?", "311 Dashboard", "Key Insights"
2. **Byline:** one muted line naming the series, Aperio's independence and the source.
3. **Opening paragraph:** serif, about 19px, at most 40rem wide. The key numbers go inside sentences, not in stat boxes.
4. **Sections:** a thin rule above each one, then an h2 that states a finding, a one- or two-sentence note on what the chart shows and how to read it, and the chart or table.
5. **How we did this:** method, caveats, exclusions, source link and the independence line. Plain paragraphs in small muted text.

## Type

- **Serif** for the headline and opening paragraph, at regular weight (400), not bold. Balance the headline line breaks.
- **Sans** for headings, body text, labels, tables and tooltips. h2 uses medium weight.
- Numbers use tabular figures.
- Fonts used inside Claude dashboards: the built-in serif and sans. Fonts for a public site are still to be decided; candidates are Source Serif 4 and Inter or IBM Plex Sans.

## Colour

| Role | Light | Dark |
|---|---|---|
| Accent (marks the one bar or row the story is about) | `#3E6B4C` | `#93C2A0` |
| Other bars | muted grey | muted grey |
| Text and background | theme foreground and background | theme foreground and background |

One accent per page. Highlight only the item the heading is about and leave everything else grey. Use red and amber only for real warnings, never for decoration.

## Charts and tables

- Square-ended bars, with no rounded corners and no background track behind the bar.
- Label values on the bar where they fit. Gridlines are faint, there is no chart border and there is no legend when the labels already explain the chart.
- Sort by the value the heading talks about.
- Tooltips add detail (90th percentile, counts). They must not be the only place a key number appears.
- Tables have hairline row borders, right-aligned numbers and no zebra stripes. A thin bar inside a cell is fine.
- Say "same day" or "under a day" instead of "0.0 days."
- Error state: plain muted text ("This data didn't load."), no icons or dots.

## Never

Gradients, glassmorphism, glows, drop shadows on cards, animated counters, icon stat tiles, a big number standing alone as the hero, wide-spaced capital labels above headings, badges or pills, emoji, background textures or watermarks, scroll effects, mid-dot "kicker" labels, headings built as two punchy sentences ("X takes weeks. Y takes days."), "Key insights" or "At a glance" sections, filler adjectives (powerful, seamless, comprehensive), and em-dash-heavy copy.

## Layout

- Content up to 60rem wide; reading text up to 46rem.
- One column. It must still read at about 400px width with no sideways scroll; tables may scroll inside their own box.
- Meets WCAG 2.1 AA: contrast, chart `aria-label`s, real `<table>` markup and keyboard-reachable tooltips. This is Aperio's own pitch to cities, so its pages have to meet it too.
