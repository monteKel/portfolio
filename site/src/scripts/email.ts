// Email fora do HTML: some do alcance de raspadores simples.
// Guardado invertido em base64; só é montado quando o visitante pede.
const ENCODED = 'bW9jLmxpYW1nQHZlZC5sZWtldG5vbQ==';

export function revealEmail(): string {
  return atob(ENCODED).split('').reverse().join('');
}
