import Taro from '@tarojs/taro';

export const QRCODE_PATH = '/assets/images/qrcode.png';
export const CARD_TEMPLATE_PATH = '/assets/images/card-template.jpg';
export const GOLD = '#C9A962';

export function loadImage(canvas: any, src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage();
    img.onload = () => resolve(img);
    img.onerror = (e: any) => reject(e);
    img.src = src;
  });
}

export function roundRectPath(ctx: any, x: number, y: number, w: number, h: number, r: number) {
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

export function drawCorner(ctx: any, x: number, y: number, size: number, flipX: boolean, flipY: boolean) {
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

export function setShadow(ctx: any, blur: number, color: string, ox = 0, oy = 0) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = ox;
  ctx.shadowOffsetY = oy;
}

export function clearShadow(ctx: any) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/** Word-wrap text, returns array of lines */
export function wrapText(ctx: any, text: string, maxWidth: number, maxLines: number): string[] {
  const chars = text.split('');
  let line = '';
  const lines: string[] = [];
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const drawLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    drawLines[maxLines - 1] = drawLines[maxLines - 1].slice(0, -1) + '…';
  }
  return drawLines;
}

/** Draw QR footer section */
export async function drawQRFooter(ctx: any, canvas: any, W: number, H: number) {
  const footerY = H - 164;
  const qrSize = 120;
  const qrX = W / 2 - 150;

  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, qrX, footerY, qrSize, qrSize, 8);
  ctx.fill();

  try {
    const qrImg = await loadImage(canvas, QRCODE_PATH);
    ctx.save();
    roundRectPath(ctx, qrX + 4, footerY + 4, qrSize - 8, qrSize - 8, 6);
    ctx.clip();
    ctx.drawImage(qrImg, qrX + 4, footerY + 4, qrSize - 8, qrSize - 8);
    ctx.restore();
  } catch {
    ctx.fillStyle = '#999';
    ctx.font = '16px "PingFang SC"';
    ctx.textAlign = 'center';
    ctx.fillText('小程序码', qrX + qrSize / 2, footerY + qrSize / 2 + 6);
  }

  const brandX = W / 2 - 10;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#999999';
  ctx.font = '20px "PingFang SC", sans-serif';
  ctx.fillText('长按识别小程序码', brandX, footerY + 28);

  ctx.fillStyle = GOLD;
  ctx.font = 'bold 32px "PingFang SC", "Songti SC", serif';
  ctx.fillText('剑来光阴', brandX, footerY + 68);
}

/** Export canvas to temp file */
export function exportCanvas(canvas: any, W: number, H: number, dpr: number): Promise<string> {
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
