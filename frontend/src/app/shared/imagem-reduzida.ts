/** Reduz uma imagem enviada pela pessoa e devolve como data URL (JPEG), para guardar no perfil. */
export async function reduzirImagem(arquivo: File, largura: number, altura: number, cortar = true): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(arquivo.type)) throw new Error('Envie uma imagem PNG, JPG ou WEBP.');
  if (arquivo.size > 15 * 1024 * 1024) throw new Error('A imagem passa de 15 MB.');
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, erro) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => erro(new Error('Não foi possível abrir essa imagem.'));
      i.src = url;
    });
    const c = document.createElement('canvas');
    c.width = largura;
    c.height = altura;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, largura, altura);
    // "cover": preenche o espaço cortando as sobras, centralizado
    const escala = cortar ? Math.max(largura / img.width, altura / img.height) : Math.min(largura / img.width, altura / img.height);
    const w = img.width * escala;
    const h = img.height * escala;
    ctx.drawImage(img, (largura - w) / 2, (altura - h) / 2, w, h);
    return c.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
