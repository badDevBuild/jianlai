import Taro from '@tarojs/taro';

export interface CardData {
  name: string;
  avatar: string;
  aliases: string[];
  cultivation: string;
  factions: string[];
  quote: string;
  tags: string[];
}

const TEMPLATE_PATH = '/assets/images/card-template.jpg';
const QRCODE_PATH = '/assets/images/qrcode.png';
const W = 750;
const H = 1100;
const GOLD = '#C9A962';

function loadImage(canvas: any, src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage();
    img.onload = () => resolve(img);
    img.onerror = (e: any) => reject(e);
    img.src = src;
  });
}

function roundRectPath(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Draw L-shaped corner decoration */
function drawCorner(ctx: any, x: number, y: number, size: number, flipX: boolean, flipY: boolean) {
  const dx = flipX ? -1 : 1;
  const dy = flipY ? -1 : 1;
  ctx.beginPath();
  ctx.moveTo(x, y + size * dy);
  ctx.lineTo(x, y);
  ctx.lineTo(x + size * dx, y);
  ctx.strokeStyle = 'rgba(201,169,98,0.19)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Set text shadow (Canvas only supports one at a time) */
function setShadow(ctx: any, blur: number, color: string, ox = 0, oy = 0) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = ox;
  ctx.shadowOffsetY = oy;
}

function clearShadow(ctx: any) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export async function generateCard(
  canvas: any, cardData: CardData, pixelRatio: number
): Promise<string> {
  const dpr = pixelRatio;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // ── 1. Background template ──
  try {
    const bgImg = await loadImage(canvas, TEMPLATE_PATH);
    ctx.drawImage(bgImg, 0, 0, W, H);
  } catch {
    // Gradient fallback mimicking the ink wash template
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
  const cs = 40; // corner arm size
  const cm = 32; // corner margin
  drawCorner(ctx, cm, cm, cs, false, false);           // top-left
  drawCorner(ctx, W - cm, cm, cs, true, false);        // top-right
  drawCorner(ctx, cm, H - cm, cs, false, true);        // bottom-left
  drawCorner(ctx, W - cm, H - cm, cs, true, true);     // bottom-right

  // ── 3. Avatar frame (light paper zone) ──
  const avatarW = 300;
  const avatarH = 380;
  const avatarX = (W - avatarW) / 2;
  const avatarY = 60;

  // Gold border
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  roundRectPath(ctx, avatarX, avatarY, avatarW, avatarH, 8);
  ctx.stroke();

  try {
    const avatarImg = await loadImage(canvas, cardData.avatar);
    ctx.save();
    roundRectPath(ctx, avatarX + 2, avatarY + 2, avatarW - 4, avatarH - 4, 6);
    ctx.clip();
    const natW = avatarImg.width;
    const natH = avatarImg.height;
    const scale = Math.max(avatarW / natW, avatarH / natH);
    const dw = natW * scale;
    const dh = natH * scale;
    ctx.drawImage(avatarImg, avatarX + (avatarW - dw) / 2, avatarY + (avatarH - dh) / 2, dw, dh);
    ctx.restore();
  } catch {
    // Fallback: cream bg + first character
    ctx.fillStyle = '#F5F0E8';
    roundRectPath(ctx, avatarX + 2, avatarY + 2, avatarW - 4, avatarH - 4, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(201,169,98,0.2)';
    ctx.font = '80px "PingFang SC"';
    ctx.textAlign = 'center';
    ctx.fillText(cardData.name[0] || '?', W / 2, avatarY + avatarH / 2 + 28);
  }

  // ── 4. Name (transition zone, uses strong shadow) ──
  const infoStartY = 550;
  ctx.textAlign = 'center';

  // Draw name with double shadow for readability on mixed bg
  ctx.font = 'bold 48px "PingFang SC", "Songti SC", serif';
  // First pass: wide glow
  setShadow(ctx, 24, 'rgba(0,0,0,0.87)');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(cardData.name, W / 2, infoStartY);
  // Second pass: tight shadow
  setShadow(ctx, 8, 'rgba(0,0,0,0.67)', 0, 4);
  ctx.fillText(cardData.name, W / 2, infoStartY);
  clearShadow(ctx);

  // ── 5. Gold divider ──
  ctx.fillStyle = 'rgba(201,169,98,0.5)';
  ctx.fillRect(W / 2 - 40, infoStartY + 18, 80, 4);

  // ── 6. Realm badge (dark pill + gold text) ──
  let curY = infoStartY + 46;
  if (cardData.cultivation) {
    ctx.font = '22px "PingFang SC", sans-serif';
    const realmText = cardData.cultivation;
    const tw = ctx.measureText(realmText).width;
    const pillW = tw + 40;
    const pillH = 44;
    const pillX = (W - pillW) / 2;

    // Dark semi-transparent background
    ctx.fillStyle = 'rgba(0,0,0,0.67)';
    roundRectPath(ctx, pillX, curY, pillW, pillH, 4);
    ctx.fill();

    // Gold text
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center';
    ctx.fillText(realmText, W / 2, curY + pillH / 2 + 8);
    curY += pillH + 16;
  }

  // ── 7. Faction (dark pill + gray text) ──
  if (cardData.factions.length > 0) {
    const facText = cardData.factions.slice(0, 2).join(' · ');
    ctx.font = '24px "PingFang SC", sans-serif';
    const facW = ctx.measureText(facText).width + 40;
    const facH = 40;
    const facX = (W - facW) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRectPath(ctx, facX, curY, facW, facH, 4);
    ctx.fill();
    ctx.fillStyle = '#CCCCCC';
    ctx.textAlign = 'center';
    ctx.fillText(facText, W / 2, curY + facH / 2 + 8);
    curY += facH + 16;
  }

  // ── 8. Quote (dark pill bg + light text) ──
  if (cardData.quote) {
    const quoteText = `「${cardData.quote}」`;
    ctx.font = '22px "PingFang SC", "Songti SC", serif';

    // Word wrap
    const maxW = 540;
    const chars = quoteText.split('');
    let line = '';
    const lines: string[] = [];
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineH = 36;
    const maxLines = 3;
    const drawLines = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      drawLines[maxLines - 1] = drawLines[maxLines - 1].slice(0, -1) + '…」';
    }

    // Dark background pill for quote
    const quoteBlockH = drawLines.length * lineH + 20;
    const quoteBlockW = 600;
    const quoteBlockX = (W - quoteBlockW) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRectPath(ctx, quoteBlockX, curY, quoteBlockW, quoteBlockH, 6);
    ctx.fill();

    // Quote text
    ctx.fillStyle = '#CCCCCC';
    ctx.textAlign = 'center';
    drawLines.forEach((l, i) => {
      ctx.fillText(l, W / 2, curY + 28 + i * lineH);
    });
    curY += quoteBlockH + 16;
  }

  // ── 9. Tags (gold pills) ──
  if (cardData.tags.length > 0) {
    ctx.font = '20px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    const tags = cardData.tags.slice(0, 5);
    const padX = 20;
    const tagH = 40;
    const gap = 16;

    const sizes = tags.map(t => ({ text: t, w: ctx.measureText(t).width + padX * 2 }));
    const totalW = sizes.reduce((s, t) => s + t.w, 0) + (sizes.length - 1) * gap;
    let tx = (W - totalW) / 2;

    sizes.forEach(tag => {
      // Faint gold background
      ctx.fillStyle = 'rgba(201,169,98,0.08)';
      roundRectPath(ctx, tx, curY, tag.w, tagH, 4);
      ctx.fill();

      // Gold text
      ctx.fillStyle = GOLD;
      ctx.fillText(tag.text, tx + tag.w / 2, curY + tagH / 2 + 7);
      tx += tag.w + gap;
    });
    curY += tagH + 20;
  }

  // ── 10. Footer: QR code + brand ──
  const footerY = H - 164;

  // QR code
  const qrSize = 120;
  const qrX = W / 2 - 150;
  const qrY = footerY;

  // White rounded bg for QR
  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, qrX, qrY, qrSize, qrSize, 8);
  ctx.fill();

  try {
    const qrImg = await loadImage(canvas, QRCODE_PATH);
    ctx.save();
    roundRectPath(ctx, qrX + 4, qrY + 4, qrSize - 8, qrSize - 8, 6);
    ctx.clip();
    ctx.drawImage(qrImg, qrX + 4, qrY + 4, qrSize - 8, qrSize - 8);
    ctx.restore();
  } catch {
    // Fallback text
    ctx.fillStyle = '#999';
    ctx.font = '16px "PingFang SC"';
    ctx.textAlign = 'center';
    ctx.fillText('小程序码', qrX + qrSize / 2, qrY + qrSize / 2 + 6);
  }

  // Brand text (right of QR)
  const brandX = W / 2 - 10;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#999999';
  ctx.font = '20px "PingFang SC", sans-serif';
  ctx.fillText('长按识别小程序码', brandX, qrY + 28);

  ctx.fillStyle = GOLD;
  ctx.font = 'bold 32px "PingFang SC", "Songti SC", serif';
  ctx.fillText('剑来光阴', brandX, qrY + 68);

  // ── Export ──
  return new Promise((resolve, reject) => {
    Taro.canvasToTempFilePath({
      canvas,
      x: 0, y: 0,
      width: W * dpr, height: H * dpr,
      destWidth: W * dpr, destHeight: H * dpr,
      fileType: 'jpg',
      quality: 0.92,
      success: (res) => resolve(res.tempFilePath),
      fail: (err) => reject(err),
    });
  });
}
