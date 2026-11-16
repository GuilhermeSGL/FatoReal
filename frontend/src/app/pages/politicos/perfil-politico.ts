import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertaJuridico, Politico, TipoAlerta } from '../../core/modelos';
import { AuthService } from '../../core/auth.service';
import { SeguidosService } from '../../core/seguidos.service';
import { AvisosService } from '../../core/avisos.service';
import { DetalhesPolitico, PoliticosService, adicionarAlerta, alertasDe, detalhesCamara, obterSenador, removerAlerta } from '../../core/politicos.service';
import { linkSeguro } from '../../core/util';
import { compartilharCartao } from '../../shared/cartao-compartilhar';
import { Avatar, Campo, FonteDado, Icone } from '../../shared/componentes';

@Component({
  selector: 'app-perfil-politico',
  imports: [RouterLink, FormsModule, DatePipe, CurrencyPipe, DecimalPipe, Avatar, Campo, FonteDado, Icone],
  templateUrl: './perfil-politico.html',
})
export class PerfilPoliticoPage implements OnInit {
  private service = inject(PoliticosService);
  /** Vem da URL /politicos/:id */
  readonly id = input.required<string>();
  /** Vem dos dados da rota: 'senado' em /politicos/senado/:id. */
  readonly casa = input<'camara' | 'senado'>('camara');
  protected readonly alertas = signal<AlertaJuridico[]>([]);
  protected readonly carregandoAlertas = signal(true);
  /** Onde qualquer pessoa pode consultar processos e sanções oficialmente. */
  protected readonly consultas = [
    { nome: 'STF: consulta de processos', url: 'https://portal.stf.jus.br/' },
    { nome: 'CNJ: condenações por improbidade', url: 'https://www.cnj.jus.br/improbidade_adm/consultar_requerido.php' },
    { nome: 'TSE: candidaturas e certidões', url: 'https://divulgacandcontas.tse.jus.br/' },
    { nome: 'Portal da Transparência: sanções (CEIS/CNEP)', url: 'https://portaldatransparencia.gov.br/sancoes' },
  ];
  protected readonly gravidade: Record<TipoAlerta, 'alta' | 'media' | 'neutra'> = {
    'Condenação': 'alta', 'Inelegibilidade': 'alta', 'Cassação': 'alta',
    'Processo em andamento': 'media', 'Investigação': 'media', 'Sanção administrativa': 'media', 'Polêmica': 'media',
    'Absolvição ou arquivamento': 'neutra',
  };
  protected readonly tipos = Object.keys(this.gravidade) as TipoAlerta[];
  protected auth = inject(AuthService);
  protected seguidos = inject(SeguidosService);

  protected alternarSeguir(p: Politico) {
    const sigo = this.seguidos.alternar(p);
    this.avisos.mostrar(sigo ? `Você agora segue ${p.nome}. Agora aparece em "Políticos que você segue", na página inicial.` : `Você deixou de seguir ${p.nome}.`);
  }
  private avisos = inject(AvisosService);
  protected readonly gerandoCartao = signal(false);

  protected async compartilhar(p: Politico) {
    this.gerandoCartao.set(true);
    try {
      const reg = this.alertas().filter((a) => a.tipo !== 'Absolvição ou arquivamento').length;
      const r = await compartilharCartao({
        rotulo: p.cargo ?? (this.casa() === 'senado' ? 'Senador(a)' : 'Deputado(a) Federal'),
        titulo: p.nome,
        subtitulo: [p.partido, p.uf].filter(Boolean).join(' · '),
        linhas: [reg ? `!${reg} registro(s) de polêmica ou na Justiça` : 'Nenhum registro na Justiça cadastrado', 'Veja o perfil completo no Fato Real'],
        foto: p.foto_url,
        fonte: this.casa() === 'senado' ? 'Senado Federal (dados abertos)' : 'Câmara dos Deputados (dados abertos)',
        nomeArquivo: `fatoreal-${p.nome.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`,
      });
      if (r === 'baixado') this.avisos.mostrar('Card baixado! Agora é só postar nas suas redes.');
    } catch (e) {
      this.avisos.erro(e);
    } finally {
      this.gerandoCartao.set(false);
    }
  }

  // Formulário da moderação ("Adicionar registro")
  protected readonly adicionando = signal(false);
  protected readonly salvando = signal(false);
  protected novo = this.registroVazio();

  private registroVazio() {
    return { tipo: 'Polêmica' as TipoAlerta, titulo: '', descricao: '', orgao: '', data: '', fonte_url: '' };
  }

  protected fonteValida(): boolean {
    return /^https:\/\/[^\s]+\.[^\s]+/.test(this.novo.fonte_url.trim());
  }

  protected async salvarRegistro() {
    const p = this.politico();
    if (!p || !this.fonteValida()) return;
    this.salvando.set(true);
    try {
      await adicionarAlerta(p, {
        tipo: this.novo.tipo, titulo: this.novo.titulo.trim(), descricao: this.novo.descricao.trim(),
        orgao: this.novo.orgao.trim(), data: this.novo.data || null, fonte_url: this.novo.fonte_url.trim(),
      });
      this.alertas.set(await alertasDe(p));
      this.novo = this.registroVazio();
      this.adicionando.set(false);
      this.avisos.mostrar('Registro adicionado.');
    } catch (e) {
      this.avisos.erro(e);
    } finally {
      this.salvando.set(false);
    }
  }

  protected async remover(a: AlertaJuridico) {
    const p = this.politico();
    if (!p || !confirm(`Remover o registro "${a.titulo}"?`)) return;
    try {
      await removerAlerta(p, a.id);
      this.alertas.set(await alertasDe(p));
    } catch (e) {
      this.avisos.erro(e);
    }
  }

  protected readonly politico = signal<Politico | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal('');
  /** Comissões, proposições, gastos e contato: carregam depois do perfil, sem travar a página. */
  protected readonly detalhes = signal<DetalhesPolitico | null>(null);
  protected readonly carregandoDetalhes = signal(true);
  protected readonly link = linkSeguro;

  protected readonly fonte = computed(() => {
    const p = this.politico();
    return p ? { titulo: p.casa === 'senado' ? 'Senado Federal' : 'Câmara dos Deputados', url: p.fonte_url, data: p.data_coleta } : null;
  });
  protected readonly fonteCamara = computed(() => ({
    titulo: 'Dados Abertos da Câmara',
    url: `https://dadosabertos.camara.leg.br/api/v2/deputados/${this.id()}`,
    data: new Date().toISOString(),
  }));
  protected readonly perguntaIa = computed(() => `O que se sabe sobre a atuação de ${this.politico()?.nome ?? ''}?`);
  protected readonly maiorGasto = computed(() => this.detalhes()?.despesas?.porTipo[0]?.valor || 1);
  protected readonly local = computed(() => {
    const g = this.detalhes()?.gabinete;
    if (!g?.sala) return null;
    return [`Sala ${g.sala}`, g.andar && `${g.andar}º andar`, g.predio && `Anexo ${g.predio}`].filter(Boolean).join(' · ');
  });

  async ngOnInit() {
    const id = Number(this.id());
    const senado = this.casa() === 'senado';
    if (senado) {
      this.carregandoDetalhes.set(false);
    } else {
      detalhesCamara(id)
        .then((d) => this.detalhes.set(d))
        .catch(() => this.detalhes.set(null))
        .finally(() => this.carregandoDetalhes.set(false));
    }
    try {
      const p = senado ? await obterSenador(id) : await this.service.obter(id);
      this.politico.set(p);
      if (p) alertasDe(p).then((a) => this.alertas.set(a)).finally(() => this.carregandoAlertas.set(false));
      else this.carregandoAlertas.set(false);
    } catch (e) {
      this.erro.set(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      this.carregando.set(false);
    }
  }
}
