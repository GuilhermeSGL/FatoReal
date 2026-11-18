import { PerguntarFatobot } from '../../shared/fatobot-bolha';
import { SeloStatus, seloDoEstado } from '../../shared/selo-status';
import { HostListener, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { ComunidadesService } from '../../core/comunidades.service';
import { Comunidade, Publicacao } from '../../core/modelos';
import { linkSeguro, UFS } from '../../core/util';
import { termoDoDia } from '../../core/glossario';
import { Checagem, ChecagensService } from '../../core/checagens.service';
import { EstadoVerificacao } from '../../core/fatobot.service';
import { todosDoCargo } from '../../core/politicos.service';
import { modoDemo } from '../../core/supabase';
import { SeguidosService } from '../../core/seguidos.service';
import { Politico } from '../../core/modelos';
import { avatarComunidade, capaComunidade, CATEGORIAS, COR_TEMA, ICONE_TEMA } from '../../core/visual';
import { Avatar, Icone } from '../../shared/componentes';
import { PublicacaoCard } from '../../shared/publicacao-card';

interface Destaque {
  tag: string;
  imagem: string;
  titulo: string;
  texto: string;
  rota: string;
  acao: string;
  icone: string;
}

@Component({
  selector: 'app-inicio',
  imports: [FormsModule, RouterLink, Icone, Avatar, PublicacaoCard, SeloStatus, PerguntarFatobot],
  templateUrl: './inicio.html',
})
export class InicioPage implements OnInit {
  private comunidades = inject(ComunidadesService);
  private avisos = inject(AvisosService);
  private router = inject(Router);
  protected auth = inject(AuthService);

  private checagensService = inject(ChecagensService);
  protected seguidos = inject(SeguidosService);
  protected readonly categorias = CATEGORIAS;
  protected readonly ufs = UFS;
  protected readonly demo = modoDemo;
  protected readonly fatoDoDia = termoDoDia();
  protected readonly checagens = signal<Checagem[]>([]);

  // "Meus representantes": estado do perfil ou o escolhido aqui (salvo no navegador)
  protected readonly ufEscolhida = signal<string>(this.ufInicial());
  protected readonly deputadosUf = signal<Politico[]>([]);
  protected readonly senadoresUf = signal<Politico[]>([]);
  protected readonly carregandoRep = signal(false);
  protected readonly erroRep = signal(false);
  protected readonly iconeTema = ICONE_TEMA;
  protected readonly corTema = COR_TEMA;
  protected readonly avatarComunidade = avatarComunidade;
  protected readonly capaComunidade = capaComunidade;

  protected readonly destaques: Destaque[] = [
    {
      tag: 'Candidatos', icone: 'account_balance', imagem: 'img/destaque-congresso.svg', rota: '/politicos', acao: 'Pesquisar',
      titulo: 'Conheça quem representa você na Câmara',
      texto: 'Perfis de deputados federais com dados oficiais, fonte e data de cada informação.',
    },
    {
      tag: 'IA FatoBot', icone: 'smart_toy', imagem: 'img/destaque-bandeira.svg', rota: '/fatobot', acao: 'Perguntar',
      titulo: 'Tire dúvidas com respostas que mostram as fontes',
      texto: 'O FatoBot responde com base em documentos oficiais e avisa quando não há evidência.',
    },
    {
      tag: 'Comunidades', icone: 'groups', imagem: 'img/brasil-juntos.svg', rota: '/comunidades', acao: 'Participar',
      titulo: 'Debata política com respeito e com fatos',
      texto: 'Comunidades com regras claras, moderação humana e espaço para opiniões diferentes.',
    },
  ];
  protected readonly slide = signal(0);

  protected readonly categoria = signal<string>('Em Alta');
  protected readonly feedCompleto = signal<Publicacao[]>([]);
  protected readonly feed = computed(() => {
    const c = this.categoria();
    const lista = this.feedCompleto();
    if (c === 'Em Alta') return [...lista].sort((a, b) => b.total_curtidas + b.total_comentarios - (a.total_curtidas + a.total_comentarios));
    return lista.filter((p) => p.comunidade_tema === c);
  });
  protected readonly todas = signal<Comunidade[]>([]);
  protected readonly minhas = signal<Comunidade[]>([]);
  protected readonly destaquesComunidade = computed(() =>
    [...this.todas()].sort((a, b) => b.total_membros - a.total_membros).slice(0, 3),
  );
  protected readonly idsMinhas = computed(() => new Set(this.minhas().map((c) => c.id)));
  /** "Assuntos em alta": temas com mais publicações recentes (dado real do feed). */
  protected readonly assuntos = computed(() => {
    const cont = new Map<string, number>();
    for (const p of this.feedCompleto()) if (p.comunidade_tema) cont.set(p.comunidade_tema, (cont.get(p.comunidade_tema) ?? 0) + 1);
    return [...cont.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  });

  // Nova publicação
  protected texto = '';
  protected link = '';
  protected mostrarLink = false;
  protected comunidadeId: number | null = null;
  protected readonly publicando = signal(false);

  async ngOnInit() {
    this.checagensService.recentes(4).then((c) => this.checagens.set(c)).catch(() => {});
    if (this.ufEscolhida()) this.carregarRepresentantes();
    await this.carregar();
  }

  private ufInicial(): string {
    const doPerfil = this.auth.usuario()?.uf;
    if (doPerfil) return doPerfil;
    try {
      return localStorage.getItem('fatoreal-uf') ?? '';
    } catch {
      return '';
    }
  }

  @HostListener('window:fatoreal-uf', ['$event'])
  protected aoEscolherUfNaApresentacao(e: Event) {
    const uf = (e as CustomEvent<string>).detail;
    if (uf && !this.auth.usuario()?.uf) this.escolherUf(uf);
  }

  protected escolherUf(uf: string) {
    if (!uf) return;
    try {
      localStorage.setItem('fatoreal-uf', uf);
    } catch {
      /* sem localStorage */
    }
    this.ufEscolhida.set(uf);
    this.carregarRepresentantes();
  }

  protected trocarUf() {
    try {
      localStorage.removeItem('fatoreal-uf');
    } catch {
      /* sem localStorage */
    }
    this.ufEscolhida.set('');
  }

  private async carregarRepresentantes() {
    const uf = this.ufEscolhida();
    this.carregandoRep.set(true);
    this.erroRep.set(false);
    const [dep, sen] = await Promise.allSettled([todosDoCargo('Deputado(a) Federal'), todosDoCargo('Senador(a)')]);
    if (uf !== this.ufEscolhida()) return;
    this.deputadosUf.set(dep.status === 'fulfilled' ? dep.value.filter((p) => p.uf === uf) : []);
    this.senadoresUf.set(sen.status === 'fulfilled' ? sen.value.filter((p) => p.uf === uf) : []);
    this.erroRep.set(dep.status === 'rejected');
    this.carregandoRep.set(false);
  }

  protected seloDe(e: EstadoVerificacao) {
    return seloDoEstado(e);
  }

  private async carregar() {
    try {
      const [feed, todas, minhas] = await Promise.all([
        this.comunidades.feed(),
        this.comunidades.listar(),
        this.comunidades.minhas(),
      ]);
      this.feedCompleto.set(feed);
      this.todas.set(todas);
      this.minhas.set(minhas);
      if (this.comunidadeId === null && minhas.length) this.comunidadeId = minhas[0].id;
    } catch (e) {
      this.avisos.erro(e);
    }
  }

  protected async recarregarFeed() {
    this.feedCompleto.set(await this.comunidades.feed());
  }

  protected mudarSlide(passo: number) {
    const n = this.destaques.length;
    this.slide.update((s) => (s + passo + n) % n);
  }

  protected async participar(c: Comunidade) {
    if (!this.auth.logado()) {
      this.router.navigate(['/entrar'], { queryParams: { voltar: '/' } });
      return;
    }
    try {
      await this.comunidades.entrar(c.id);
      this.avisos.mostrar(`Você entrou na comunidade ${c.nome}!`);
      await this.carregar();
    } catch (e) {
      this.avisos.erro(e);
    }
  }

  protected focarComposer() {
    if (!this.auth.logado()) {
      this.router.navigate(['/entrar'], { queryParams: { voltar: '/' } });
      return;
    }
    document.getElementById('novo-post')?.focus();
  }

  protected async publicar() {
    const texto = this.texto.trim();
    if (!texto || this.comunidadeId === null) return;
    const link = this.link.trim() ? linkSeguro(this.link) : null;
    if (this.link.trim() && !link) {
      this.avisos.mostrar('O link precisa começar com http:// ou https://', 'erro');
      return;
    }
    this.publicando.set(true);
    try {
      await this.comunidades.publicar(Number(this.comunidadeId), texto, link);
      this.texto = this.link = '';
      this.mostrarLink = false;
      this.avisos.mostrar('Publicado!');
      this.categoria.set('Em Alta');
      await this.recarregarFeed();
    } catch (e) {
      this.avisos.erro(e);
    } finally {
      this.publicando.set(false);
    }
  }
}
