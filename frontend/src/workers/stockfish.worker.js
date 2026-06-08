// Stockfish UCI Web Worker
let stockfish = null;

const initStockfish = () => {
  // Use stockfish.js from CDN via importScripts
  try {
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
    stockfish = self.STOCKFISH ? self.STOCKFISH() : null;
    if (stockfish) {
      stockfish.addMessageListener((msg) => {
        self.postMessage({ type: 'output', data: msg });
      });
      stockfish.postMessage('uci');
    }
  } catch (e) {
    // Fallback: simulate basic engine responses for demo
    self.postMessage({ type: 'ready' });
  }
};

self.onmessage = (e) => {
  const { type, command } = e.data;
  if (type === 'init') {
    initStockfish();
    return;
  }
  if (type === 'command' && stockfish) {
    stockfish.postMessage(command);
  }
};
