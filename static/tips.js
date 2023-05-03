const tipsSpan = document.querySelector('#tip');

let tipsI = 0;
const tips = [
  'change your name on the top-left of the home screen',
  'every 10 points you get a coin',
  "on the leaderboard you can see the top 25 players' best scores",
  'you get double coins in hard mode',
  'sync your progress with Google to play across multiple devices',
  'go to the achievements menu to complete achievements and earn rewards',
  'install the Perfectly Balanced app from the settings tab to get 500 coins!',
  'click on Download Recording to download a recording of your game',
  'you get 5 coins for each level you win',
];

function updateTip() {
  tipsSpan.innerHTML = tips[tipsI];

  console.log('[%ci%c] Tip:', 'font-family: webdings;', '', tips[tipsI]);

  tipsI++;

  if (tipsI >= tips.length) tipsI = 0;
}
