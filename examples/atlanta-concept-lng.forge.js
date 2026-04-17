// ATLANTA CONCEPT LNG (4.17.26)
// Combined LNG fueling + L-Charge EV trailer-charging facility on Harvester St.
// Origin: SW corner of property. +X=east, +Y=north, +Z=up. Units: FEET.

// ─── Parameters ───────────────────────────────────────────────────────────────
const siteW          = param("Site Width (ft)",                400, { min: 300, max: 600, unit: "ft" });
const siteD          = param("Site Depth (ft)",                275, { min: 200, max: 400, unit: "ft" });
const setback50      = param("50ft Setback",                50, { min: 20,  max: 80,  unit: "ft" });
const setback25      = param("25ft Setback",                25, { min: 10,  max: 50,  unit: "ft" });
const trailerLen     = param("L-Charge Trailer Length (ft)",    50, { min: 30,  max: 70,  unit: "ft" });
const trailerWid     = param("L-Charge Trailer Width (ft)",     10, { min: 6,   max: 14,  unit: "ft" });
const trailerHt      = param("L-Charge Trailer Height (ft)",    11, { min: 8,   max: 14,  unit: "ft" });
const tankerLen      = param("Queen Tanker Length (ft)",        50, { min: 30,  max: 70,  unit: "ft" });
const tankerRad      = param("Queen Tanker Radius (ft)",         4, { min: 2,   max: 6,   unit: "ft" });
const tankerHt       = param("Queen Tanker Height (ft)",         3, { min: 1,   max: 6,   unit: "ft" });
const gasLineLen     = param("Gas Distribution Line Length (ft)", 150, { min: 80, max: 220, unit: "ft" });
const stallW         = param("Parking Space Width (ft)",       9.5, { min: 8,   max: 12,  unit: "ft" });
const stallL         = param("Parking Space Length (ft)",       18, { min: 14,  max: 22,  unit: "ft" });
const nNorthStalls   = param("Number of North Parking Stalls",  20, { min: 5,   max: 40,  unit: "" });
const nSouthStalls   = param("Number of South Parking Stalls",  20, { min: 5,   max: 40,  unit: "" });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dashedRect(x0, y0, w, d, dash, gap, color, thick, h, z) {
  // Builds a rectangle outline out of small boxes (dashes) for the 4 edges.
  const parts = [];
  const step  = dash + gap;
  // bottom & top edges (along X)
  for (let x = 0; x + dash <= w; x += step) {
    parts.push(box(dash, thick, h).translate(x0 + x, y0,              z).color(color));
    parts.push(box(dash, thick, h).translate(x0 + x, y0 + d - thick,  z).color(color));
  }
  // left & right edges (along Y)
  for (let y = 0; y + dash <= d; y += step) {
    parts.push(box(thick, dash, h).translate(x0,             y0 + y, z).color(color));
    parts.push(box(thick, dash, h).translate(x0 + w - thick, y0 + y, z).color(color));
  }
  return union(...parts);
}

function zigzagFence(x0, y0, w, d, segs) {
  // Loop around a rectangular perimeter placing short alternating-angle panels.
  const parts = [];
  const panelLen = 6, panelThk = 0.3, panelH = 6;
  const perim = 2 * (w + d);
  const step  = perim / segs;
  for (let i = 0; i < segs; i++) {
    const s = i * step;
    let px, py, rotZ;
    if (s < w) {
      px = x0 + s; py = y0; rotZ = 0;
    } else if (s < w + d) {
      px = x0 + w; py = y0 + (s - w); rotZ = 90;
    } else if (s < 2 * w + d) {
      px = x0 + w - (s - w - d); py = y0 + d; rotZ = 0;
    } else {
      px = x0; py = y0 + d - (s - 2 * w - d); rotZ = 90;
    }
    const skew = (i % 2 === 0) ? 8 : -8;
    const panel = box(panelLen, panelThk, panelH)
      .translate(px, py, panelH / 2)
      .rotate([0, 0, 1], rotZ + skew)
      .color("#555555");
    parts.push(panel);
  }
  return union(...parts);
}

function arrow(x, y, dirDeg, size) {
  // Flat white arrow on ground: thin shaft + triangular head, extruded 0.05'
  const shaftL = size * 0.7;
  const shaftW = size * 0.12;
  const headL  = size * 0.35;
  const headW  = size * 0.40;
  const shaft  = box(shaftL, shaftW, 0.05, true);
  const head   = path()
    .moveTo(0, -headW / 2)
    .lineTo(headL, 0)
    .lineTo(0, headW / 2)
    .close()
    .extrude(0.05)
    .translate(shaftL / 2, 0, 0);
  return union(shaft, head)
    .rotate([0, 0, 1], dirDeg)
    .translate(x, y, 0.03)
    .color("#ffffff");
}

function parkingRow(x0, y0, stalls, pw, pl) {
  // Paint thin white stripes (one per divider). Stripes are 0.4' wide × pl long.
  const parts = [];
  const stripeW = 0.4;
  const stripeH = 0.05;
  for (let i = 0; i <= stalls; i++) {
    const sx = x0 + i * pw;
    parts.push(
      box(stripeW, pl, stripeH)
        .translate(sx, y0, 0.03)
        .color("#ffffff")
    );
  }
  return union(...parts);
}

function tankerQueen(x, y) {
  // Horizontal cylinder, axis along Y. Dome caps + saddles.
  const parts = [];
  const body = cylinder(tankerLen, tankerRad, tankerRad, 32, true)
    .rotate([1, 0, 0], 90)
    .translate(0, 0, tankerRad + tankerHt)
    .color("#c8c8d0");
  parts.push(body);
  parts.push(sphere(tankerRad, 24).translate(0,  tankerLen / 2, tankerRad + tankerHt).color("#c8c8d0"));
  parts.push(sphere(tankerRad, 24).translate(0, -tankerLen / 2, tankerRad + tankerHt).color("#c8c8d0"));
  // Saddles
  parts.push(box(tankerRad * 2.2, 3, tankerHt, true).translate(0,  tankerLen * 0.3, tankerHt / 2).color("#888888"));
  parts.push(box(tankerRad * 2.2, 3, tankerHt, true).translate(0, -tankerLen * 0.3, tankerHt / 2).color("#888888"));
  return union(...parts).translate(x, y, 0);
}

function refuelingTruck(x, y) {
  const parts = [];
  const bodyL = 50, bodyW = 10, bodyH = 12;
  // Trailer body
  parts.push(box(bodyW, bodyL, bodyH, true).translate(0, 0, bodyH / 2 + 1).color("#2a6ab0"));
  // Cab
  parts.push(box(bodyW, 10, 10, true).translate(0, bodyL / 2 + 5, 5).color("#143866"));
  // Wheels (6 total, 3 per side)
  for (let i = 0; i < 3; i++) {
    const wy = -bodyL / 2 + 8 + i * 15;
    parts.push(cylinder(1.2, 1.8, 1.8, 20, true).rotate([0, 1, 0], 90).translate( bodyW / 2 + 0.3, wy, 1.8).color("#1a1a1a"));
    parts.push(cylinder(1.2, 1.8, 1.8, 20, true).rotate([0, 1, 0], 90).translate(-bodyW / 2 - 0.3, wy, 1.8).color("#1a1a1a"));
  }
  // Cab wheels
  parts.push(cylinder(1.2, 1.8, 1.8, 20, true).rotate([0, 1, 0], 90).translate( bodyW / 2 + 0.3, bodyL / 2 + 7, 1.8).color("#1a1a1a"));
  parts.push(cylinder(1.2, 1.8, 1.8, 20, true).rotate([0, 1, 0], 90).translate(-bodyW / 2 - 0.3, bodyL / 2 + 7, 1.8).color("#1a1a1a"));
  return union(...parts).translate(x, y, 0);
}

function vaporizer(x, y) {
  const parts = [];
  // Main block 12 x 8 x 14
  parts.push(box(12, 8, 14, true).translate(0, 0, 7).color("#d4c46a"));
  // Stack on top
  parts.push(cylinder(8, 3, 3, 24).translate(0, 0, 14).color("#b0a050"));
  return union(...parts).translate(x, y, 0);
}

function opsPad(x0, y0, w, d) {
  return box(w, d, 0.5).translate(x0, y0, 0.2).color("#b8b8b8");
}

function lcharge(x, y) {
  // L-Charge trailer: 50x10x11 deep blue + dark cab + 6 wheels
  const parts = [];
  parts.push(box(trailerLen, trailerWid, trailerHt, true)
    .translate(0, 0, trailerHt / 2 + 1)
    .color("#1f4e8f"));
  // Cab on the east end
  parts.push(box(10, 8, 10, true)
    .translate(trailerLen / 2 + 5, 0, 5)
    .color("#143866"));
  // 6 wheels along long axis (3 per side)
  for (let i = 0; i < 3; i++) {
    const wx = -trailerLen / 2 + 8 + i * 15;
    parts.push(cylinder(1.0, 1.8, 1.8, 20, true).rotate([1, 0, 0], 90).translate(wx,  trailerWid / 2 + 0.2, 1.8).color("#1a1a1a"));
    parts.push(cylinder(1.0, 1.8, 1.8, 20, true).rotate([1, 0, 0], 90).translate(wx, -trailerWid / 2 - 0.2, 1.8).color("#1a1a1a"));
  }
  return union(...parts).translate(x, y, 0);
}

// ─── Ground & Property ────────────────────────────────────────────────────────
const ground = box(siteW, siteD, 0.2).translate(0, 0, -0.2).color("#2b2b2b");

// Red property line (thin strip along rectangle edges)
function propertyLine() {
  const t = 0.5, h = 0.5;
  const parts = [];
  parts.push(box(siteW, t, h).translate(0,            0,         0).color("#d11e1e"));
  parts.push(box(siteW, t, h).translate(0,            siteD - t, 0).color("#d11e1e"));
  parts.push(box(t, siteD, h).translate(0,            0,         0).color("#d11e1e"));
  parts.push(box(t, siteD, h).translate(siteW - t,    0,         0).color("#d11e1e"));
  return union(...parts);
}

// ─── Harvester St ─────────────────────────────────────────────────────────────
function harvesterStreet() {
  const parts = [];
  const streetW = 30;
  const streetL = siteD + 100;
  // Asphalt
  parts.push(box(streetW, streetL, 0.15).translate(-streetW, -50, -0.15).color("#3a3a3a"));
  // Yellow dashed center line (runs in Y)
  const dash = 8, gap = 6;
  for (let s = 0; s + dash <= streetL; s += dash + gap) {
    parts.push(box(0.6, dash, 0.05)
      .translate(-streetW / 2 - 0.3, -50 + s, 0.01)
      .color("#f7d51d"));
  }
  return union(...parts);
}

// ─── Fueling Area ─────────────────────────────────────────────────────────────
const fuelX0 = 30, fuelY0 = 35, fuelW = 90, fuelD = 130;

function fuelingEquipment() {
  const parts = [];
  // Truck position (north side of fuel zone, facing street)
  parts.push(refuelingTruck(fuelX0 + 25, fuelY0 + 100));
  // Queen tanker (southern strip)
  parts.push(tankerQueen(fuelX0 + 70, fuelY0 + 40));
  // Vaporizer (east edge of fuel zone)
  parts.push(vaporizer(fuelX0 + 80, fuelY0 + 95));
  // Auxiliary boxes
  parts.push(box(8, 4, 5).translate(fuelX0 + 10, fuelY0 + 10, 2.5).color("#7a7a7a"));
  parts.push(box(8, 4, 5).translate(fuelX0 + 10, fuelY0 + 20, 2.5).color("#7a7a7a"));
  parts.push(box(8, 4, 5).translate(fuelX0 + 55, fuelY0 + 10, 2.5).color("#7a7a7a"));
  return union(...parts);
}

// Gas distribution line: green pipe from vaporizer area running east ~150',
// elevated 3' on small stanchions every 25'
function gasLine() {
  const parts = [];
  const pipeR = 0.5;
  const startX = fuelX0 + 80, startY = fuelY0 + 95, pipeZ = 3;
  const pipe = cylinder(gasLineLen, pipeR, pipeR, 20, true)
    .rotate([0, 1, 0], 90)
    .translate(startX + gasLineLen / 2, startY, pipeZ)
    .color("#2ecc40");
  parts.push(pipe);
  // Stanchions every 25'
  for (let s = 0; s <= gasLineLen; s += 25) {
    parts.push(cylinder(pipeZ, 0.3, 0.3, 12)
      .translate(startX + s, startY, 0)
      .color("#888888"));
  }
  return union(...parts);
}

// ─── L-Charge Trailer Row ─────────────────────────────────────────────────────
function trailerRows() {
  const parts = [];
  const xs = [160, 230, 300];
  const ys = [125, 165];
  for (let r = 0; r < ys.length; r++) {
    for (let c = 0; c < xs.length; c++) {
      parts.push(lcharge(xs[c], ys[r]));
    }
  }
  return union(...parts);
}

function trailerLabels() {
  const parts = [];
  const xs = [160, 230, 300];
  const ys = [125, 165];
  for (let r = 0; r < ys.length; r++) {
    for (let c = 0; c < xs.length; c++) {
      const t = text2d("L-CHARGE TRAILER", { size: 3, align: "center", baseline: "middle" })
        .extrude(0.3)
        .translate(xs[c], ys[r], trailerHt + 1 + 0.05)
        .color("#ffffff");
      parts.push(t);
    }
  }
  return union(...parts);
}

// ─── Parking ──────────────────────────────────────────────────────────────────
function allParking() {
  const parts = [];
  // North strip: y=225..243, x spanning 40..235 (~20 stalls)
  parts.push(parkingRow(40, 225, nNorthStalls, stallW, stallL));
  // South strip: y=32..50, x spanning 40..235
  parts.push(parkingRow(40, 32, nSouthStalls, stallW, stallL));
  // Mid-site row between the two trailer rows: y=85..103, x=145..335
  const midStalls = 20;
  parts.push(parkingRow(145, 85, midStalls, stallW, stallL));
  return union(...parts);
}

// ─── Ops Office ───────────────────────────────────────────────────────────────
const opsOffice = opsPad(320, 15, 60, 35);
const opsLabel  = text2d("RESERVED - OPERATIONS OFFICE, RESTROOMS, ETC", {
    size: 1.5, align: "center", baseline: "middle"
  })
  .extrude(0.1)
  .translate(350, 32, 0.75)
  .color("#222222");

// ─── Arrows ───────────────────────────────────────────────────────────────────
function trafficArrows() {
  const parts = [];
  // 6 arrows: east/west along driving lanes
  parts.push(arrow( 90, 200,   0, 10)); // east along north lane
  parts.push(arrow(200, 200,   0, 10));
  parts.push(arrow(300,  70, 180, 10)); // west along south lane
  parts.push(arrow(180,  70, 180, 10));
  parts.push(arrow(120, 145,   0, 10)); // mid lane east
  parts.push(arrow(270, 145, 180, 10)); // mid lane west
  return union(...parts);
}

// ─── West edge entrance/exit labels ───────────────────────────────────────────
function entranceLabels() {
  const parts = [];
  const mk = (s, x, y, color) => text2d(s, { size: 2.2, align: "center", baseline: "middle" })
      .extrude(0.08)
      .translate(x, y, 0.05)
      .color(color);
  parts.push(mk("SITE EXIT (FUEL ONLY)",        20, siteD - 15, "#ffffff"));
  parts.push(mk("SITE EXIT (AV ONLY)",          20, siteD * 0.55, "#ffffff"));
  parts.push(mk("SITE ENTRANCE (AV & FUELING)", 20, 15,          "#ffffff"));
  parts.push(mk("SLIDE GATE ENTRANCE",          20, 110,         "#f7d51d"));
  return union(...parts);
}

// ─── Dimension / annotation labels ────────────────────────────────────────────
function siteLabels() {
  const parts = [];
  const mk = (s, x, y, size, color) => text2d(s, { size: size, align: "center", baseline: "middle" })
      .extrude(0.08)
      .translate(x, y, 0.05)
      .color(color);
  parts.push(mk("50 FT 15,000 GAL QUEEN TANKER", fuelX0 + 70, fuelY0 + 68,  2.0, "#ffffff"));
  parts.push(mk("VAPORIZER",                     fuelX0 + 80, fuelY0 + 110, 1.8, "#ffffff"));
  parts.push(mk("GAS DISTRIBUTION LINE ~150 FT", fuelX0 + 160, fuelY0 + 99, 1.8, "#2ecc40"));
  parts.push(mk("50 FT PROP. LINE SETBACK",      siteW / 2, setback50 - 3,  2.0, "#33cccc"));
  parts.push(mk("25 FT PROP. LINE SETBACK",      siteW / 2, setback50 + setback25 - 3, 2.0, "#33cccc"));
  parts.push(mk("9 FT 6 IN",                     40 + stallW / 2, 225 - 3, 1.2, "#ffffff"));
  parts.push(mk("18 FT",                         40 - 3, 225 + stallL / 2, 1.2, "#ffffff"));
  parts.push(mk("FUELING AREA PERIMETER FENCING", fuelX0 + fuelW / 2, fuelY0 - 4, 1.8, "#cccccc"));
  // HARVESTER ST label flat on the street (rotated 90 to run along the street)
  parts.push(text2d("HARVESTER ST", { size: 4, align: "center", baseline: "middle" })
      .extrude(0.08)
      .rotate([0, 0, 1], 90)
      .translate(-15, siteD / 2, 0.05)
      .color("#ffffff"));
  return union(...parts);
}

// ─── Assemble ─────────────────────────────────────────────────────────────────
const propLine     = propertyLine();
const setback50Rect = dashedRect(setback50, setback50,
                                 siteW - 2 * setback50, siteD - 2 * setback50,
                                 6, 3, "#33cccc", 0.4, 0.3, 0.02);
const setback25Rect = dashedRect(setback50 + setback25, setback50 + setback25,
                                 siteW - 2 * (setback50 + setback25),
                                 siteD - 2 * (setback50 + setback25),
                                 6, 3, "#33cccc", 0.4, 0.3, 0.02);
const street       = harvesterStreet();
const fence        = zigzagFence(fuelX0, fuelY0, fuelW, fuelD, 40);
const fuelEquip    = fuelingEquipment();
const gasPipe      = gasLine();
const trailers     = trailerRows();
const trailerText  = trailerLabels();
const parking      = allParking();
const arrows       = trafficArrows();
const entranceTxt  = entranceLabels();
const annotations  = siteLabels();

return [
  { name: "Ground Slab",             shape: ground,         color: "#2b2b2b" },
  { name: "Property Line",           shape: propLine,       color: "#d11e1e" },
  { name: "50 FT Setback (dashed)",  shape: setback50Rect,  color: "#33cccc" },
  { name: "25 FT Setback (dashed)",  shape: setback25Rect,  color: "#33cccc" },
  { name: "Harvester St",            shape: street,         color: "#3a3a3a" },
  { name: "Fueling Area Fence",      shape: fence,          color: "#555555" },
  { name: "Fueling Equipment",       shape: fuelEquip,      color: "#c8c8d0" },
  { name: "Gas Distribution Line",   shape: gasPipe,        color: "#2ecc40" },
  { name: "L-Charge Trailers",       shape: trailers,       color: "#1f4e8f" },
  { name: "L-Charge Trailer Labels", shape: trailerText,    color: "#ffffff" },
  { name: "Parking Stripes",         shape: parking,        color: "#ffffff" },
  { name: "Traffic Arrows",          shape: arrows,         color: "#ffffff" },
  { name: "Ops Office Pad",          shape: opsOffice,      color: "#b8b8b8" },
  { name: "Ops Office Label",        shape: opsLabel,       color: "#222222" },
  { name: "Entrance/Exit Labels",    shape: entranceTxt,    color: "#ffffff" },
  { name: "Site Annotations",        shape: annotations,    color: "#ffffff" },
];
