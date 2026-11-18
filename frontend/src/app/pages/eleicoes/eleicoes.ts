import { Component, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/componentes';
import { ELEICAO_2028 } from '../../shared/destaque-lateral';
import { Faixa } from '../../shared/faixa';

const CF = 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm';
const LEI_ELEICOES = 'https://www.planalto.gov.br/ccivil_03/leis/l9504.htm';

/**
 * Área de Eleições: contagem para 2028, prazos e regras (só o que está na lei, com link),
 * como votar, cuidado com boatos e o Comparar.
 */
@Component({
  selector: 'app-eleicoes',
  imports: [RouterLink, Icone, Faixa],
  template: `
    <a routerLink="/politicos" class="link-voltar"><app-icone nome="arrow_back" /> Voltar para Políticos</a>
    <app-faixa sobretitulo="Eleições" icone="ballot" titulo="Eleições municipais de 2028"
      texto="Em 2028 a gente escolhe prefeito, vice-prefeito e vereadores. Aqui ficam a contagem, os prazos e tudo para votar bem informado."
      imagem="img/capa-eleicoes-e-voto.svg" fonte="Fontes: Constituição, Lei 9.504/1997 e TSE" [cores]="['#881337', '#be123c', '#fb7185']" />

    <section class="ele-contagem" aria-label="Contagem regressiva">
      <div class="ele-numeros">
        <span><strong>{{ tempo().dias }}</strong><small>dias</small></span>
        <span><strong>{{ tempo().horas }}</strong><small>horas</small></span>
        <span><strong>{{ tempo().minutos }}</strong><small>minutos</small></span>
      </div>
      <div class="ele-contagem-texto">
        <strong>para o 1º turno: domingo, 1º de outubro de 2028</strong>
        <span>O 2º turno (se houver, em cidades com mais de 200 mil eleitores) é no último domingo de outubro: 29 de outubro de 2028.</span>
        <a [href]="cf" target="_blank" rel="noopener noreferrer" class="ele-fonte"><app-icone nome="verified" /> Constituição, art. 29, II e art. 77</a>
      </div>
    </section>

    <div class="ele-grade">
      <a routerLink="/eleicoes/comparar" class="ele-cartao ele-comparar">
        <img src="img/capa-camara-e-senado-em-pauta.svg" alt="" />
        <span class="ele-cartao-texto">
          <span class="icone-tile" style="--cor:#be123c"><app-icone nome="compare_arrows" /></span>
          <strong>Comparar políticos</strong>
          <small>Coloque dois deputados lado a lado: projetos, comissões, gastos e registros na Justiça.</small>
          <span class="ele-acao">Comparar agora <app-icone nome="arrow_forward" /></span>
        </span>
      </a>

      <section class="card ele-bloco" style="--cor:#d97706">
        <h2><span class="icone-tile"><app-icone nome="event" /></span> Prazos importantes</h2>
        <ol class="ele-linha">
          <li><span class="ele-data">início de mai. 2028</span><span><strong>Último prazo para tirar ou transferir o título</strong><small>O cadastro fecha 150 dias antes da eleição. A data exata sai no calendário do TSE.</small>
            <a [href]="lei" target="_blank" rel="noopener noreferrer">Lei 9.504/1997, art. 91</a></span></li>
          <li><span class="ele-data">1º out. 2028</span><span><strong>1º turno</strong><small>Prefeito, vice e vereadores.</small></span></li>
          <li><span class="ele-data">29 out. 2028</span><span><strong>2º turno</strong><small>Só para prefeito, onde for preciso.</small></span></li>
        </ol>
      </section>

      <section class="card ele-bloco" style="--cor:#15803d">
        <h2><span class="icone-tile"><app-icone nome="how_to_vote" /></span> Quem vota</h2>
        <ul class="ele-quem">
          <li><strong>18 a 70 anos</strong><span class="ele-tag ele-tag-obr">obrigatório</span></li>
          <li><strong>16 e 17 anos</strong><span class="ele-tag">opcional</span></li>
          <li><strong>Mais de 70 anos</strong><span class="ele-tag">opcional</span></li>
          <li><strong>Quem não sabe ler</strong><span class="ele-tag">opcional</span></li>
        </ul>
        <a [href]="cf" target="_blank" rel="noopener noreferrer" class="ele-fonte"><app-icone nome="verified" /> Constituição, art. 14</a>
      </section>

      <section class="card ele-bloco ele-largo" style="--cor:#0369a1">
        <h2><span class="icone-tile"><app-icone nome="touch_app" /></span> Como votar, passo a passo</h2>
        <ol class="ele-passos">
          @for (p of passos; track p.titulo; let i = $index) {
            <li><span class="ele-passo-n">{{ i + 1 }}</span><app-icone [nome]="p.icone" /><strong>{{ p.titulo }}</strong><small>{{ p.texto }}</small></li>
          }
        </ol>
        <a href="https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral" target="_blank" rel="noopener noreferrer" class="ele-fonte"><app-icone nome="open_in_new" /> Título, local de votação e e-Título no site do TSE</a>
      </section>

      <section class="card ele-bloco ele-boato" style="--cor:#7c3aed">
        <h2><span class="icone-tile"><app-icone nome="report" /></span> Cuidado com boatos</h2>
        <p>Recebeu algo sobre a eleição no grupo da família? Antes de passar para frente, confira.</p>
        <div class="ele-botoes">
          <a routerLink="/fato-ou-fake" class="botao"><app-icone nome="fact_check" /> Verificar no Fato ou Fake</a>
          <a href="https://www.justicaeleitoral.jus.br/fato-ou-boato/" target="_blank" rel="noopener noreferrer" class="botao botao-fantasma"><app-icone nome="open_in_new" /> Fato ou Boato (TSE)</a>
        </div>
      </section>
    </div>
  `,
})
export class EleicoesPage implements OnDestroy {
  protected readonly cf = CF;
  protected readonly lei = LEI_ELEICOES;
  protected readonly passos = [
    { icone: 'badge', titulo: 'Leve um documento com foto', texto: 'RG, CNH ou o e-Título no celular (com foto).' },
    { icone: 'location_on', titulo: 'Vá à sua seção', texto: 'O local aparece no título e no app e-Título.' },
    { icone: 'dialpad', titulo: 'Digite o número', texto: 'Primeiro vereador (5 números), depois prefeito (2).' },
    { icone: 'check_circle', titulo: 'Confira e aperte Confirma', texto: 'A foto do candidato aparece na tela antes.' },
  ];
  protected readonly tempo = signal(this.calcular());
  private relogio = setInterval(() => this.tempo.set(this.calcular()), 30_000);

  private calcular() {
    const ms = Math.max(0, ELEICAO_2028.getTime() + 8 * 3600_000 - Date.now()); // urnas abrem às 8h
    return { dias: Math.floor(ms / 86_400_000), horas: Math.floor(ms / 3_600_000) % 24, minutos: Math.floor(ms / 60_000) % 60 };
  }

  ngOnDestroy() {
    clearInterval(this.relogio);
  }
}
