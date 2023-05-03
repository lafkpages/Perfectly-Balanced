function random() {
  return Math.random().toString(32).substr(2);
}

function randomHex() {
  const c = '0123456789ABCDEF';
  return (
    '#' +
    new Array(6)
      .fill('')
      .map(() => c[Math.floor(Math.random() * 16)])
      .join('')
  );
}

if (typeof module == 'object')
  module.exports = {
    random,
    randomHex,
  };
