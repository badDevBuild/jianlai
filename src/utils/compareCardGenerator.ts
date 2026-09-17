import {
  loadImage, roundRectPath,
  wrapText, drawQRFooter, exportCanvas, GOLD
} from './cardUtils';

export interface CompareCharData {
  name: string;
  avatar: string;
  alias?: string;
  cultivation?: string;
  faction?: string;
  tags?: string[];
  techniquesCount?: number;
  topTechniques?: string[];
  quotesCount?: number;
  relationCount: number;
  mutualRelations?: string[];
  quote?: string;
}

const W = 750;
const H = 1200;
const COMPARE_BG = '/assets/images/card-compare-template.jpg';

// Colors for light (parchment) area
const INK_DARK = '#1a1a1a';
const INK_MAIN = '#333333';
const INK_MED = '#666666';
const INK_LIGHT = '#999999';

/** Draw circular avatar with gold ring */
async function drawAvatar(
  ctx: any, canvas: any, char: CompareCharData,
  cx: number, cy: number, radius: number
) {
  // Gold ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(201,169,98,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  try {
    const img = await loadImage(canvas, char.avatar);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  } catch {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#F5F0E8';
    ctx.fill();
    ctx.fillStyle = 'rgba(201,169,98,0.4)';
    ctx.font = '52px "PingFang SC"';
    ctx.textAlign = 'center';
    ctx.fillText(char.name[0], cx, cy + 18);
    ctx.restore();
  }
}

/** Draw pill-shaped tags centered around cx */
function drawTags(ctx: any, tags: string[], cx: number, y: number, maxWidth: number): number {
  if (!tags || tags.length === 0) return 0;
  ctx.font = '17px "PingFang SC"';
  const pillH = 26;
  const pillPadX = 12;
  const gap = 6;

  const tagWidths = tags.map(t => ctx.measureText(t).width + pillPadX * 2);
  let totalW = 0;
  let visibleCount = 0;
  for (let i = 0; i < tagWidths.length; i++) {
    const next = totalW + tagWidths[i] + (visibleCount > 0 ? gap : 0);
    if (next > maxWidth && visibleCount > 0) break;
    totalW = next;
    visibleCount++;
  }

  let startX = cx - totalW / 2;
  for (let i = 0; i < visibleCount; i++) {
    const tw = tagWidths[i];
    // Pill bg
    ctx.fillStyle = 'rgba(201,169,98,0.08)';
    roundRectPath(ctx, startX, y, tw, pillH, pillH / 2);
    ctx.fill();
    // Pill border
    ctx.strokeStyle = 'rgba(201,169,98,0.4)';
    ctx.lineWidth = 1;
    roundRectPath(ctx, startX, y, tw, pillH, pillH / 2);
    ctx.stroke();
    // Text
    ctx.fillStyle = INK_MED;
    ctx.textAlign = 'center';
    ctx.fillText(tags[i], startX + tw / 2, y + pillH / 2 + 5);
    startX += tw + gap;
  }

  return pillH;
}

/** Truncate text to fit within maxWidth */
function truncate(ctx: any, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 2 && ctx.measureText(text + '…').width > maxW) {
    text = text.slice(0, -1);
  }
  return text + '…';
}

export async function generateCompareCard(
  canvas: any,
  left: CompareCharData,
  right: CompareCharData,
  pixelRatio: number
): Promise<string> {
  const dpr = pixelRatio;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // ── 1. Background ──
  try {
    const bgImg = await loadImage(canvas, COMPARE_BG);
    ctx.drawImage(bgImg, 0, 0, W, H);
  } catch {
    // Fallback: parchment to dark gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#EDE4D3');
    bg.addColorStop(0.50, '#E0D5C0');
    bg.addColorStop(0.60, '#8A7A65');
    bg.addColorStop(0.70, '#3A3025');
    bg.addColorStop(1, '#0D0B08');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. Avatars ──
  const avatarR = 80;
  const avatarY = 175;
  const leftCx = W / 4 + 10;
  const rightCx = 3 * W / 4 - 10;

  await drawAvatar(ctx, canvas, left, leftCx, avatarY, avatarR);
  await drawAvatar(ctx, canvas, right, rightCx, avatarY, avatarR);

  // VS badge
  const vsCx = W / 2;
  const vsCy = avatarY;
  const vsR = 24;
  // Gold circle
  ctx.beginPath();
  ctx.arc(vsCx, vsCy, vsR, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  // Dark text
  ctx.font = 'bold 24px "PingFang SC"';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1A1510';
  ctx.fillText('VS', vsCx, vsCy + 8);

  // ── 3. Names (dark text on light bg) ──
  let curY = avatarY + avatarR + 28;
  ctx.font = 'bold 34px "PingFang SC", serif';
  ctx.fillStyle = INK_DARK;
  ctx.textAlign = 'center';
  ctx.fillText(left.name, leftCx, curY);
  ctx.fillText(right.name, rightCx, curY);

  // Aliases
  curY += 30;
  if (left.alias || right.alias) {
    ctx.font = '19px "PingFang SC"';
    ctx.fillStyle = INK_LIGHT;
    if (left.alias) ctx.fillText(`"${left.alias}"`, leftCx, curY);
    if (right.alias) ctx.fillText(`"${right.alias}"`, rightCx, curY);
    curY += 26;
  }

  // ── 4. Tags ──
  curY += 6;
  const colMaxW = W / 2 - 50;
  const leftTagH = drawTags(ctx, left.tags || [], leftCx, curY, colMaxW);
  const rightTagH = drawTags(ctx, right.tags || [], rightCx, curY, colMaxW);
  const tagRowH = Math.max(leftTagH, rightTagH);
  if (tagRowH > 0) curY += tagRowH + 14;

  // ── 5. Comparison grid (dark text on light area) ──
  curY += 8;
  const rows = [
    { label: '修为', left: left.cultivation || '—', right: right.cultivation || '—' },
    { label: '势力', left: left.faction || '—', right: right.faction || '—' },
    { label: '功法', left: left.techniquesCount ? `${left.techniquesCount}式` : '—', right: right.techniquesCount ? `${right.techniquesCount}式` : '—' },
    { label: '语录', left: left.quotesCount ? `${left.quotesCount}句` : '—', right: right.quotesCount ? `${right.quotesCount}句` : '—' },
    { label: '关系', left: `${left.relationCount}条`, right: `${right.relationCount}条` },
  ];

  const rowH = 38;
  const gridX = 70;
  const gridW = W - 140;
  const labelColW = 80;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Alternating row bg
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(201,169,98,0.06)';
      roundRectPath(ctx, gridX, curY, gridW, rowH, 3);
      ctx.fill();
    }

    // Divider
    ctx.fillStyle = 'rgba(201,169,98,0.15)';
    ctx.fillRect(gridX + 10, curY, gridW - 20, 0.5);

    const textY = curY + rowH / 2 + 6;

    // Label (gold)
    ctx.font = '19px "PingFang SC"';
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center';
    ctx.fillText(row.label, W / 2, textY);

    // Values (dark)
    ctx.font = '20px "PingFang SC"';
    ctx.fillStyle = INK_MAIN;
    const leftColCx = gridX + (gridW / 2 - labelColW / 2) / 2;
    const rightColCx = W - gridX - (gridW / 2 - labelColW / 2) / 2;
    const maxValW = gridW / 2 - labelColW / 2 - 16;

    ctx.fillText(truncate(ctx, row.left, maxValW), leftColCx, textY);
    ctx.fillText(truncate(ctx, row.right, maxValW), rightColCx, textY);

    curY += rowH;
  }

  // Bottom grid line
  ctx.fillStyle = 'rgba(201,169,98,0.15)';
  ctx.fillRect(gridX + 10, curY, gridW - 20, 0.5);

  // ── 6. Mutual relations ──
  const mutuals = left.mutualRelations || [];
  if (mutuals.length > 0) {
    curY += 20;
    ctx.font = '17px "PingFang SC"';
    ctx.fillStyle = INK_MED;
    ctx.textAlign = 'center';
    let mutualText = '共同关系人: ' + mutuals.slice(0, 5).join('、');
    if (mutuals.length > 5) mutualText += ` 等${mutuals.length}人`;
    mutualText = truncate(ctx, mutualText, W - 140);
    ctx.fillText(mutualText, W / 2, curY);
    curY += 8;
  }

  // ── 7. Quotes (transition to dark area — use lighter colors) ──
  curY += 18;
  // Divider
  ctx.fillStyle = 'rgba(201,169,98,0.2)';
  ctx.fillRect(gridX + 10, curY, gridW - 20, 0.5);
  curY += 20;

  // Label
  ctx.font = '19px "PingFang SC"';
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.fillText('代表金句', W / 2, curY);
  curY += 22;

  // Quote text
  ctx.font = '18px "Songti SC", serif';
  ctx.fillStyle = INK_MAIN;

  if (left.quote) {
    const lines = wrapText(ctx, `「${left.quote}」`, 260, 3);
    lines.forEach((l, i) => ctx.fillText(l, leftCx, curY + i * 26));
  }
  if (right.quote) {
    const lines = wrapText(ctx, `「${right.quote}」`, 260, 3);
    lines.forEach((l, i) => ctx.fillText(l, rightCx, curY + i * 26));
  }

  // ── 8. QR Footer ──
  await drawQRFooter(ctx, canvas, W, H);

  return exportCanvas(canvas, W, H, dpr);
}
