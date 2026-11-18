import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { ComunidadesService } from '../../core/comunidades.service';
import { EnquetesService } from '../../core/enquetes.service';
import { termoDoDia } from '../../core/glossario';
import { Comunidade, Publicacao } from '../../core/modelos';
import { linkSeguro } from '../../core/util';
import { avatarComunidade, COR_TEMA, ICONE_TEMA } from '../../core/visual';
import { Avatar, Icone } from '../../shared/componentes';
import { Conferindo } from '../../shared/conferindo';
import { reduzirImagem } from '../../shared/imagem-reduzida';
import { PublicacaoCard } from '../../shared/publicacao-card';

type Aba = 'para-voce' | 'alta' | 'minhas' | 'memes';

/** Início com cara de rede social: stories, caixa de publicar (foto/meme, enquete, link), abas e feed. */
@Component({
  selector: 'app-inicio',
  imports: [FormsModule, RouterLink, Icone, Avatar, PublicacaoCard, Conferindo],
  templateUrl: './inicio.html',
})
export class InicioPage implements OnInit {
  private comunidades = inject(ComunidadesService);
  private avisos = inject(AvisosService);
  private enquetes = inject(EnquetesService);
  private router = inject(Router);
  protected auth = inject(AuthService);

  protected readonly fatoDoDia = termoDoDia();
  protected readonly iconeTema = ICONE_TEMA;
  protected readonly corTema = COR_TEMA;
  protected readonly avatarComunidade = avatarComunidade;
  protected readonly primeiroNome = computed(() => (this.auth.usuario()?.nome ?? '').split(' ')[0]);

  protected readonly abas: { id: Aba; nome: string }[] = [
    { id: 'para-voce', nome: 'Para você' },
    { id: 'alta', nome: 'Em alta 🔥' },
    { id: 'minhas', nome: 'Minhas comunidades' },
    { id: 'memes', nome: 'Memes 😂' },
  ];
  protected readonly aba = signal<Aba>('para-voce');

  protected readonly feedCompleto = signal<Publicacao[]>([]);
  protected readonly todas = signal<Comunidade[]>([]);
  protected readonly minhas = signal<Comunidade[]>([]);
  private readonly idsMinhas = computed(() => new Set(this.minhas().map((c) => c.id)));

  protected readonly feed = computed(() => {
    const lista = this.feedCompleto();
    switch (this.aba()) {
      case 'alta': return [...lista].sort((a, b) => b.total_curtidas + b.total_comentarios - (a.total_curtidas + a.total_comentarios));
      case 'minhas': return lista.filter((p) => this.idsMinhas().has(p.comunidade_id));
      case 'memes': return lista.filter((p) => p.meme || p.comunidade_slug === 'memes-da-politica');
      default: return lista;
    }
  });
  /** Stories: as comunidades da pessoa (ou as maiores, para quem ainda não entrou em nenhuma). */
  protected readonly stories = computed(() =>
    (this.minhas().length ? this.minhas() : [...this.todas()].sort((a, b) => b.total_membros - a.total_membros)).slice(0, 6),
  );
  protected readonly sugeridas = computed(() =>
    this.todas().filter((c) => !this.idsMinhas().has(c.id)).sort((a, b) => b.total_membros - a.total_membros).slice(0, 3),
  );
  /** "Em alta": hashtags mais usadas no feed (dado real das publicações). Sem hashtags, mostra os temas. */
  protected readonly emAlta = computed(() => {
    const cont = new Map<string, number>();
    for (const p of this.feedCompleto()) for (const t of new Set(p.texto.match(/#[\p{L}\d_]+/gu) ?? [])) cont.set(t, (cont.get(t) ?? 0) + 1);
    if (!cont.size) for (const p of this.feedCompleto()) if (p.comunidade_tema) cont.set(p.comunidade_tema, (cont.get(p.comunidade_tema) ?? 0) + 1);
    return [...cont.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  });

  // Nova publicação
  protected texto = '';
  protected link = '';
  protected memeTopo = '';
  protected memeBase = '';
  protected opcoes: string[] = ['', ''];
  protected mostrarLink = false;
  protected mostrarEnquete = false;
  protected comunidadeId: number | null = null;
  protected readonly imagem = signal<string | null>(null);
  /** Dados da publicação enquanto o FatoBot "confere" (a animação). */
  protected readonly conferindo = signal<{ texto: string; link: string | null; temImagem: boolean } | null>(null);
  private envio: Promise<unknown> | null = null;

  async ngOnInit() {
    await this.carregar();
  }

  private async carregar() {
    try {
      const [feed, todas, minhas] = await Promise.all([this.comunidades.feed(), this.comunidades.listar(), this.comunidades.minhas()]);
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

  protected buscarTag(tag: string) {
    this.router.navigate(['/busca'], { queryParams: { q: tag.replace(/^#/, '') } });
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
    const campo = document.getElementById('novo-post');
    campo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    campo?.focus();
  }

  protected async escolherImagem(ev: Event) {
    const arquivo = (ev.target as HTMLInputElement).files?.[0];
    (ev.target as HTMLInputElement).value = '';
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      this.avisos.mostrar('Escolha um arquivo de imagem (JPG, PNG, GIF ou WEBP).', 'erro');
      return;
    }
    try {
      this.imagem.set(await reduzirImagem(arquivo, 900, 900, false));
    } catch {
      this.avisos.mostrar('Não deu para abrir essa imagem. Tente outra.', 'erro');
    }
  }

  protected tirarImagem() {
    this.imagem.set(null);
    this.memeTopo = this.memeBase = '';
  }

  protected podePublicar() {
    return !!(this.texto.trim() || this.imagem()) && this.minhas().length > 0 && !this.conferindo();
  }

  protected publicar() {
    if (!this.podePublicar() || this.comunidadeId === null) return;
    const texto = this.texto.trim();
    const link = this.link.trim() ? linkSeguro(this.link) : null;
    if (this.link.trim() && !link) {
      this.avisos.mostrar('O link precisa começar com http:// ou https://', 'erro');
      return;
    }
    const opcoes = this.mostrarEnquete ? this.opcoes.map((o) => o.trim()).filter(Boolean) : [];
    if (this.mostrarEnquete && opcoes.length < 2) {
      this.avisos.mostrar('A enquete precisa de pelo menos 2 opções.', 'erro');
      return;
    }
    const imagem = this.imagem();
    const meme = imagem && (this.memeTopo.trim() || this.memeBase.trim()) ? { topo: this.memeTopo.trim(), base: this.memeBase.trim() } : null;
    this.conferindo.set({ texto, link, temImagem: !!imagem });
    this.envio = this.comunidades
      .publicar(Number(this.comunidadeId), texto, link, { imagem_url: imagem, meme })
      .then((id) => { if (id !== null && opcoes.length) this.enquetes.criar(id, opcoes); });
    this.envio.catch((e) => {
      this.conferindo.set(null);
      this.avisos.erro(e);
    });
  }

  /** A animação acabou: espera o envio terminar, limpa a caixa e mostra a publicação no feed. */
  protected async animacaoAcabou() {
    try {
      await this.envio;
    } catch {
      return;
    }
    this.texto = this.link = this.memeTopo = this.memeBase = '';
    this.opcoes = ['', ''];
    this.mostrarLink = this.mostrarEnquete = false;
    this.imagem.set(null);
    this.aba.set('para-voce');
    await this.recarregarFeed();
    setTimeout(() => this.conferindo.set(null), 2600);
  }
}
