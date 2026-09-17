import {
  loadImage, roundRectPath, drawCorner, setShadow, clearShadow,
  wrapText, drawQRFooter, exportCanvas, CARD_TEMPLATE_PATH, GOLD
} from './cardUtils';

export interface ItemCardData {
  name: string;
  grade: string;
  type?: string;
  owner?: string;
  description: string;
  icon?: string | null;
}

const W = 750;
const H = 1100;

// 品级颜色映射
const GRADE_COLORS: Record<string, string> = {
  '神器': '#FFD700',
  '仙兵': '#E8C547',
  '半仙兵': '#C9A962',
  '法宝': '#8B6914',
  '灵器': '#6B8E23',
};

export async function generateItemCard(
  canvas: any, data: ItemCardData, pixelRatio: number
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

  // ── 3. Item image (300x300) ──
  const imgSize = 300;
  const imgX = (W - imgSize) / 2;
  const imgY = 80;
  const gradeColor = GRADE_COLORS[data.grade] || GOLD;

  // Gold/grade border
  ctx.strokeStyle = gradeColor;
  ctx.lineWidth = 4;
  roundRectPath(ctx, imgX, imgY, imgSize, imgSize, 8);
  ctx.stroke();

  if (data.icon) {
    try {
      const itemImg = await loadImage(canvas, data.icon);
      ctx.save();
      roundRectPath(ctx, imgX + 2, imgY + 2, imgSize - 4, imgSize - 4, 6);
      ctx.clip();
      const natW = itemImg.width;
      const natH = itemImg.height;
      const scale = Math.max(imgSize / natW, imgSize / natH);
      const dw = natW * scale;
      const dh = natH * scale;
      ctx.drawImage(itemImg, imgX + (imgSize - dw) / 2, imgY + (imgSize - dh) / 2, dw, dh);
      ctx.restore();
    } catch {
      drawGradientFallback(ctx, imgX, imgY, imgSize, gradeColor, data.name);
    }
  } else {
    drawGradientFallback(ctx, imgX, imgY, imgSize, gradeColor, data.name);
  }

  // ── 4. Name ──
  const infoStartY = imgY + imgSize + 60;
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

  // ── 6. Grade capsule ──
  let curY = infoStartY + 46;
  if (data.grade && data.grade !== '未知') {
    ctx.font = '22px "PingFang SC", sans-serif';
    const tw = ctx.measureText(data.grade).width;
    const pillW = tw + 40;
    const pillH = 44;
    const pillX = (W - pillW) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.67)';
    roundRectPath(ctx, pillX, curY, pillW, pillH, 4);
    ctx.fill();
    ctx.fillStyle = gradeColor;
    ctx.textAlign = 'center';
    ctx.fillText(data.grade, W / 2, curY + pillH / 2 + 8);
    curY += pillH + 16;
  }

  // ── 7. Owner capsule ──
  if (data.owner) {
    const ownerText = `持有者: ${data.owner}`;
    ctx.font = '24px "PingFang SC", sans-serif';
    const ow = ctx.measureText(ownerText).width + 40;
    const oH = 40;
    const oX = (W - ow) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRectPath(ctx, oX, curY, ow, oH, 4);
    ctx.fill();
    ctx.fillStyle = '#CCCCCC';
    ctx.textAlign = 'center';
    ctx.fillText(ownerText, W / 2, curY + oH / 2 + 8);
    curY += oH + 16;
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

function drawGradientFallback(ctx: any, x: number, y: number, size: number, color: string, name: string) {
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = grad;
  roundRectPath(ctx, x + 2, y + 2, size - 4, size - 4, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '80px "PingFang SC"';
  ctx.textAlign = 'center';
  ctx.fillText(name[0] || '?', x + size / 2, y + size / 2 + 28);
}
