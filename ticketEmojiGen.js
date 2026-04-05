/**
 * Generates simple gradient PNG images for raid ticket emojis.
 * Uses only Node.js built-in modules (no external dependencies).
 */
const zlib = require('zlib');

function buildCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}
const CRC_TABLE = buildCrcTable();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const lenBuf  = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcData = Buffer.concat([typeBuf, data]);
  const crcBuf  = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcData));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Generates a 128×128 gradient PNG from color1 (top) to color2 (bottom).
 * @param {[number,number,number]} color1  RGB top color
 * @param {[number,number,number]} color2  RGB bottom color
 * @param {number} width
 * @param {number} height
 * @returns {Buffer} PNG file bytes
 */
function generateGradientPNG(color1, color2, width = 128, height = 128) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    const t = height > 1 ? y / (height - 1) : 0;
    const r = Math.round(color1[0] * (1 - t) + color2[0] * t);
    const g = Math.round(color1[1] * (1 - t) + color2[1] * t);
    const b = Math.round(color1[2] * (1 - t) + color2[2] * t);
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      row[1 + x * 3]     = r;
      row[1 + x * 3 + 1] = g;
      row[1 + x * 3 + 2] = b;
    }
    rows.push(row);
  }

  const rawData    = Buffer.concat(rows);
  const compressed = zlib.deflateSync(rawData);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // color type: RGB truecolor
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace: none

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Color schemes for each raid ticket tier.
 * color1 = top color (RGB), color2 = bottom color (RGB).
 */
const TICKET_COLORS = {
  normal_raid_ticket:   { color1: [230, 230, 230], color2: [160, 160, 160], name: 'Normal Raid Ticket'   },
  mythical_raid_ticket: { color1: [220,  60,  60], color2: [120,  10,  10], name: 'Mythical Raid Ticket' },
  omega_raid_ticket:    { color1: [130, 220, 240], color2: [30,  160, 200], name: 'Omega Raid Ticket'    },
  hellish_raid_ticket:  { color1: [255, 180, 200], color2: [220,  80, 130], name: 'Hellish Raid Ticket'  },
};

/**
 * Generates a PNG buffer for a given ticket ID.
 * @param {string} ticketId
 * @returns {Buffer|null}
 */
function generateTicketPNG(ticketId) {
  const scheme = TICKET_COLORS[ticketId];
  if (!scheme) return null;
  return generateGradientPNG(scheme.color1, scheme.color2);
}

module.exports = { generateTicketPNG, TICKET_COLORS };
