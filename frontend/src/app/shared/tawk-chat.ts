import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window { Tawk_API?: Record<string, unknown>; Tawk_LoadStart?: Date }
}

/**
 * Chat do Tawk.to (requisito do professor). Só carrega se TAWK_PROPERTY_ID e TAWK_WIDGET_ID
 * estiverem nas variáveis de ambiente (scripts/gerar-env.mjs). Sem elas, não faz nada.
 * O balão fica no canto de baixo à ESQUERDA (depois do menu lateral), para não cobrir
 * a bolinha do FatoBot nem o botão de WhatsApp, que ficam à direita.
 */
@Component({ selector: 'app-tawk-chat', template: '' })
export class TawkChat implements OnInit {
  ngOnInit() {
    const env = environment as typeof environment & { tawkPropertyId?: string; tawkWidgetId?: string };
    const prop = (env.tawkPropertyId ?? '').trim();
    const widget = (env.tawkWidgetId ?? '').trim();
    // IDs do Tawk são só letras e números: qualquer outra coisa é ignorada (evita montar endereço estranho)
    if (!/^[a-z0-9]+$/i.test(prop) || !/^[a-z0-9]+$/i.test(widget) || document.getElementById('tawk-script')) return;
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API['customStyle'] = {
      visibility: {
        desktop: { position: 'bl', xOffset: 290, yOffset: 20 },
        mobile: { position: 'bl', xOffset: 10, yOffset: 90 },
      },
    };
    window.Tawk_LoadStart = new Date();
    const s = document.createElement('script');
    s.id = 'tawk-script';
    s.async = true;
    s.src = `https://embed.tawk.to/${prop}/${widget}`;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.body.appendChild(s);
  }
}
