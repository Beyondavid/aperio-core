// Builds the static site into public/ from the CSVs in data/. No dependencies: `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from "node:fs";
import assert from "node:assert/strict";

const OUT = "public";

// shortcut: no quoted fields, fine for our own CSVs; use a real parser if a source ever has commas in values.
function csv(path) {
  const [head, ...lines] = readFileSync(path, "utf8").trim().split("\n");
  const cols = head.split(",");
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => {
    // an empty cell would otherwise become 0 and print as "same day"
    if (v.trim() === "") assert.fail(`empty ${cols[i]} cell in ${path}`);
    return [cols[i], isNaN(v) ? v : Number(v)];
  })));
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const num = (n) => n.toLocaleString("en-US");
const pct = (n) => Math.round(n * 100) + "%";
const days = (d) => (d === 0 ? "same day" : d < 1 ? "under a day" : d === 1 ? "1 day" : `${+d.toFixed(1)} days`);
// for "took over X" / "more than X": round down so the claim never overstates the data
const over = (d) => days(Math.floor(d));
const bar = (v, max, label) => `<div class="bar"><span style="width:${((v / max) * 80).toFixed(1)}%" aria-hidden="true"></span><b>${label}</b></div>`;

function page({ title, description, path, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<div class="site">
<div class="masthead"><a class="name" href="/">Aperio</a><nav>${path === "/" ? "" : '<a href="/">All reports</a>'}</nav></div>
<main>
${body}
</main>
<footer>Aperio is an independent project. It is not affiliated with or endorsed by any city or government agency. Every figure comes from public records, and each report links to its source data.</footer>
</div>
</body>
</html>
`;
}

// ---- Los Angeles 311 report ----
// provenance shown in each report's method section; the build stops if any of it is missing
function readSource(path) {
  const s = JSON.parse(readFileSync(path, "utf8"));
  for (const k of ["name", "publisher", "id", "portal", "url", "pulled", "cityUpdated"]) assert.ok(String(s[k] ?? "").trim(), `${path}: missing "${k}"`);
  assert.match(s.url, /^https:\/\//, `${path}: url must be https`);
  for (const k of ["pulled", "cityUpdated"]) assert.match(s[k], /^\d{4}-\d{2}-\d{2}$/, `${path}: "${k}" must be YYYY-MM-DD`);
  assert.ok(s.cityUpdated <= s.pulled, `${path}: city update is after the pull date`);
  return s;
}
const date = (iso, opts = { month: "long", day: "numeric", year: "numeric" }) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });

// formatter checks: these strings are published claims
assert.equal(days(0), "same day");
assert.equal(days(0.7), "under a day");
assert.equal(days(1), "1 day");
assert.equal(days(65.5), "65.5 days");
assert.equal(over(6.5), "6 days");
assert.equal(over(6.8), "6 days");
assert.equal(over(168.3), "168 days");
assert.equal(pct(0.472), "47%");
assert.equal(date("2026-10-16"), "October 16, 2026");

const dir = "data/la-311-2025";
const services = csv(`${dir}/services.csv`);
const lights = csv(`${dir}/streetlights-by-district.csv`);
const dumping = csv(`${dir}/dumping-by-district.csv`);
const source = readSource(`${dir}/source.json`);
const svc = (name) => services.find((r) => r.service === name) ?? assert.fail(`missing service ${name}`);
const sl = svc("Broken streetlights"), graffiti = svc("Graffiti removal"), dump = svc("Illegal dumping");

// self-checks: district files must add up to the citywide rows, and the headline must still be true
assert.equal(lights.reduce((s, r) => s + r.reports, 0), sl.reports);
assert.equal(lights.reduce((s, r) => s + r.still_open, 0), sl.still_open);
assert.ok(dump.reports - dumping.reduce((s, r) => s + r.reports, 0) <= 5, "dumping districts don't add up");
assert.ok(sl.still_open_share > 0.4 && sl.still_open_share < 0.5, 'headline says "nearly half"');
assert.equal(Math.max(...services.map((r) => r.median_days)), sl.median_days, "streetlights must be the slowest");
assert.ok(services.every((r) => r.p90_days >= 1), 'over() reads wrong below one day ("over same day")');
// section headings
const shares = lights.map((r) => r.still_open_share), dumpReports = dumping.map((r) => r.reports);
assert.ok(Math.max(...shares) - Math.min(...shares) > 0.25, '"depends heavily on the district"');
assert.ok(Math.max(...dumpReports) >= 3 * Math.min(...dumpReports), '"reported unevenly"');
assert.ok(Math.max(...dumping.map((r) => r.median_days)) - Math.min(...dumping.map((r) => r.median_days)) < 2, '"about the same speed everywhere"');

const byMedian = [...services].sort((a, b) => b.median_days - a.median_days);
const maxMedian = byMedian[0].median_days;
const byOpen = [...lights].sort((a, b) => b.still_open_share - a.still_open_share);
const byDistrict = [...dumping].sort((a, b) => a.district - b.district);
const maxDump = Math.max(...dumping.map((r) => r.reports));
const dumpMed = dumping.map((r) => r.median_days);

const la = page({
  title: "Los Angeles streetlight repairs, 2025 | Aperio",
  description: `Nearly half of the broken streetlights Angelenos reported in 2025 are still open, according to the city's own MyLA311 records.`,
  path: "/los-angeles/",
  body: `<header class="report">
<h1>Nearly half the streetlights Angelenos reported broken in 2025 are still waiting on the city</h1>
<p class="byline">How is Los Angeles doing? An independent Aperio report, from the city's own 311 records. Published October 2026.</p>
<p class="lede">Residents filed ${num(sl.reports)} broken-streetlight reports last year. ${num(sl.still_open)} of them, or ${pct(sl.still_open_share)}, are still marked open. The ones the city did close took a median of ${days(sl.median_days)}, and one in ten took more than ${over(sl.p90_days)}. Most other requests move far faster: ${pct(graffiti.within_3_days_share)} of graffiti reports close within three days, and dumped items are picked up in a median of ${days(dump.median_days)}.</p>
</header>

<section id="services">
<h2>Streetlight repairs are by far the slowest request the city closes</h2>
<p class="note">Median time from a resident's report to the city closing it, for requests closed so far. Reports still open are not counted, so the real streetlight wait is longer.</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Service</th><th scope="col">Median time to close</th><th scope="col" class="r">Slowest 10% took over</th><th scope="col" class="r">Reports</th><th scope="col" class="r">Still open</th></tr></thead>
<tbody>
${byMedian.map((r) => `<tr${r === sl ? ' class="hl"' : ""}><th scope="row">${esc(r.service)}</th><td class="bar-cell">${bar(r.median_days, maxMedian, days(r.median_days))}</td><td class="r">${over(r.p90_days)}</td><td class="r">${num(r.reports)}</td><td class="r">${num(r.still_open)}</td></tr>`).join("\n")}
</tbody></table></div>
</section>

<section id="streetlights">
<h2>Whether a streetlight gets fixed depends heavily on the district</h2>
<p class="note">Each council district's 2025 streetlight reports, the share still marked open, and the median wait for the ones that were fixed. Sorted by share still open. A report counts as open if the city has not closed it in its system.</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Council district</th><th scope="col" class="r">Reports</th><th scope="col">Still open</th><th scope="col" class="r">Median wait when fixed</th></tr></thead>
<tbody>
${byOpen.map((r) => `<tr><th scope="row">District ${r.district}</th><td class="r">${num(r.reports)}</td><td class="bar-cell">${bar(r.still_open_share, 1, pct(r.still_open_share))}</td><td class="r">${days(r.median_days_to_fix)}</td></tr>`).join("\n")}
</tbody></table></div>
</section>

<section id="dumping">
<h2>Dumping is reported unevenly across the city but picked up at about the same speed everywhere</h2>
<p class="note">Illegal dumping reports in 2025 by council district, with the median time to pickup. Los Angeles draws its districts to hold roughly equal populations, so the counts compare directly. Medians run from ${days(Math.min(...dumpMed))} to ${days(Math.max(...dumpMed))}.</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Council district</th><th scope="col">Reports</th><th scope="col" class="r">Median pickup</th></tr></thead>
<tbody>
${byDistrict.map((r) => `<tr${r.reports === maxDump ? ' class="hl"' : ""}><th scope="row">District ${r.district}</th><td class="bar-cell">${bar(r.reports, maxDump, num(r.reports))}</td><td class="r">${days(r.median_days)}</td></tr>`).join("\n")}
</tbody></table></div>
</section>

<section id="method" class="notes">
<h2>How we did this</h2>
<p>Every figure comes from the ${esc(source.publisher)}'s own <a href="${esc(source.url)}">${esc(source.name)}</a> (dataset ${esc(source.id)} on ${esc(source.portal)}). Aperio downloaded the records on ${date(source.pulled)}, when the city had last updated them on ${date(source.cityUpdated)}, and measured each request from the time it was created to the time it was closed. Streetlight figures combine single and multiple streetlight reports.</p>
<p>A closed request is not proof the problem was fixed, and an open one is not proof it wasn't. The city's records only show the status in its system. Some streetlights marked open may have been repaired without the request being closed.</p>
<p>Potholes and other street repairs are not part of this dataset. They run through a separate city system that is not published here. We left out homeless encampment reports, because closing one reflects outreach and policy decisions rather than a pickup, so timing them would mislead.</p>
<p>The figures behind this page: <a href="/data/la-311-2025/services.csv">services</a>, <a href="/data/la-311-2025/streetlights-by-district.csv">streetlights by district</a>, <a href="/data/la-311-2025/dumping-by-district.csv">dumping by district</a> (CSV).</p>
</section>`,
});

const home = page({
  title: "Aperio: see how your city is actually doing",
  description: "Independent, plain-English reports on what cities spend and what they deliver, built from their own public records.",
  path: "/",
  body: `<header class="report">
<h1>See how your city is actually doing: what it spends, and what it delivers</h1>
<p class="lede">Aperio turns a city's own public records into plain-English reports. Each one states what the data shows, what it can't prove, and links to every source.</p>
</header>
<section>
<h2>Reports</h2>
<ul class="reports">
<li><a href="/los-angeles/">Nearly half the streetlights Angelenos reported broken in 2025 are still waiting on the city</a><p>Los Angeles · 311 service requests, 2025 · October 2026</p></li>
</ul>
</section>`,
});

rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/los-angeles`, { recursive: true });
writeFileSync(`${OUT}/index.html`, home);
writeFileSync(`${OUT}/los-angeles/index.html`, la);
cpSync("src/styles.css", `${OUT}/styles.css`);
cpSync("data", `${OUT}/data`, { recursive: true });
console.log("built", OUT);
