import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FatoBotConversa } from '../../core/fatobot-conversa.service';
import { AvisoIa, FonteDado, Icone } from '../../shared/componentes';


@Component({
  selector: 'app-fatobot',
  imports: [FormsModule, DatePipe, Icone, FonteDado, AvisoIa],
  templateUrl: './fatobot.html',
})
export class FatoBotPage implements OnInit {
  private conversa = inject(FatoBotConversa);
  private rota = inject(ActivatedRoute);

  protected pergunta = '';
  protected readonly mensagens = this.conversa.mensagens;
  protected readonly pensando = this.conversa.pensando;
  protected readonly sugestoes = [
    'Como funciona uma votação no Congresso?',
    'Qual é a função de um deputado federal?',
    'Quantos deputados tem a Câmara?',
  ];

  ngOnInit() {
    this.conversa.aberto.set(false);
    const p = this.rota.snapshot.queryParamMap.get('p');
    if (p) this.enviar(p);
  }

  protected async enviar(texto = this.pergunta) {
    this.pergunta = '';
    await this.conversa.enviar(texto);
  }
}
