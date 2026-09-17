import {
  loadImage, roundRectPath, drawCorner, setShadow, clearShadow,
  wrapText, drawQRFooter, exportCanvas, CARD_TEMPLATE_PATH, GOLD
} from './cardUtils';

export interface FactionCardData {
  name: string;
  type?: string;
  description: string;
  members: string[];
  memberCount: number;
}

const W = 750;
const H = 1100;

export async function generateFactionCard(
  canvas: any, data: FactionCardData, pixelRatio: number
): Promise<string> {
  const dpr = pixelRatio;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // ── 1. Background ──
  try {
    const bgImg = await loadImage(canvas, CARD_TEMPLATE_PATH);
    ctx.drawImage(bgImg, 0, 0, W, H);
  } catch {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#EDE4D3');
    bg.addColorStop(0.35, '#E0D5C0');
    bg.addColorStop(0.42, '#8A7A65');
    bg.addColorStop(0.50, '#3A3025');
    bg.addColorStop(0.58, '#1A1510');
    bg.addColorStop(1, '#0D0B08');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. Corner decorations ──
  const cs = 40, cm = 32;
  drawCorner(ctx, cm, cm, cs, false, false);
  drawCorner(ctx, W - cm, cm, cs, true, false);
  drawCorner(ctx, cm, H - cm, cs, false, true);
  drawCorner(ctx, W - cm, H - cm, cs, true, true);

  // ── 3. Faction icon area (decorative circle) ──
  const iconSize = 200;
  const iconX = W / 2;
  const iconY = 180;

  // Decorative circle
  ctx.beginPath();
  ctx.arc(iconX, iconY, iconSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(201,169,98,0.08)';
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();

  // First character as icon
  ctx.fillStyle = GOLD;
  ctx.font = '72px "Songti SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.name[0] || '?', iconX, iconY + 26);

  // ── 4. Name ──
  const infoStartY = iconY + iconSize / 2 + 70;
  ctx.textAlign = 'center';
  ctx.font = 'bold 48px "PingFang SC", "Songti SC", serif';
  setShadow(ctx, 24, 'rgba(0,0,0,0.87)');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(data.name, W / 2, infoStartY);
  setShadow(ctx, 8, 'rgba(0,0,0,0.67)', 0, 4);
  ctx.fillText(data.name, W / 2, infoStartY);
  clearShadow(ctx);

  // ── 5. Gold divider ──
  ctx.fillStyle = 'rgba(201,169,98,0.5)';
  ctx.fillRect(W / 2 - 40, infoStartY + 18, 80, 4);

  // ── 6. Type tag ──
  let curY = infoStartY + 46;
  if (data.type) {
    ctx.font = '22px "PingFang SC", sans-serif';
    const tw = ctx.measureText(data.type).width;
    const pillW = tw + 40;
    const pillH = 44;
    const pillX = (W - pillW) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.67)';
    roundRectPath(ctx, pillX, curY, pillW, pillH, 4);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center';
    ctx.fillText(data.type, W / 2, curY + pillH / 2 + 8);
    curY += pillH + 16;
  }

  // ── 7. Members list (up to 5) ──
  const topMembers = data.members.slice(0, 5);
  if (topMembers.length > 0) {
    const memberText = topMembers.join(' · ');
    const suffix = data.memberCount > 5 ? ` 等${data.memberCount}人` : '';
    const fullText = memberText + suffix;
    ctx.font = '24px "PingFang SC", sans-serif';
    const mw = ctx.measureText(fullText).width + 40;
    const mH = 40;
    const mX = (W - Math.min(mw, 620)) / 2;
    const finalW = Math.min(mw, 620);

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRectPath(ctx, mX, curY, finalW, mH, 4);
    ctx.fill();
    ctx.fillStyle = '#CCCCCC';
    ctx.textAlign = 'center';

    // Truncate if too long
    let displayText = fullText;
    if (ctx.measureText(displayText).width > finalW - 40) {
      const shortMembers = topMembers.slice(0, 3).join(' · ');
      displayText = shortMembers + ` 等${data.memberCount}人`;
    }
    ctx.fillText(displayText, W / 2, curY + mH / 2 + 8);
    curY += mH + 16;
  }

  // ── 8. Description (3 lines) ──
  if (data.description) {
    ctx.font = '22px "PingFang SC", "Songti SC", serif';
    const lines = wrapText(ctx, data.description, 540, 3);
    const lineH = 36;
    const blockH = lines.length * lineH + 20;
    const blockW = 600;
    const blockX = (W - blockW) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRectPath(ctx, blockX, curY, blockW, blockH, 6);
    ctx.fill();

    ctx.fillStyle = '#CCCCCC';
    ctx.textAlign = 'center';
    lines.forEach((l, i) => {
      ctx.fillText(l, W / 2, curY + 28 + i * lineH);
    });
  }

  // ── 9. QR Footer ──
  await drawQRFooter(ctx, canvas, W, H);

  return exportCanvas(canvas, W, H, dpr);
}
