import Taro from '@tarojs/taro';

export interface QuoteCardData {
  content: string;
  author: string;
}

const QRCODE_PATH = '/assets/images/qrcode.png';
const W = 750;
const H = 1000;

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

export async function generateQuoteCard(
  canvas: any, data: QuoteCardData, bgUrl: string, pixelRatio: number
): Promise<string> {
  const dpr = pixelRatio;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // ── 1. Background image ──
  try {
    const bgImg = await loadImage(canvas, bgUrl);
    const natW = bgImg.width;
    const natH = bgImg.height;
    const scale = Math.max(W / natW, H / natH);
    const dw = natW * scale;
    const dh = natH * scale;
    ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } catch {
    // Warm paper fallback
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#f7f6f2');
    bg.addColorStop(1, '#ece8df');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. Light warm overlay (ink-wash paper feel) ──
  ctx.fillStyle = 'rgba(247,246,242,0.88)';
  ctx.fillRect(0, 0, W, H);

  // ── 3. Quote mark (top center) ──
  ctx.font = '140px serif';
  ctx.fillStyle = 'rgba(147,197,253,0.35)';
  ctx.textAlign = 'center';
  ctx.fillText('\u201C', W / 2, 240);

  // ── 4. Quote text (centered, dark ink) ──
  ctx.font = '38px "Songti SC", "PingFang SC", serif';
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'center';

  const maxW = 560;
  const lineH = 64;

  const chars = data.content.split('');
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

  const maxLines = 8;
  const drawLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    drawLines[maxLines - 1] = drawLines[maxLines - 1].slice(0, -1) + '…';
  }

  // Vertically center the quote block
  const textBlockH = drawLines.length * lineH;
  const textStartY = Math.max(300, (H - 150 - textBlockH) / 2);

  drawLines.forEach((l, i) => {
    ctx.fillText(l, W / 2, textStartY + i * lineH);
  });

  // ── 5. Author line (centered) ──
  const authorY = textStartY + textBlockH + 40;

  // Accent line
  ctx.fillStyle = '#485a6c';
  ctx.fillRect(W / 2 - 25, authorY, 50, 4);

  // Author name
  ctx.font = '28px "PingFang SC", sans-serif';
  ctx.fillStyle = '#485a6c';
  ctx.textAlign = 'center';
  ctx.fillText(data.author, W / 2, authorY + 40);

  // ── 6. Footer: QR code + brand ──
  const footerY = H - 150;

  // Subtle divider
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(80, footerY - 20, W - 160, 1);

  // QR code
  const qrSize = 100;
  const qrX = W / 2 - 140;
  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, qrX, footerY, qrSize, qrSize, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  roundRectPath(ctx, qrX, footerY, qrSize, qrSize, 8);
  ctx.stroke();

  try {
    const qrImg = await loadImage(canvas, QRCODE_PATH);
    ctx.save();
    roundRectPath(ctx, qrX + 4, footerY + 4, qrSize - 8, qrSize - 8, 6);
    ctx.clip();
    ctx.drawImage(qrImg, qrX + 4, footerY + 4, qrSize - 8, qrSize - 8);
    ctx.restore();
  } catch {}

  // Brand text
  const brandX = qrX + qrSize + 20;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#999999';
  ctx.font = '20px "PingFang SC", sans-serif';
  ctx.fillText('长按识别小程序码', brandX, footerY + 28);

  ctx.fillStyle = '#333333';
  ctx.font = 'bold 30px "PingFang SC", "Songti SC", serif';
  ctx.fillText('剑来光阴', brandX, footerY + 66);

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
