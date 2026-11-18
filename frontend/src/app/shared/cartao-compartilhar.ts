/** Gera um card em imagem (PNG 1080x1080) para baixar ou compartilhar nas redes. */

export interface DadosCartao {
  /** Faixa de cima, ex.: "Deputado(a) Federal" ou "Checagem de informação". */
  rotulo: string;
  titulo: string;
  subtitulo?: string;
  /** Linhas de destaque, ex.: ["PL · SP", "12 registros na Justiça"]. */
  linhas?: string[];
  /** Selo colorido, ex.: o resultado da checagem. */
  selo?: { texto: string; cor: string };
  foto?: string | null;
  fonte?: string;
  nomeArquivo: string;
}

const W = 1080;

function carregarImagem(url: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const t = setTimeout(() => ok(null), 4000);
    img.onload = () => { clearTimeout(t); ok(img); };
    img.onerror = () => { clearTimeout(t); ok(null); };
    img.src = url;
  });
}

function quebrar(ctx: CanvasRenderingContext2D, texto: string, largura: number, maxLinhas: number): string[] {
  const palavras = texto.split(/\s+/);
  const linhas: string[] = [];
  let atual = '';
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > largura && atual) {
      linhas.push(atual);
      atual = p;
      if (linhas.length === maxLinhas) break;
    } else atual = teste;
  }
  if (linhas.length < maxLinhas && atual) linhas.push(atual);
  if (linhas.length === maxLinhas && palavras.join(' ').length > linhas.join(' ').length) {
    linhas[maxLinhas - 1] = linhas[maxLinhas - 1].replace(/\s*\S*$/, '') + '…';
  }
  return linhas;
}

async function desenhar(d: DadosCartao): Promise<HTMLCanvasElement> {
  const c = document.createElement('canvas');
  c.width = c.height = W;
  const ctx = c.getContext('2d')!;
  const fonte = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  // Fundo
  const g = ctx.createLinearGradient(0, 0, W, W);
  g.addColorStop(0, '#0b2a4a');
  g.addColorStop(1, '#0e6b4f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, W);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath(); ctx.arc(W - 120, 140, 260, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(80, W - 60, 200, 0, Math.PI * 2); ctx.fill();

  // Marca
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 44px ${fonte}`;
  ctx.fillText('Fato Real', 80, 120);
  ctx.font = `500 26px ${fonte}`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('Informação política com fonte', 80, 160);

  // Cartão branco
  const x = 60, y = 220, w = W - 120, h = 720;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 36); ctx.fill();

  let cy = y + 80;
  ctx.fillStyle = '#0e6b4f';
  ctx.font = `700 28px ${fonte}`;
  ctx.fillText(d.rotulo.toUpperCase(), x + 60, cy);
  cy += 30;

  // Foto (ou inicial)
  const foto = d.foto ? await carregarImagem(d.foto) : null;
  const tam = 200;
  if (foto || !d.selo) {
    const fx = x + 60, fy = cy + 20;
    ctx.save();
    ctx.beginPath(); ctx.arc(fx + tam / 2, fy + tam / 2, tam / 2, 0, Math.PI * 2); ctx.clip();
    if (foto) {
      const s = Math.min(foto.width, foto.height);
      ctx.drawImage(foto, (foto.width - s) / 2, (foto.height - s) / 4, s, s, fx, fy, tam, tam);
    } else {
      ctx.fillStyle = '#e3efe9'; ctx.fillRect(fx, fy, tam, tam);
      ctx.fillStyle = '#0e6b4f'; ctx.font = `800 96px ${fonte}`; ctx.textAlign = 'center';
      ctx.fillText(d.titulo.trim().charAt(0).toUpperCase(), fx + tam / 2, fy + tam / 2 + 34);
      ctx.textAlign = 'left';
    }
    ctx.restore();
    cy += tam + 90;
  } else cy += 40;

  if (d.selo) {
    ctx.font = `800 34px ${fonte}`;
    const lw = ctx.measureText(d.selo.texto).width + 60;
    ctx.fillStyle = d.selo.cor;
    ctx.beginPath(); ctx.roundRect(x + 60, cy - 46, lw, 64, 32); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(d.selo.texto, x + 90, cy - 2);
    cy += 80;
  }

  ctx.fillStyle = '#10202e';
  ctx.font = `800 ${d.selo ? 46 : 60}px ${fonte}`;
  for (const l of quebrar(ctx, d.titulo, w - 120, d.selo ? 4 : 2)) { ctx.fillText(l, x + 60, cy); cy += d.selo ? 58 : 70; }
  if (d.subtitulo) {
    ctx.fillStyle = '#4b5b68';
    ctx.font = `500 32px ${fonte}`;
    for (const l of quebrar(ctx, d.subtitulo, w - 120, 3)) { ctx.fillText(l, x + 60, cy); cy += 44; }
  }
  cy += 10;
  ctx.font = `700 34px ${fonte}`;
  for (const l of d.linhas ?? []) {
    if (cy > y + h - 40) break;
    ctx.fillStyle = l.startsWith('!') ? '#c0262d' : '#0b2a4a';
    ctx.fillText(l.replace(/^!/, ''), x + 60, cy);
    cy += 50;
  }

  // Rodapé
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `500 26px ${fonte}`;
  ctx.fillText(d.fonte ? `Fonte: ${d.fonte}` : 'Dados oficiais e abertos', 80, W - 70);
  return c;
}

/** Gera o card e abre o compartilhamento do celular; no computador, baixa a imagem. */
export async function compartilharCartao(d: DadosCartao): Promise<'compartilhado' | 'baixado'> {
  const canvas = await desenhar(d);
  let blob: Blob | null = null;
  try {
    blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'));
  } catch {
    // Foto de outro site sem CORS "suja" o canvas: redesenha sem foto.
    const limpo = await desenhar({ ...d, foto: null });
    blob = await new Promise<Blob | null>((ok) => limpo.toBlob(ok, 'image/png'));
  }
  if (!blob) throw new Error('Não foi possível gerar a imagem.');
  const arquivo = new File([blob], `${d.nomeArquivo}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: d.titulo, text: `${d.titulo} · Fato Real` });
      return 'compartilhado';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'compartilhado';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'baixado';
}
