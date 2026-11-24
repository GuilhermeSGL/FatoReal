import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

// Formatos brasileiros (R$ 1.234,56) para os pipes que pedem 'pt-BR'
registerLocaleData(localePt, 'pt-BR');

// Troca de tela com transição suave (View Transitions do navegador; quem não tem, troca normal)
const recursosRota = [withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' as const }), withViewTransitions({ skipInitialTransition: true })];
// Na Vercel as rotas são normais (/comunidades). Em hospedagem sem servidor, usamos #/comunidades.
if (environment.roteamentoHash) recursosRota.push(withHashLocation() as never);

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes, ...recursosRota), { provide: LOCALE_ID, useValue: 'pt-BR' }],
};
