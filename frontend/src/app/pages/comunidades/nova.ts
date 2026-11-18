import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AvisosService } from '../../core/avisos.service';
import { ComunidadesService } from '../../core/comunidades.service';
import { Icone } from '../../shared/componentes';
import { capaComunidade, COR_TEMA, ICONE_TEMA } from '../../core/visual';
import { gerarSlug } from '../../core/util';

@Component({
  selector: 'app-nova-comunidade',
  imports: [FormsModule, RouterLink, Icone],
  templateUrl: './nova.html',
})
export class NovaComunidadePage {
  private service = inject(ComunidadesService);
  private avisos = inject(AvisosService);
  private router = inject(Router);

  protected readonly temas = ['Política', 'Educação', 'Cidadania', 'Economia', 'Saúde', 'Meio ambiente', 'Segurança', 'Tecnologia'];
  protected dados = {
    nome: '',
    tema: 'Política',
    descricao: '',
    regras:
      '1. Respeite as pessoas: critique ideias, não quem pensa diferente.\n' +
      '2. Ao afirmar um fato, cite a fonte.\n' +
      '3. Opinião é bem-vinda e não é desinformação.\n' +
      '4. Não publique conteúdo sabidamente falso.',
  };
  protected readonly enviando = signal(false);
  protected readonly capa = capaComunidade;
  protected readonly corTema = COR_TEMA;
  protected readonly iconeTema = ICONE_TEMA;
  protected slug() {
    return gerarSlug(this.dados.nome || 'nova');
  }

  protected async criar() {
    this.enviando.set(true);
    try {
      const c = await this.service.criar(this.dados);
      this.avisos.mostrar('Comunidade criada!');
      this.router.navigate(['/comunidades', c.slug]);
    } catch (e) {
      this.avisos.erro(e);
    } finally {
      this.enviando.set(false);
    }
  }
}
