import QRCodeStyling, { type Options as QRStylingOptions } from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import type { ExportFormat, QRLogoShape, QRStyleConfig } from '../types/qr';

function mapCornerSquare(val: QRStyleConfig['cornerSquare']): 'square' | 'extra-rounded' | 'dot' {
  if (val === 'rounded') return 'extra-rounded';
  return val;
}

function mapCornerDot(val: QRStyleConfig['cornerDot']): 'square' | 'dot' {
  if (val === 'rounded') return 'dot';
  return val;
}

async function prepareLogoDataUrl(
  dataUrl: string,
  shape: QRLogoShape,
  bgColor: string
): Promise<string> {
  if (shape === 'square' && (!bgColor || bgColor === 'transparent')) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const dim = 256;
      const canvas = document.createElement('canvas');
      canvas.width = dim;
      canvas.height = dim;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      const radius = shape === 'circle' ? dim / 2 : shape === 'rounded' ? 40 : 0;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(0, 0, dim, dim, radius);
      ctx.clip();

      if (bgColor && bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, dim, dim);
      }

      const pad = Math.round(dim * 0.08);
      const maxDraw = dim - pad * 2;
      const scale = Math.min(maxDraw / img.width, maxDraw / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      ctx.drawImage(img, (dim - drawW) / 2, (dim - drawH) / 2, drawW, drawH);
      ctx.restore();
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function buildQRStylingOptions(
  data: string,
  style: QRStyleConfig,
  override?: {
    size?: number;
    transparent?: boolean;
  }
): Promise<QRStylingOptions> {
  const effectiveSize = override?.size ?? style.size;
  const isTransparent = override?.transparent ?? style.transparentBackground;
  const effectiveErrorCorrection =
    style.logoDataUrl && (style.errorCorrection === 'L' || style.errorCorrection === 'M')
      ? 'Q'
      : style.errorCorrection;

  const processedLogo = style.logoDataUrl
    ? await prepareLogoDataUrl(style.logoDataUrl, style.logoShape, style.logoBackgroundColor)
    : undefined;

  const gradient = style.useGradient
    ? {
        type: style.gradientType,
        rotation: (style.gradientRotation * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: style.gradientColor1 },
          { offset: 1, color: style.gradientColor2 },
        ],
      }
    : undefined;

  return {
    width: effectiveSize,
    height: effectiveSize,
    type: 'canvas',
    data: data || 'https://example.com',
    margin: style.margin + style.quietZone,
    qrOptions: {
      typeNumber: 0,
      mode: 'Byte',
      errorCorrectionLevel: effectiveErrorCorrection,
    },
    image: processedLogo,
    imageOptions: {
      hideBackgroundDots: style.logoHideBackgroundDots,
      imageSize: style.logoSize,
      margin: style.logoMargin,
      crossOrigin: 'anonymous',
    },
    dotsOptions: {
      type: style.pattern,
      color: style.foregroundColor,
      gradient,
    },
    cornersSquareOptions: {
      type: mapCornerSquare(style.cornerSquare),
      color: style.useGradient ? style.gradientColor1 : style.foregroundColor,
    },
    cornersDotOptions: {
      type: mapCornerDot(style.cornerDot),
      color: style.useGradient ? style.gradientColor2 : style.foregroundColor,
    },
    backgroundOptions: {
      color: isTransparent ? 'transparent' : style.backgroundColor,
    },
  };
}

function resolveFrameFontFamily(font: QRStyleConfig['frameFont']): string {
  switch (font) {
    case 'mono':
      return "'JetBrains Mono', monospace";
    case 'jakarta':
      return "'Plus Jakarta Sans', sans-serif";
    default:
      return "'Manrope', sans-serif";
  }
}

export function getResolvedFrameCaption(style: QRStyleConfig): string {
  switch (style.frameType) {
    case 'scan-me':
      return 'SCAN ME';
    case 'scan-here':
      return 'SCAN HERE';
    case 'scan-to-open':
      return 'SCAN TO OPEN';
    case 'custom':
      return style.frameCaption.trim() || 'SCAN ME';
    default:
      return '';
  }
}

export async function renderCompositeQRCanvas(
  data: string,
  style: QRStyleConfig,
  options?: {
    targetWidth?: number;
    transparent?: boolean;
  }
): Promise<HTMLCanvasElement> {
  const baseWidth = options?.targetWidth ?? style.size * style.resolution;
  const isTransparent = options?.transparent ?? style.transparentBackground;
  const hasFrame = style.frameType !== 'none';

  const qrSize = hasFrame ? Math.round(baseWidth * 0.84) : baseWidth;
  const qrOpts = await buildQRStylingOptions(data, style, {
    size: qrSize,
    transparent: isTransparent,
  });

  const qr = new QRCodeStyling(qrOpts);
  const rawBlob = await qr.getRawData('png');
  if (!rawBlob) {
    throw new Error('Failed to generate QR bitmap.');
  }

  const blobObj = rawBlob instanceof Blob ? rawBlob : new Blob([new Uint8Array(rawBlob as unknown as ArrayBuffer)], { type: 'image/png' });
  const imgUrl = URL.createObjectURL(blobObj);

  try {
    const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode generated QR image.'));
      img.src = imgUrl;
    });

    const canvas = document.createElement('canvas');
    if (!hasFrame) {
      canvas.width = baseWidth;
      canvas.height = baseWidth;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable.');
      if (!isTransparent) {
        ctx.fillStyle = style.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(qrImg, 0, 0, baseWidth, baseWidth);
      return canvas;
    }

    const pad = Math.round(baseWidth * 0.08);
    const captionBarH = Math.round(baseWidth * 0.17);
    const totalW = qrSize + pad * 2;
    const totalH = qrSize + pad * 2 + captionBarH;
    canvas.width = totalW;
    canvas.height = totalH;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');

    const outerRadius = Math.round(totalW * 0.055);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, totalW, totalH, outerRadius);
    ctx.clip();

    // Frame shell
    ctx.fillStyle = style.frameColor || '#101525';
    ctx.fillRect(0, 0, totalW, totalH);

    // Inner QR card
    const innerRadius = Math.round(outerRadius * 0.65);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, pad, qrSize, qrSize, innerRadius);
    ctx.clip();
    if (!isTransparent) {
      ctx.fillStyle = style.backgroundColor;
      ctx.fillRect(pad, pad, qrSize, qrSize);
    }
    ctx.drawImage(qrImg, pad, pad, qrSize, qrSize);
    ctx.restore();

    // Frame caption
    const caption = getResolvedFrameCaption(style);
    ctx.fillStyle = style.frameCaptionColor || '#FFFFFF';
    const fontSize = Math.max(14, Math.round(captionBarH * 0.44));
    ctx.font = `700 ${fontSize}px ${resolveFrameFontFamily(style.frameFont)}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(caption, totalW / 2, pad + qrSize + (captionBarH + pad) / 2 - pad * 0.35);
    ctx.restore();

    return canvas;
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

export async function renderQRToSvgString(
  data: string,
  style: QRStyleConfig,
  override?: { size?: number; transparent?: boolean }
): Promise<string> {
  const opts = await buildQRStylingOptions(data, style, override);
  const svgQr = new QRCodeStyling({
    ...opts,
    type: 'svg',
  });
  const raw = await svgQr.getRawData('svg');
  if (!raw) throw new Error('Failed to generate SVG data.');
  if (raw instanceof Blob) {
    return await raw.text();
  }
  return new TextDecoder().decode(raw as unknown as ArrayBuffer);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportQRCode(params: {
  data: string;
  style: QRStyleConfig;
  format: ExportFormat;
  filename: string;
  width: number;
  quality: number;
  transparent?: boolean;
}): Promise<void> {
  const safeName = (params.filename || 'qr-code').replace(/[^a-zA-Z0-9_-]/g, '-');

  if (params.format === 'svg') {
    const svgText = await renderQRToSvgString(params.data, params.style, {
      size: params.width,
      transparent: params.transparent ?? params.style.transparentBackground,
    });
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    triggerBlobDownload(blob, `${safeName}.svg`);
    return;
  }

  const targetSize = params.format === 'png-hd' ? Math.max(params.width, 2048) : params.width;
  const transparent =
    params.format === 'png-transparent'
      ? true
      : params.format === 'jpg'
      ? false
      : params.transparent ?? params.style.transparentBackground;

  const canvas = await renderCompositeQRCanvas(params.data, params.style, {
    targetWidth: targetSize,
    transparent,
  });

  if (params.format === 'pdf') {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const drawSize = 110;
    const x = (pageW - drawSize) / 2;
    const aspectRatio = canvas.height / canvas.width;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(params.filename || 'QR Code', pageW / 2, 32, { align: 'center' });
    pdf.addImage(imgData, 'PNG', x, 46, drawSize, drawSize * aspectRatio);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    const truncated = params.data.length > 90 ? params.data.slice(0, 87) + '...' : params.data;
    pdf.text(truncated, pageW / 2, 46 + drawSize * aspectRatio + 14, { align: 'center' });
    pdf.save(`${safeName}.pdf`);
    return;
  }

  const mimeType = params.format === 'jpg' ? 'image/jpeg' : 'image/png';
  const ext = params.format === 'jpg' ? 'jpg' : 'png';
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to export image blob.'))),
      mimeType,
      params.quality
    );
  });
  triggerBlobDownload(blob, `${safeName}.${ext}`);
}

export async function copyQRImageToClipboard(
  data: string,
  style: QRStyleConfig
): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard image copy is not supported in this browser.');
  }
  const canvas = await renderCompositeQRCanvas(data, style, {
    targetWidth: 1024,
    transparent: style.transparentBackground,
  });
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed.'))), 'image/png');
  });
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
