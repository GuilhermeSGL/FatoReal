import { Component, inject, input } from '@angular/core';
import { AvisosService } from '../core/avisos.service';
import { FavoritosService, TipoFavorito } from '../core/favoritos.service';
import { Icone } from './componentes';

/** Botão de estrela: salva o político, projeto etc. na aba "Salvos" do Meu Perfil. */
@Component({
  selector: 'app-favoritar',
  imports: [Icone],
  template: `
    <button type="button" [class]="compacto() ? 'fav-botao fav-compacto' : 'botao botao-fantasma fav-botao'" [class.fav-ativo]="ativo()"
      [attr.aria-pressed]="ativo()" [attr.aria-label]="ativo() ? 'Tirar dos salvos' : 'Salvar'" [title]="ativo() ? 'Tirar dos salvos' : 'Salvar no seu perfil'" (click)="alternar()">
      <app-icone nome="star" /> @if (!compacto()) { {{ ativo() ? 'Salvo' : 'Salvar' }} }
    </button>
  `,
})
export class Favoritar {
  private favoritos = inject(FavoritosService);
  private avisos = inject(AvisosService);
  readonly tipo = input.required<TipoFavorito>();
  readonly refId = input.required<string | number>();
  readonly titulo = input('');
  readonly url = input<string | null>(null);
  readonly compacto = input(false);

  protected ativo() {
    return this.favoritos.salvo(this.tipo(), String(this.refId()));
  }

  protected async alternar() {
    try {
      const salvou = await this.favoritos.alternar({ tipo: this.tipo(), ref_id: String(this.refId()), titulo: this.titulo(), url: this.url() });
      this.avisos.mostrar(salvou ? 'Salvo no seu perfil (aba Salvos).' : 'Tirado dos salvos.');
    } catch (e) {
      this.avisos.erro(e);
    }
  }
}
