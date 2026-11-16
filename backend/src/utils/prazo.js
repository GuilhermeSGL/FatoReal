// Limita o tempo de espera de uma promessa (J2). Se passar de `ms`, rejeita com `mensagem`.
// Obs.: a operação original não é cancelada; o resultado dela só é ignorado.
export function comPrazo(promessa, ms, mensagem = 'Tempo esgotado') {
  let timer;
  const limite = new Promise((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error(mensagem)), ms);
  });
  return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
}
