/**
 * Rola um carrossel até a posição com duração fixa (padrão 420 ms, curva suave).
 * A rolagem "smooth" do navegador demora conforme a distância: voltar do último para o primeiro slide ficava lento.
 * Respeita quem prefere menos movimento (vai direto).
 */
export function rolarSuave(el: HTMLElement, destino: number, duracao = 420): void {
  const inicio = el.scrollLeft;
  const distancia = destino - inicio;
  if (!distancia) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.scrollLeft = destino;
    return;
  }
  const snap = el.style.scrollSnapType;
  el.style.scrollSnapType = 'none'; // o "encaixe" brigaria com a animação
  const t0 = performance.now();
  const curva = (t: number) => 1 - Math.pow(1 - t, 3); // começa rápido e desacelera no fim
  const passo = (agora: number) => {
    const t = Math.min(1, (agora - t0) / duracao);
    el.scrollLeft = inicio + distancia * curva(t);
    if (t < 1) requestAnimationFrame(passo);
    else el.style.scrollSnapType = snap;
  };
  requestAnimationFrame(passo);
}
