import * as ngrok from 'ngrok';

export const connectToNgrok = async (port: number) =>
  ngrok.connect({
    proto: 'http',
    addr: port,
  });
