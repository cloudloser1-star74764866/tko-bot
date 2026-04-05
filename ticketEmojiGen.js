/**
 * Generates ticket-shaped PNG emoji images for each raid ticket tier.
 * Uses the `canvas` npm package for proper 2D drawing.
 */
const { createCanvas } = require('canvas');

/**
 * Color schemes for each raid ticket tier.
 * primary = main body color (top→bottom gradient)
 * accent  = stub section tint
 * label   = short text shown on the stub
 */
const TICKET_COLORS = {
  normal_raid_ticket: {
    primary1: [220, 220, 220],
    primary2: [160, 160, 165],
    accent:   [185, 185, 190],
    label:    'NORMAL',
    name:     'Normal Raid Ticket',
  },
  mythical_raid_ticket: {
    primary1: [215,  50,  50],
    primary2: [120,  10,  10],
    accent:   [160,  20,  20],
    label:    'MYTHIC',
    name:     'Mythical Raid Ticket',
  },
  omega_raid_ticket: {
    primary1: [100, 210, 240],
    primary2: [20,  130, 200],
    accent:   [40,  160, 210],
    label:    'OMEGA',
    name:     'Omega Raid Ticket',
  },
  hellish_raid_ticket: {
    primary1: [255, 170, 200],
    primary2: [210,  70, 130],
    accent:   [230, 100, 155],
    label:    'HELL',
    name:     'Hellish Raid Ticket',
  },
};

function rgb(r, g, b) { return `rgb(${r},${g},${b})`; }
function rgba(r, g, b, a) { return `rgba(${r},${g},${b},${a})`; }
function mix(c1, c2, t) {
  return c1.map((v, i) => Math.round(v * (1 - t) + c2[i] * t));
}

/** Draws a 5-pointed star centred at (cx, cy) with outer radius R and inner radius r. */
function drawStar(ctx, cx, cy, R, r, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Generates a 128×128 PNG styled like a 🎟️ ticket emoji,
 * coloured according to the given ticket tier.
 *
 * @param {string} ticketId
 * @returns {Buffer|null}  PNG buffer, or null if ticketId is unknown
 */
function generateTicketPNG(ticketId) {
  const scheme = TICKET_COLORS[ticketId];
  if (!scheme) return null;

  const W = 128, H = 128;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const { primary1: p1, primary2: p2, accent: ac, label } = scheme;

  // Derived colours
  const shadow = mix(p2, [0, 0, 0], 0.35);
  const stubC1  = mix(ac, [255, 255, 255], 0.12);
  const stubC2  = mix(ac, [0, 0, 0],       0.20);

  // Layout constants
  const PAD    = 6;     // outer padding / corner radius
  const NOTCH_R = 10;   // radius of the side semicircle cut-outs
  const SPLIT  = 88;    // x-coordinate of the tear line (left of stub)
  const CY     = H / 2; // vertical centre (where notches sit)

  // ─── 1. Build the full ticket outline as a clip path ──────────────────────
  function drawTicketPath() {
    ctx.beginPath();
    ctx.moveTo(PAD + PAD, PAD);                        // top-left corner start
    ctx.lineTo(W - PAD - PAD, PAD);                    // top edge
    ctx.quadraticCurveTo(W - PAD, PAD, W - PAD, PAD + PAD); // top-right corner
    // right edge: top half → right notch (inward arc) → bottom half
    ctx.lineTo(W - PAD, CY - NOTCH_R);
    ctx.arc(W - PAD, CY, NOTCH_R, -Math.PI / 2, Math.PI / 2, false); // outward
    ctx.lineTo(W - PAD, H - PAD - PAD);
    ctx.quadraticCurveTo(W - PAD, H - PAD, W - PAD - PAD, H - PAD); // btm-right
    ctx.lineTo(PAD + PAD, H - PAD);                    // bottom edge
    ctx.quadraticCurveTo(PAD, H - PAD, PAD, H - PAD - PAD); // btm-left
    // left edge: bottom half → left notch (outward arc) → top half
    ctx.lineTo(PAD, CY + NOTCH_R);
    ctx.arc(PAD, CY, NOTCH_R, Math.PI / 2, -Math.PI / 2, false);    // outward
    ctx.lineTo(PAD, PAD + PAD);
    ctx.quadraticCurveTo(PAD, PAD, PAD + PAD, PAD);   // top-left corner
    ctx.closePath();
  }

  // ─── 2. Background shadow ─────────────────────────────────────────────────
  ctx.fillStyle = rgba(...shadow, 0.55);
  ctx.fillRect(0, 0, W, H);

  // ─── 3. Main ticket body with gradient ───────────────────────────────────
  ctx.save();
  drawTicketPath();
  const bodyGrad = ctx.createLinearGradient(PAD, PAD, W - PAD, H - PAD);
  bodyGrad.addColorStop(0, rgb(...p1));
  bodyGrad.addColorStop(1, rgb(...p2));
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.clip(); // now everything below is clipped to the ticket outline

  // ─── 4. Stub section (darker overlay on the right strip) ─────────────────
  const stubGrad = ctx.createLinearGradient(SPLIT, 0, W, 0);
  stubGrad.addColorStop(0, rgb(...stubC1));
  stubGrad.addColorStop(1, rgb(...stubC2));
  ctx.fillStyle = stubGrad;
  ctx.fillRect(SPLIT, PAD, W - SPLIT, H - PAD * 2);

  // ─── 5. Dashed perforation line ───────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(SPLIT, PAD + 2);
  ctx.lineTo(SPLIT, CY - NOTCH_R - 2);
  ctx.moveTo(SPLIT, CY + NOTCH_R + 2);
  ctx.lineTo(SPLIT, H - PAD - 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // ─── 6. Subtle inner glow/highlight at the top of the main body ──────────
  const highlight = ctx.createLinearGradient(0, PAD, 0, PAD + 28);
  highlight.addColorStop(0, 'rgba(255,255,255,0.30)');
  highlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = highlight;
  ctx.fillRect(PAD, PAD, SPLIT - PAD, 28);

  // ─── 7. Stars on the stub ────────────────────────────────────────────────
  const stubCX = (SPLIT + W - PAD) / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  drawStar(ctx, stubCX, CY - 18, 7, 3);
  ctx.fill();
  drawStar(ctx, stubCX, CY + 18, 7, 3);
  ctx.fill();

  // ─── 8. Decorative small dots row on main body (top & bottom) ────────────
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  const dotCount = 5;
  for (let i = 0; i < dotCount; i++) {
    const dx = (PAD + 10) + ((SPLIT - PAD - 20) * i) / (dotCount - 1);
    ctx.beginPath(); ctx.arc(dx, PAD + 10, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(dx, H - PAD - 10, 2, 0, Math.PI * 2); ctx.fill();
  }

  // ─── 9. "RAID" label on main body ─────────────────────────────────────────
  const bodyCX = (PAD + SPLIT) / 2;
  ctx.fillStyle  = 'rgba(255,255,255,0.92)';
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('RAID', bodyCX, CY - 7);

  // ─── 10. Tier label on main body (smaller, below) ─────────────────────────
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText(label, bodyCX, CY + 11);

  // ─── 11. Outline stroke ───────────────────────────────────────────────────
  ctx.restore();
  drawTicketPath();
  ctx.strokeStyle = rgba(...mix(p2, [0, 0, 0], 0.4), 0.8);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

module.exports = { generateTicketPNG, TICKET_COLORS };
