const BOLD = '\x1b[1m';
const PURPLE = '\x1b[0;35m';
const RESET = '\x1b[0m';

export const visualizeStartApp = (PORT: any) => {
  const message = 'The divine app starting listen port:';
  const supremeVoice = 'continues to crap codding...';
  const paddingOffset = 55;
  const frame = `
      ${' '.repeat(paddingOffset)}╔${'═'.repeat(message.length + 7)}╗
      ${' '.repeat(paddingOffset)}║ ${message} ${PORT} ║
      ${' '.repeat(paddingOffset)}║        ${supremeVoice}       ║
      ${' '.repeat(paddingOffset)}╚${'═'.repeat(message.length + 7)}╝
    `;

  return `${PURPLE}${BOLD}${frame}${RESET}`;
};
