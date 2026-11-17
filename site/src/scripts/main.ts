// Entrada: primeiro a tela de idioma (só na primeira visita), depois a página.
import { languageGate } from './gate';
import { start } from './app';

void languageGate().then(start);
