import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { modoDemo } from '../../core/supabase';
import { AcessibilidadeService } from '../../core/acessibilidade.service';
import { Icone } from '../../shared/componentes';
import { FatoBotConversa } from '../../core/fatobot-conversa.service';
import { PreferenciaTema, TemaService } from '../../core/tema.service';

@Component({
  selector: 'app-configuracoes',
  imports: [RouterLink, Icone],
  template: `
    <header class="cabecalho-pagina">
      <h1><app-icone nome="settings" /> Configurações</h1>
      <p>Aparência, acessibilidade, FatoBot, conta e privacidade.</p>
    </header>

    <section class="card cfg-aparencia">
      <h2><app-icone nome="palette" /> Aparência</h2>
      <p class="texto-suave">Escolha como o Fato Real aparece para você. Também dá para trocar puxando a cordinha da lâmpada, no canto de cima.</p>
      <div class="cfg-temas" role="radiogroup" aria-label="Tema do site">
        @for (o of opcoesTema; track o.id) {
          <button type="button" role="radio" class="cfg-tema" [attr.data-opcao]="o.id" [attr.aria-checked]="tema.preferencia() === o.id" (click)="tema.definir(o.id)">
            <span class="cfg-previa" aria-hidden="true"><i></i><b></b><b></b><em></em></span>
            <span class="cfg-tema-nome"><app-icone [nome]="o.icone" /> {{ o.nome }}</span>
            <small>{{ o.texto }}</small>
          </button>
        }
      </div>
    </section>

    <div class="grade-2">
      <section class="card">
        <h2><app-icone nome="accessibility_new" /> Acessibilidade</h2>
        <p class="texto-suave">Ajuste a leitura do site. Fica salvo neste navegador.</p>
        <span class="rotulo">Tamanho da letra</span>
        <div class="opcoes-fonte" role="radiogroup" aria-label="Tamanho da letra">
          <button type="button" role="radio" [attr.aria-checked]="a11y.fonte() === 'normal'" (click)="a11y.definirFonte('normal')"><span style="font-size: 0.9rem">A</span> Normal</button>
          <button type="button" role="radio" [attr.aria-checked]="a11y.fonte() === 'grande'" (click)="a11y.definirFonte('grande')"><span style="font-size: 1.1rem">A</span> Grande</button>
          <button type="button" role="radio" [attr.aria-checked]="a11y.fonte() === 'maior'" (click)="a11y.definirFonte('maior')"><span style="font-size: 1.3rem">A</span> Maior</button>
        </div>
        <label class="opcao-alternar">
          <input type="checkbox" [checked]="a11y.contraste()" (change)="a11y.alternarContraste()" />
          <span><strong>Alto contraste</strong><small>Textos mais fortes, bordas visíveis e links sublinhados.</small></span>
        </label>
      </section>

      <section class="card" id="fatobot">
        <h2><app-icone nome="smart_toy" /> FatoBot</h2>
        <p class="texto-suave">O assistente que acompanha você em todas as páginas.</p>
        <label class="opcao-alternar">
          <input type="checkbox" [checked]="bot.dicasLigadas()" (change)="bot.definir('dicas', !bot.dicasLigadas())" />
          <span><strong>Dicas do FatoBot</strong><small>De vez em quando ele mostra uma dica sobre a página em que você está.</small></span>
        </label>
        <label class="opcao-alternar">
          <input type="checkbox" [checked]="bot.falarRespostas()" (change)="bot.definir('voz', !bot.falarRespostas())" />
          <span><strong>Responder em voz alta</strong><small>Quando você pergunta pelo microfone, ele lê a resposta.</small></span>
        </label>
      </section>

      <section class="card">
        <h2><app-icone nome="manage_accounts" /> Conta</h2>
        @if (auth.usuario(); as u) {
          <p class="texto-suave">Conectado como <strong>{{ u.nome }}</strong> ({{ u.email }}).</p>
          <ul class="lista-links">
            <li><a routerLink="/perfil/editar"><app-icone nome="edit" /> Editar perfil e foto</a></li>
            <li><a routerLink="/recuperar-senha"><app-icone nome="key" /> Trocar senha</a></li>
            <li><a routerLink="/perfil/editar"><app-icone nome="delete" /> Excluir minha conta</a></li>
          </ul>
          <button type="button" class="botao botao-fantasma" (click)="sair()"><app-icone nome="logout" /> Sair</button>
        } @else {
          <p class="texto-suave">Você não está conectado.</p>
          <a routerLink="/entrar" class="botao botao-verde">Entrar</a>
        }
      </section>

      <section class="card">
        <h2><app-icone nome="shield_person" /> Privacidade (LGPD)</h2>
        <p class="texto-suave">Guardamos só nome, e-mail, foto (se você colocar) e o que você publica. Nunca pedimos sua preferência política.</p>
        <ul class="lista-links">
          <li><a routerLink="/privacidade"><app-icone nome="policy" /> Política de privacidade</a></li>
          <li><a routerLink="/termos"><app-icone nome="description" /> Termos de uso</a></li>
          <li><a routerLink="/regras"><app-icone nome="gavel" /> Regras da comunidade</a></li>
          <li><a routerLink="/contato"><app-icone nome="mail" /> Falar com a equipe</a></li>
        </ul>
      </section>

      @if (demo) {
        <section class="card">
          <h2><app-icone nome="science" /> Modo demonstração</h2>
          <p class="texto-suave">Os dados de teste ficam só neste navegador. Apague para começar do zero.</p>
          <button type="button" class="botao botao-perigo" (click)="limparDemo()"><app-icone nome="restart_alt" /> Apagar dados de teste</button>
        </section>
      }
    </div>
  `,
})
export class ConfiguracoesPage {
  protected auth = inject(AuthService);
  protected a11y = inject(AcessibilidadeService);
  protected bot = inject(FatoBotConversa);
  protected tema = inject(TemaService);
  protected readonly opcoesTema: { id: PreferenciaTema; nome: string; icone: string; texto: string }[] = [
    { id: 'claro', nome: 'Claro', icone: 'light_mode', texto: 'Fundo claro, com o verde do Fato Real.' },
    { id: 'escuro', nome: 'Escuro', icone: 'dark_mode', texto: 'Preto e grafite, descansa a vista à noite.' },
    { id: 'sistema', nome: 'Automático', icone: 'brightness_auto', texto: 'Segue o modo do seu celular ou computador.' },
  ];
  private avisos = inject(AvisosService);
  private router = inject(Router);
  protected readonly demo = modoDemo;

  protected async sair() {
    await this.auth.sair();
    this.router.navigateByUrl('/');
  }

  protected limparDemo() {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('fatoreal')).forEach((k) => localStorage.removeItem(k));
    } catch {
      /* sem localStorage */
    }
    this.avisos.mostrar('Dados de teste apagados.');
    setTimeout(() => location.reload(), 600);
  }
}
