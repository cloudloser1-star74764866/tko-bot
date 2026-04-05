/**
 * Generates ticket-shaped PNG emoji images for each raid ticket tier.
 * Uses the `canvas` npm package for proper 2D drawing.
 */
const { createCanvas } = require('canvas');

/**
 * Color schemes for each raid ticket tier.
 */
const TICKET_COLORS = {
  normal_raid_ticket: {
    primary1: [230, 230, 230],
    primary2: [175, 175, 180],
    stubC:    [200, 200, 205],
    outline:  [130, 130, 140],
    textCol:  '#333333',
    label:    'NRM',
    name:     'Normal Raid Ticket',
  },
  mythical_raid_ticket: {
    primary1: [220,  55,  55],
    primary2: [115,  10,  10],
    stubC:    [160,  25,  25],
    outline:  [ 80,   5,   5],
    textCol:  '#ffffff',
    label:    'MYT',
    name:     'Mythical Raid Ticket',
  },
  omega_raid_ticket: {
    primary1: [100, 215, 245],
    primary2: [ 20, 125, 200],
    stubC:    [ 45, 160, 215],
    outline:  [ 10,  90, 155],
    textCol:  '#ffffff',
    label:    'OMG',
    name:     'Omega Raid Ticket',
  },
  hellish_raid_ticket: {
    primary1: [255, 165, 200],
    primary2: [205,  65, 125],
    stubC:    [230, 100, 155],
    outline:  [155,  40,  90],
    textCol:  '#ffffff',
    label:    'HEL',
    name:     'Hellish Raid Ticket',
  },
};

function rgb(r, g, b)       { return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`; }
function rgba(r, g, b, a)   { return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`; }

/** Draws a 5-pointed star centred at (cx, cy). */
function drawStar(ctx, cx, cy, outerR, innerR, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle  = (Math.PI / points) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outerR : innerR;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Builds the ticket outline path.
 *
 * Shape: rounded rectangle with a semicircular notch cut inward on
 * both the left and right edges at the vertical centre.
 *
 * Drawing direction: top-left → clockwise.
 * The notches are concave (curve INTO the ticket body).
 *
 *  ╭──────────────────╮
 *  │                  │
 * )│                  │(   ← notch inward on each side
 *  │                  │
 *  ╰──────────────────╯
 */
function ticketPath(ctx, x0, y0, w, h, r, notchR) {
  const x1 = x0 + w;
  const y1 = y0 + h;
  const cy = y0 + h / 2;

  ctx.beginPath();

  // Top edge
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x1 - r, y0);
  ctx.quadraticCurveTo(x1, y0, x1, y0 + r);        // top-right corner

  // Right edge — top segment, notch (curves INWARD = left), bottom segment
  ctx.lineTo(x1, cy - notchR);
  ctx.arc(x1, cy, notchR, -Math.PI / 2, Math.PI / 2, true);  // anticlockwise → curves LEFT (inward)
  ctx.lineTo(x1, y1 - r);
  ctx.quadraticCurveTo(x1, y1, x1 - r, y1);        // bottom-right corner

  // Bottom edge
  ctx.lineTo(x0 + r, y1);
  ctx.quadraticCurveTo(x0, y1, x0, y1 - r);        // bottom-left corner

  // Left edge — bottom segment, notch (curves INWARD = right), top segment
  ctx.lineTo(x0, cy + notchR);
  ctx.arc(x0, cy, notchR, Math.PI / 2, -Math.PI / 2, false); // clockwise → curves RIGHT (inward)
  ctx.lineTo(x0, y0 + r);
  ctx.quadraticCurveTo(x0, y0, x0 + r, y0);        // top-left corner

  ctx.closePath();
}

/**
 * Generates a 128×128 PNG styled like a 🎟️ ticket emoji.
 * @param {string} ticketId
 * @returns {Buffer|null}
 */
function generateTicketPNG(ticketId) {
  const scheme = TICKET_COLORS[ticketId];
  if (!scheme) return null;

  const SIZE   = 128;
  const canvas = createCanvas(SIZE, SIZE);
  const ctx    = canvas.getContext('2d');

  const { primary1: p1, primary2: p2, stubC: sc, outline: ol, textCol, label } = scheme;

  // Ticket geometry
  const MARGIN  = 8;       // gap from canvas edge
  const CORNER  = 10;      // rounded corner radius
  const NOTCH_R = 12;      // radius of the side notch semicircles
  const SPLIT   = 88;      // x-position of stub divider (from canvas left)
  const CY      = SIZE / 2;

  // ── 1. Draw soft drop shadow behind ticket ────────────────────────────────
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ticketPath(ctx, MARGIN, MARGIN, SIZE - MARGIN * 2, SIZE - MARGIN * 2, CORNER, NOTCH_R);
  ctx.fillStyle = rgba(...ol, 0.9);
  ctx.fill();
  ctx.restore();

  // ── 2. Main ticket body (gradient left → right) ───────────────────────────
  ticketPath(ctx, MARGIN, MARGIN, SIZE - MARGIN * 2, SIZE - MARGIN * 2, CORNER, NOTCH_R);
  const bodyGrad = ctx.createLinearGradient(MARGIN, MARGIN, SIZE - MARGIN, SIZE - MARGIN);
  bodyGrad.addColorStop(0, rgb(...p1));
  bodyGrad.addColorStop(1, rgb(...p2));
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // ── 3. Clip everything inside ticket outline ───────────────────────────────
  ctx.save();
  ticketPath(ctx, MARGIN, MARGIN, SIZE - MARGIN * 2, SIZE - MARGIN * 2, CORNER, NOTCH_R);
  ctx.clip();

  // ── 4. Stub section overlay ────────────────────────────────────────────────
  const stubGrad = ctx.createLinearGradient(SPLIT, 0, SIZE - MARGIN, 0);
  stubGrad.addColorStop(0, rgba(...sc, 0.80));
  stubGrad.addColorStop(1, rgba(...sc, 0.95));
  ctx.fillStyle = stubGrad;
  ctx.fillRect(SPLIT, MARGIN, SIZE - MARGIN - SPLIT, SIZE - MARGIN * 2);

  // ── 5. Dashed perforation line ─────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.60)';
  ctx.lineWidth   = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(SPLIT, MARGIN + 4);
  ctx.lineTo(SPLIT, CY - NOTCH_R - 3);
  ctx.moveTo(SPLIT, CY + NOTCH_R + 3);
  ctx.lineTo(SPLIT, SIZE - MARGIN - 4);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── 6. Top highlight gloss on main body ───────────────────────────────────
  const gloss = ctx.createLinearGradient(0, MARGIN, 0, MARGIN + 26);
  gloss.addColorStop(0, 'rgba(255,255,255,0.35)');
  gloss.addColorStop(1, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = gloss;
  ctx.fillRect(MARGIN, MARGIN, SPLIT - MARGIN, 26);

  // ── 7. "RAID" label in main body ──────────────────────────────────────────
  const bodyCX = (MARGIN + SPLIT) / 2;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Text shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('RAID', bodyCX + 1, CY - 8 + 1);

  ctx.fillStyle = textCol;
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('RAID', bodyCX, CY - 8);

  // Tier label below "RAID"
  ctx.fillStyle = (textCol === '#ffffff') ? 'rgba(255,255,255,0.80)' : 'rgba(0,0,0,0.55)';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(label, bodyCX, CY + 14);

  // ── 8. Stub: two stars ────────────────────────────────────────────────────
  const stubCX = (SPLIT + SIZE - MARGIN) / 2;
  ctx.fillStyle = textCol === '#ffffff' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.45)';
  drawStar(ctx, stubCX, CY - 16, 8, 4);
  ctx.fill();
  drawStar(ctx, stubCX, CY + 16, 8, 4);
  ctx.fill();

  // ── 9. Small dot row (top & bottom of main body) ──────────────────────────
  const dotY1 = MARGIN + 9;
  const dotY2 = SIZE - MARGIN - 9;
  const dotCol = textCol === '#ffffff' ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.20)';
  ctx.fillStyle = dotCol;
  for (let i = 0; i < 5; i++) {
    const dx = (MARGIN + 12) + ((SPLIT - MARGIN - 24) * i) / 4;
    ctx.beginPath(); ctx.arc(dx, dotY1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(dx, dotY2, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore(); // remove clip

  // ── 10. Outline stroke ────────────────────────────────────────────────────
  ticketPath(ctx, MARGIN, MARGIN, SIZE - MARGIN * 2, SIZE - MARGIN * 2, CORNER, NOTCH_R);
  ctx.strokeStyle = rgb(...ol);
  ctx.lineWidth   = 2;
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

module.exports = { generateTicketPNG, TICKET_COLORS };
