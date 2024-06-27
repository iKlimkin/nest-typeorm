const BOLD = '\x1b[1m';
const PURPLE = '\x1b[0;35m';
const RESET = '\x1b[0m';

export const visualizeStartApp = (PORT: any) => {
  const message = 'Crap app starting listen port:';
  const paddingOffset = 55;
  const frame = `
      ${' '.repeat(paddingOffset)}╔${'═'.repeat(message.length + 7)}╗
      ${' '.repeat(paddingOffset)}║ ${message} ${PORT} ║
      ${' '.repeat(paddingOffset)}╚${'═'.repeat(message.length + 7)}╝
    `;

  return `${PURPLE}${BOLD}${frame}${RESET}`;
};
