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
import {
  Carreira, Discurso, FichaSenador, GastosAno, Proposicao, ResumoVotacoes, TIPOS_PROPOSICAO,
  anoLegislatura, carreiraCamara, contagemProposicoes, discursosDe, fichaSenador, gastosDoAno, idade, proposicoesDe, votacoesDe,
} from '../../core/ficha-politico';
import { compartilharCartao } from '../../shared/cartao-compartilhar';
import { Avatar, Campo, FonteDado, Icone } from '../../shared/componentes';
import { ProjetoAcoes } from '../../shared/projeto-acoes';

type Aba = 'geral' | 'projetos' | 'votacoes' | 'gastos' | 'discursos' | 'carreira';

@Component({
  selector: 'app-perfil-politico',
  imports: [RouterLink, FormsModule, DatePipe, CurrencyPipe, DecimalPipe, Avatar, Campo, FonteDado, Icone, ProjetoAcoes],
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

  // ---------------- Abas da ficha ----------------
  protected readonly aba = signal<Aba>('geral');
  protected readonly abas = computed<{ id: Aba; nome: string; icone: string }[]>(() => [
    { id: 'geral', nome: 'Visão geral', icone: 'badge' },
    { id: 'projetos', nome: 'Projetos', icone: 'description' },
    { id: 'votacoes', nome: 'Votações', icone: 'how_to_vote' },
    ...(this.casa() !== 'senado' ? [{ id: 'gastos' as Aba, nome: 'Gastos', icone: 'payments' }] : []),
    { id: 'discursos', nome: 'Discursos', icone: 'record_voice_over' },
    { id: 'carreira', nome: 'Carreira', icone: 'timeline' },
  ]);
  protected readonly idade = idade;
  protected readonly anoLegislatura = anoLegislatura;
  protected readonly tiposProposicao = TIPOS_PROPOSICAO;

  protected readonly carreira = signal<Carreira | null>(null);
  protected readonly senador = signal<FichaSenador | null>(null);
  protected readonly carregandoFicha = signal(true);

  protected readonly contagem = signal<{ sigla: string; nome: string; total: number }[] | null>(null);
  protected readonly projetos = signal<Proposicao[]>([]);
  protected readonly totalProjetos = signal(0);
  protected readonly paginaProjetos = signal(1);
  protected readonly tipoProjeto = signal('');
  protected readonly carregandoProjetos = signal(false);
  protected readonly erroProjetos = signal(false);

  protected readonly votacoes = signal<ResumoVotacoes | null>(null);
  protected readonly carregandoVotacoes = signal(false);
  protected readonly erroVotacoes = signal(false);

  protected readonly anosGastos = [0, 1, 2, 3].map((n) => new Date().getFullYear() - n);
  protected readonly anoGastos = signal(new Date().getFullYear());
  protected readonly gastos = signal<GastosAno | null>(null);
  protected readonly carregandoGastos = signal(false);
  protected readonly erroGastos = signal(false);
  protected readonly meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  protected readonly maiorMes = computed(() => Math.max(1, ...(this.gastos()?.porMes ?? [1])));
  protected readonly maiorTipo = computed(() => this.gastos()?.porTipo[0]?.valor || 1);

  protected readonly discursos = signal<Discurso[]>([]);
  protected readonly totalDiscursos = signal(0);
  protected readonly paginaDiscursos = signal(1);
  protected readonly carregandoDiscursos = signal(false);
  protected readonly erroDiscursos = signal(false);
  protected readonly discursoAberto = signal<number | null>(null);

  private carregadas = new Set<Aba>();

  protected abrirAba(a: Aba) {
    this.aba.set(a);
    if (this.carregadas.has(a)) return;
    this.carregadas.add(a);
    if (this.casa() === 'senado') return; // a ficha do Senado vem toda de uma vez
    if (a === 'projetos') this.carregarProjetos();
    if (a === 'votacoes') this.carregarVotacoes();
    if (a === 'gastos') this.carregarGastos();
    if (a === 'discursos') this.carregarDiscursos();
  }

  protected async carregarProjetos(pagina = 1) {
    const id = Number(this.id());
    this.carregandoProjetos.set(true);
    this.erroProjetos.set(false);
    if (!this.contagem()) contagemProposicoes(id).then((c) => this.contagem.set(c)).catch(() => this.contagem.set([]));
    try {
      const r = await proposicoesDe(id, pagina, this.tipoProjeto());
      this.projetos.set(r.itens);
      this.totalProjetos.set(r.total);
      this.paginaProjetos.set(pagina);
    } catch {
      this.erroProjetos.set(true);
    } finally {
      this.carregandoProjetos.set(false);
    }
  }

  protected filtrarProjetos(tipo: string) {
    this.tipoProjeto.set(this.tipoProjeto() === tipo ? '' : tipo);
    this.carregarProjetos(1);
  }

  protected async carregarVotacoes() {
    this.carregandoVotacoes.set(true);
    this.erroVotacoes.set(false);
    try {
      this.votacoes.set(await votacoesDe(Number(this.id()), this.politico()?.partido));
    } catch {
      this.erroVotacoes.set(true);
    } finally {
      this.carregandoVotacoes.set(false);
    }
  }

  protected async carregarGastos(ano = this.anoGastos()) {
    this.anoGastos.set(ano);
    this.carregandoGastos.set(true);
    this.erroGastos.set(false);
    try {
      this.gastos.set(await gastosDoAno(Number(this.id()), ano));
    } catch {
      this.erroGastos.set(true);
    } finally {
      this.carregandoGastos.set(false);
    }
  }

  protected async carregarDiscursos(pagina = 1) {
    this.carregandoDiscursos.set(true);
    this.erroDiscursos.set(false);
    try {
      const r = await discursosDe(Number(this.id()), pagina);
      this.discursos.set(r.itens);
      this.totalDiscursos.set(r.total);
      this.paginaDiscursos.set(pagina);
      this.discursoAberto.set(null);
    } catch {
      this.erroDiscursos.set(true);
    } finally {
      this.carregandoDiscursos.set(false);
    }
  }

  protected classeVoto(v: string): string {
    if (/^sim/i.test(v)) return 'voto-sim';
    if (/^n[ãa]o$/i.test(v)) return 'voto-nao';
    if (/não votou|ausente|^ap$|^ncom/i.test(v)) return 'voto-ausente';
    return 'voto-outro';
  }

  /** Frase de resumo montada só com dados oficiais. */
  protected readonly resumo = computed(() => {
    const p = this.politico();
    if (!p) return '';
    const sen = this.casa() === 'senado';
    const sexo = sen ? this.senador()?.sexo : this.carreira()?.sexo;
    const nasc = sen ? this.senador()?.nascimento : this.carreira()?.nascimento ?? p.data_nascimento;
    const anos = idade(nasc);
    const cargo = sen ? (sexo === 'F' ? 'senadora' : sexo === 'M' ? 'senador' : 'senador(a)') : sexo === 'F' ? 'deputada federal' : sexo === 'M' ? 'deputado federal' : 'deputado(a) federal';
    const partes = [`${p.nome}${anos ? `, ${anos} anos,` : ''} é ${cargo}${p.partido ? ` pelo ${p.partido}` : ''}${p.uf ? ` (${p.uf})` : ''}.`];
    if (!sen) {
      const leg = this.carreira()?.legislaturas.length;
      if (leg) partes.push(leg === 1 ? 'Está no primeiro mandato na Câmara.' : `Está no ${leg}º mandato na Câmara.`);
      const tot = this.detalhes()?.totalProposicoes;
      if (tot != null) partes.push(`Apresentou ${tot} proposições nesta legislatura`);
      const g = this.detalhes()?.despesas;
      if (g) partes[partes.length - 1] += `${tot != null ? ' e' : 'Nesta legislatura'} usou ${g.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} da cota parlamentar em ${g.ano}${g.parcial ? ' (parcial)' : ''}.`;
      else if (tot != null) partes[partes.length - 1] += '.';
      const prt = this.carreira()?.partidos.length ?? 0;
      if (prt > 1) partes.push(`Já passou por ${prt} partidos desde que chegou à Câmara.`);
    } else {
      const s = this.senador();
      if (s?.mandatos.length) partes.push(s.mandatos.length === 1 ? 'Está no primeiro mandato no Senado.' : `Tem ${s.mandatos.length} mandatos no Senado.`);
      if (s?.comissoes.length) partes.push(s.comissoes.length === 1 ? "Participa de 1 comissão." : `Participa de ${s.comissoes.length} comissões.`);
    }
    return partes.join(' ');
  });

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
      fichaSenador(id).then((f) => this.senador.set(f)).catch(() => this.senador.set(null)).finally(() => this.carregandoFicha.set(false));
    } else {
      carreiraCamara(id).then((c) => this.carreira.set(c)).catch(() => this.carreira.set(null)).finally(() => this.carregandoFicha.set(false));
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
