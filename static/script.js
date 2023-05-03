// detect Replit WebView
const webviewDetector = new WebViewDetector();

// detect if we are in a webview
if (webviewDetector.isWebView()) {
  // stop loading the page
  window.stop();

  // redirect to the error page
  window.location.replace('/_replit.html');
}


// parsed URL for GET params
const parsedUrl = new URL(location.href);
const parsedHash = new URLSearchParams(location.hash.substr(1));
let protocol = null;
let parsedProtocol = new URLSearchParams('');


function getPWADisplayMode() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (document.referrer.startsWith('android-app://')) {
    return 'twa';
  } else if (navigator.standalone || isStandalone) {
    return 'standalone';
  }
  return 'browser';
}


// isolate variables from global namespace
// to prevent cheating from the console
(() => {


  // register error listeners
  window.addEventListener('unhandledrejection', e => {
    try {
      runner.enabled = false;
    } catch (err) {
      console.log('[%ci%c] Error stopping physics in unhandled rejection handler:', 'font-family: webdings;', '', err);
    }

    showPopup('Error', `There was an unhandled Promise rejection:<br><samp>${e.reason}</samp><br><button class="deep green error-reload-btn">Reload</button>`, {
      button: null,
      persistent: true
    });
  });
  window.addEventListener('error', e => {
    try {
      runner.enabled = false;
    } catch (err) {
      console.log('[%ci%c] Error stopping physics in error handler:', 'font-family: webdings;', '', err);
    }

    showPopup('Error', `There was an uncaught error:<br><samp>${e.type}: ${e.message}</samp><br><button class="deep green error-reload-btn">Reload</button>`, {
      button: null,
      persistent: true
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.matches('button.error-reload-btn'))
      return;

    location.reload();
  });

  // detect Cheesgle Byte app
  let isCheesgle = false;
  let cheesgleData = {};
  let cheesgleIsClosing = false;
  if (parsedHash.has('cheesgle')) {
    isCheesgle = true; document.documentElement.classList.add('cheesgle');
    console.log("[%ci%c] Cheesgle Byte detected", 'font-family: webdings;', '');
    window.parent.postMessage({ type: 'cheesgleGet' }, '*');
    setTimeout(() => {
      if (cheesgle('uid')) {
        if (window.isShowingCreateAccountPopup) hidePopup();
        getUserData2(); document.body.classList.remove('restricted');
      }
    }, 500);
  } Object.defineProperty(window, 'isCheesgle', {
    get: () => isCheesgle,
    set: v => isCheesgle = v,
    enumerable: true
  });

  // chrome theme color
  const themeColor = getComputedStyle(document.body).backgroundColor;

  // change chrome theme
  const themeColorMeta = document.createElement('meta');
  themeColorMeta.name = 'theme-color';
  themeColorMeta.content = themeColor;
  document.head.appendChild(themeColorMeta);

  // protocol handlers
  if (navigator.registerProtocolHandler) {
    try {
      navigator.registerProtocolHandler('web+pb', 'https://perfectly-balanced.luisafk.repl.co/#protocol=%s', 'Perfectly Balanced');
    } catch (err) {
      console.log('[%cr%c] Error registering protocol handlers:', 'font-family: webdings;', '', err);
    }
  }
  else {
    console.log('[%ci%c] Did not register protocol handler because protocol handlers are not supported', 'font-family: webdings;', '');
  }

  // register service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", e => {
      try {
        navigator.serviceWorker
          .register("/sw.js")
          .then(res => console.log("[%c\xE6%c] Service worker registered", 'font-family: webdings;', ''))
          .catch(err => console.log("[%cr%c] Service worker not registered:", 'font-family: webdings;', '', err));
      } catch (err) {
        console.log("[%cr%c] Service worker not registered:", 'font-family: webdings;', '', err);
      }
    });
  }

  // install PWA prompts
  let installAppEvent = null;
  window.addEventListener('beforeinstallprompt', e => {
    console.log('[%ci%c] onBeforeInstallPrompt fired:', 'font-family: webdings;', '', e);

    e.preventDefault();

    installAppEvent = e;
  });

  // handle install button
  document.addEventListener('click', e => {
    if (!e.target.matches('button#install-pwa-btn')) return;

    if (installAppEvent) {
      hidePopup();
      installAppEvent.prompt();

      installAppEvent.userChoice.then(choice => {
        console.log('[%ci%c] User choice in PWA install prompt:', 'font-family: webdings;', '', choice.outcome);

        installAppEvent = null;
      });
    }
    else {
      console.error('[%cr%c] Tried to install app but no onBeforeInstallPrompt was saved', 'font-family: webdings;', '');
      showPopup('Error', 'There was an error installing the app. Please try again later');
    }
  });

  // handle PWA install event
  window.addEventListener('appinstalled', e => {
    console.log('PWA was installed');
    installAppEvent = null;

    // get achievement
    fetch('/pwa-installed', {
      method: 'POST',
      body: 'true',
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  });

  // handle online and offline events
  window.addEventListener('online', e => {
    updateAccountSwitcher();
  });

  window.addEventListener('offline', e => {
    updateAccountSwitcher();
  });


  // save tests
  const tests = window.tests;
  delete window.tests;

  // save levels
  const levels = window.levels;
  delete window.levels;

  // mobile detector
  let uaParser = null;
  try {
    uaParser = new UAParser();
  } catch (err) {
    console.error('Error initializing UAParser:', err);
  }


  // HTML elements
  const popupContainer = document.querySelector('div#popup-container');
  const popupCont = document.querySelector('div#popup');
  const popupTitle = document.querySelector('#popup-title');
  const popupBody = document.querySelector('#popup-body');
  const popupOkBtn = document.querySelector('button#popup-ok');
  const homeScreen = document.querySelector('div#home-screen');
  const topLeft = document.querySelector('div#top-left');
  const nickContainer = document.querySelector('div#nick-container');
  const nickInp = document.querySelector('#nick');
  const editNick = nickContainer.querySelector('i.material-icons');
  const coinsSpan = document.querySelector('#coins');
  const accountDiv = document.querySelector('div#account-container');
  const achievementsBtn = document.querySelector('div#achievements-container');
  const topRight = document.querySelector('div#top-right');
  const difficultyIcon = document.querySelector('#difficulty-icon');
  const difficultySpan = document.querySelector('div#difficulty-container span');
  const bottomRight = document.querySelector('div#bottom-right');
  const creativeControlsDiv = document.querySelector('div#creative-controls');
  const creativeControlStatic = document.querySelector('input#creative-static');
  const creativeControlBounce = document.querySelector('input#creative-bounce');
  const creativeControlPlatformLength = document.querySelector('input#creative-platform-length');
  const easyBtn = document.querySelector('button#easy-btn');
  const hardBtn = document.querySelector('button#hard-btn');
  const levelsBtn = document.querySelector('button#levels-btn');
  const creativeBtn = document.querySelector('button#creative-btn');
  const multiplayerBtn = document.querySelector('button#multiplayer-btn');
  const leaderboardBtn = document.querySelector('button#leaderboard-btn');
  const shopBtn = document.querySelector('button#shop-btn');
  const accountScreen = document.querySelector('div#account-screen');
  const installPWABtn = document.querySelector('button#install-pwa-btn');
  const PWAUpdateHeader = document.querySelector('#app-updates-header');
  const PWAVersionSpan = document.querySelector('#pwa-version');
  const PWAVersionStatus = document.querySelector('#pwa-version-status');
  const updatePWABtn = document.querySelector('button#update-pwa-btn');
  const accountSwitcher = document.querySelector('select#account-switcher');
  const userIdShow = document.querySelector('#user-id-show');
  const userIdInp = document.querySelector('input#user-id');
  const changeUserBtn = document.querySelector('button#change-user-btn');
  const enableRecordingSelect = document.querySelector('select#enable-recording');
  const enableRecordingOptAuto = document.querySelector('option#enable-recording-opt-auto');
  const shareScoreBtnAction = document.querySelector('select#share-score-btn-action');
  const enableCanvasDebugInfo = document.querySelector('select#enable-canvas-debug-info');
  const showDevToolsInShop = document.querySelector('select#show-devtools-in-shop');
  const clearHTMLCacheBtn = document.querySelector('button#clear-html-cache-btn');
  const clearScriptCacheBtn = document.querySelector('button#clear-script-cache-btn');
  const clearStyleCacheBtn = document.querySelector('button#clear-style-cache-btn');
  const clearLevelsCacheBtn = document.querySelector('button#clear-levels-cache-btn');
  const clearCacheBtn = document.querySelector('button#clear-cache-btn');
  const cacheReloadBtn = document.querySelector('button#cache-reload-btn');
  const cssDisplayModeQueryResult = document.querySelector('#css-display-mode-query-result');
  const jsPwaCheckResult = document.querySelector('#js-pwa-check-result');
  const achievementsScreen = document.querySelector('div#achievements-screen');
  const achievementsDiv = document.querySelector('div#achievements');
  const levelsScreen = document.querySelector('div#levels-screen');
  const levelsDiv = document.querySelector('div#levels');
  const multiplayerScreen = document.querySelector('div#multiplayer-screen');
  const newGameBtn = document.querySelector('button#new-game-btn');
  const joinGameBtn = document.querySelector('button#join-game-btn');
  const joinGameScreen = document.querySelector('div#join-game-screen');
  const joinGameIdInp = document.querySelector('#join-game-id');
  const joinGameIdBtn = document.querySelector('button#join-game-id-btn');
  const multiplayerGameScreen = document.querySelector('div#multiplayer-game-screen');
  const gameIdSpan = document.querySelector('span#game-id-span');
  const gameIdCopy = document.querySelector('i#game-id-copy');
  const leftUserDiv = document.querySelector('div#left-user');
  const leftNick = document.querySelector('#left-nick');
  const rightNick = document.querySelector('#right-nick');
  const rightCanvas = document.querySelector('canvas#right-canvas');
  const rightCtx = rightCanvas.getContext('2d');
  const victoryScreen = document.querySelector('div#victory-screen');
  const leaderboardScreen = document.querySelector('div#leaderboard-screen');
  const leaderboardList = document.querySelector('#leaderboard');
  const shopScreen = document.querySelector('div#shop-screen');
  const refreshShopBtn = document.querySelector('button#refresh-shop-btn');
  const shopItems = document.querySelector('div#shop-items');
  const prizeWheelScreen = document.querySelector('div#prize-wheel-screen');
  const prizeWheelBtn = document.querySelector('button#prize-wheel-btn');
  const prizeWheelTenInp = document.querySelector('input#prize-wheel-ten-inp');
  const deathScreen = document.querySelector('div#death-screen');
  const deathInfo = document.querySelector('#death-info');
  const downloadRecordingLink = document.querySelector('a#download-recording');
  const container = document.querySelector('div#container');
  const canvasDebugInfo = document.querySelector('#canvas-debug-info');
  const canvasDebugWidth = document.querySelector('span#canvas-debug-width');
  const canvasDebugHeight = document.querySelector('span#canvas-debug-height');
  const scoreH = document.querySelector('#score');
  const bestScoreH = document.querySelector('#best-score');
  const retryBtn = document.querySelector('button#retry-btn');
  const shareScoreBtn = document.querySelector('button#share-score-btn');
  const shareScoreDownload = document.querySelector('a#share-score-download');
  const audioPop = document.querySelector('audio#audio-pop');

  // show popup function
  window.showPopup = function showPopup(title, body = '', options = {}) {
    options = {
      button: 'Ok',
      persistent: false,
      ...options
    };

    popupTitle.innerText = title;
    popupBody.innerHTML = body;
    if (options.button) {
      popupOkBtn.innerText = options.button;
      popupOkBtn.style.display = '';
    }
    else {
      popupOkBtn.style.display = 'none';
    }

    popupContainer.classList.add('show');

    if (options.persistent)
      popupContainer.classList.add('persistent');
  }

  // hide popup function
  window.hidePopup = function hidePopup() {
    popupContainer.classList.remove('show');
    popupContainer.classList.remove('persistent');
  }

  // draw by vertices function
  function draw(vertices, ctx) {
    ctx.beginPath();
    vertices.forEach(v => ctx.lineTo(v.x || v[0], v.y || v[1]));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // get user data function
  function getUserData(id = null, cache = false) {
    return new Promise((resolve, reject) => {
      fetch('/get-user' + (id? `?uid=${id}` : (isCheesgle? `?uid=${cheesgle('uid') || ''}` : '')))
        .then(resp => resp.json())
        .then(resp => {
          if (!id) {
            user_cache = resp;
            if (isCheesgle) {
              cheesgle('userCache', resp);
            } else {
              try {
                localStorage.setItem('userCache', JSON.stringify(resp));
              } catch (err) { }
            }
          }
          resolve(resp);
        })
        .catch(err => {
          if (cache) {
            if (user_cache)
              resolve(user_cache);
            else {
              if (isCheesgle) {
                user_cache = cheesgle('userCache');
              } else {
                try {
                  user_cache = JSON.parse(localStorage.getItem('userCache'));
                } catch (err) { }
              }
              resolve(user_cache);
            }
          }
          else
            reject(err);
        });
    });
  }

  // get user data function
  function getUserData2(cache = false) {
    return new Promise((resolve, reject) => {
      getUserData(null, cache).then(data => {
        if (!data) {
          console.log("[%cr%c] Could not getUserData2 as null data was received", 'font-family: webdings;', '');
          resolve(null);
        }

        // get nick
        nickInp.innerText = data?.nick || '';

        // set nick color
        nickInp.className = '';
        nickInp.style.color = '';
        if (nickColorClasses.includes(data?.itemsSelected?.nickColors))
          nickInp.className = data?.itemsSelected?.nickColors || '';
        else
          nickInp.style.color = data?.itemsSelected?.nickColors || '';

        // get best score
        if (data.bestScore)
          bestScore = data.bestScore;

        // get coins
        coinsSpan.innerText = data.coins || 0;

        // update ground color
        if (data?.itemsSelected && data.itemsSelected['blockColors']) {
          if (data.itemsSelected['blockColors'] in blockColorClasses)
            ground.render.fillStyle = blockColorClasses[data.itemsSelected['blockColors']];
          else
            ground.render.fillStyle = data.itemsSelected['blockColors'] || 'white';
        }
        else
          ground.render.fillStyle = 'white';

        // expose click handler
        if (data?.items?.includes('devtools.exposeClickHandler'))
        window.__exposedClickHandler = e => clickHandler(e || { type: 'mousedown' });
        else delete window.__exposedClickHandler;

        resolve(data);
      }).catch(reject);
    });
  }

  // get leaderboard function
  function getLeaderboard() {
    return new Promise((resolve, reject) => {
      fetch('/leaderboard')
        .then(resp => resp.json())
        .then(resolve)
        .catch(reject);
    });
  }

  // is valid CSS color function
  function isValidColor(strColor) {
    const s = new Option().style;
    s.color = strColor;
    return s.color !== '';
  }

  // get prize wheel total chance function
  function getPrizeWheelTotalChance() {
    return new Promise((resolve, reject) => {
      if (window.prizeWheelTotalChance)
        resolve(window.prizeWheelTotalChance);
      else
        fetch('/prize-wheel/total')
          .then(resp => resp.text())
          .then(resp => {
            window.prizeWheelTotalChance = parseInt(resp);
            resolve(window.prizeWheelTotalChance);
          })
          .catch(reject);
    });
  }

  // get shop function
  function getShop(cache = false) {
    return new Promise((resolve, reject) => {
      if (cache && shop_cache) {
        resolve(shop_cache);
        return;
      }

      fetch('/shop')
        .then(resp => resp.json())
        .then(shop => {
          shop_cache = shop;
          resolve(shop);
        })
        .catch(reject);
    });
  }

  // get fullId function
  function getFullId(shelfId, itemId) {
    return `${shelfId}.${itemId}`;
  }

  // update shop function
  function updateShop() {
    // get prize wheel total chance
    getPrizeWheelTotalChance().then(total => {
      // fetch user to update items cache
      getUserData2().then(user => {
        getDailySpinStatus().then(dailySpin => {
          // fetch shop items
          getShop().then(shop => {
            _updateShop(shop, dailySpin, total, user);
          });
        });
      });
    }).catch(err => {
      showPopup('Error', `There was an error loading the shop:<br><samp>${err}</samp>`);
      refreshShopBtn.disabled = false;
    });
  }

  // html update shop function
  function _updateShop(shop, dailySpin = null, total = null, user = null) {
    if (!dailySpin)
      dailySpin = daily_spin_cache;

    if (!total)
      total = window.prizeWheelTotalChance;

    if (!user)
      user = user_cache;

    // clear all previous items
    shopItems.textContent = '';

    for (let shelfId of Object.entries(shop.shelves)) {
      const shelf = shelfId[1];
      shelfId = shelfId[0];

      if (shelfId == 'devtools') {
        if (!settings.showDevToolsInShop)
          continue;
      }

      // parse shelf name
      const singularShelfName = (shelf.name || shelfId).replace(/s$/i, '').toLowerCase();

      // create shelf div
      const div = document.createElement('div');
      div.className = 'shop-shelf';
      div.dataset.shelfid = shelfId;

      // create header
      const header = document.createElement('h3');
      header.innerText = shelf.name;

      // create items div
      const div2 = document.createElement('div');
      div2.className = 'shop-items';

      // populate items div
      for (let itemId of Object.entries(shelf.items)) {
        const item = itemId[1];
        itemId = itemId[0];

        const fullId = getFullId(shelfId, itemId);

        const itemBought = !!(user_cache?.items?.includes(fullId));
        const itemSelected = !!(user_cache?.itemsSelected && user_cache?.itemsSelected[shelfId] == itemId);

        const buyingDisabled = item.buyingDisabled || shelf.buyingDisabled;
        let buyingDisabledReason = item.buyingDisabledReason || shelf.buyingDisabledReason;
        const inPrizeWheel = item.prizeWheel || shelf.prizeWheel;

        const isDailyPrize = shelfId == 'dailyPrize' && itemId == 'dailySpin';

        if (buyingDisabled && !buyingDisabledReason)
          buyingDisabledReason = 'Open prize wheel';
        if (!buyingDisabledReason)
          buyingDisabledReason = 'Can\'t buy';

        const invisible = shelf.invisible || item.invisible;

        let div3, header2, price, button;

        if (!invisible) {
          // create div
          div3 = document.createElement('div');
          div3.className = 'shop-item';
          div3.dataset.itemid = itemId;

          // create item header
          header2 = document.createElement('h5');
          header2.innerText = item.name || itemId;

          // if shelf is nick colors, color header
          // and make name user's nick
          if (shelfId == 'nickColors' && typeof user.nick == 'string') {
            if (nickColorClasses.includes(itemId))
              header2.classList.add(itemId);
            else
              header2.style.color = itemId;
            header2.innerText = user.nick.substr(0, 7);
          }

          // create price tag
          if (typeof item.price == 'number' || (isDailyPrize && !dailySpin.ready)) {
            price = document.createElement('span');
            price.className = 'shop-price';

            if (typeof item.price == 'number')
              price.innerHTML = `<i class="material-icons" translate="no">attach_money</i>${item.price || 'Free'}`;
          }

          // create buy/select/wheel button
          button = document.createElement('button');
          button.innerText = itemBought ? (itemSelected ? 'Selected' : 'Select') : (buyingDisabled ? buyingDisabledReason : 'Buy');
          button.className = 'deep green';
        }

        if (inPrizeWheel) {
          if (button)
            button.classList.add('prize-wheel-btn');

          // add to prize wheel
          if (typeof item.chance == 'number' && item.chance > 0) {
            const text = item.name || itemId;
            prizeWheel.addSegment({
              fillStyle: isValidColor(itemId) ? itemId : randomHex(),
              text: `${text}${text.includes(singularShelfName)? '' : (' ' + singularShelfName)}`,
              size: item.chance ? item.chance * 360 / total : undefined
            });
          }
        }

        if (!invisible) {
          if (!itemBought) {
            if (!inPrizeWheel) {
              button.classList.add('buy-btn');
              if (buyingDisabled)
                button.disabled = true;
            }
          }
          else {
            button.classList.add('select-btn');
            if (itemSelected)
              button.disabled = true;
            if (shelf.selectingDisabled || item.selectingDisabled)
              button.disabled = true;
          }

          // daily prize
          if (isDailyPrize) {
            button.disabled = !dailySpin.ready;

            if (dailySpin.ready) {
              button.classList.add('daily-spin-btn');
              button.innerText = 'Spin for free!';
            }
            else {
              price.innerText = `Ready in ${new Date(dailySpin.remaining).toISOString().substring(11, 19)}`;
            }
          }

          // add header to item div
          div3.appendChild(header2);

          // add price tag to item div
          if (price)
            div3.appendChild(price);

          // add button do item div
          div3.appendChild(button);

          // add to items div
          div2.appendChild(div3);
        }
      }

      // add header to shelf div
      div.appendChild(header);

      // add items div to shelf div
      div.appendChild(div2);

      // add shelf div to shop items div
      shopItems.appendChild(div);
    }

    refreshShopBtn.disabled = false;
  }

  // buy item from shop function
  function buyFromShop(fullId) {
    return new Promise((resolve, reject) => {
      fetch('/shop/buy', {
        method: 'POST',
        body: fullId
      })
        .then(resolve)
        .catch(reject);
    });
  }

  // select item from shop function
  function selectItem(fullId) {
    return new Promise((resolve, reject) => {
      fetch('/shop/select', {
        method: 'POST',
        body: fullId
      })
        .then(resp => {
          resp.text().then(text => {
            resolve([text, resp]);
          });
        })
        .catch(reject);
    });
  }

  // get item ID function
  function getItemIdFromButton(btn) {
    return btn.parentElement.dataset.itemid;
  }

  // get shelf ID function
  function getShelfIdFromButton(btn) {
    return btn.parentElement.parentElement.parentElement.dataset.shelfid;
  }

  // get full ID function
  function getFullIdFromButton(btn) {
    return getFullId(getShelfIdFromButton(btn), getItemIdFromButton(btn));
  }

  // select text function
  function selectElementContents(el) {
    let range = document.createRange();
    range.selectNodeContents(el);
    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // draw prize wheel marker function
  window.drawPrizeWheelMarker = function drawPrizeWheelMarker(updateCursor = false, updateButton = false) {
    // Get the canvas context the wheel uses
    let ctx = prizeWheel.ctx;

    ctx.strokeStyle = 'navy';  // Set line colour.
    ctx.fillStyle = 'aqua';  // Set fill colour.
    ctx.lineWidth = 2;
    ctx.beginPath();           // Begin path.
    ctx.moveTo(170, 5);        // Move to initial position.
    ctx.lineTo(230, 5);        // Draw lines to make the shape.
    ctx.lineTo(200, 40);
    ctx.lineTo(171, 5);
    ctx.stroke();              // Complete the path by stroking (draw lines).
    ctx.fill();                // Then fill.

    // update prize wheel screen cursor
    if (updateCursor) {
      if (prizeWheel.isSpinning)
        prizeWheelScreen.style.cursor = 'default';
      else
        prizeWheelScreen.style.cursor = 'pointer';
    }

    // update spin button disabled state
    if (updateButton) {
      if (prizeWheel.isSpinning) {
        prizeWheelBtn.disabled = true;
        prizeWheelTenInp.disabled = true;
      }
      else {
        prizeWheelBtn.disabled = false;
        prizeWheelTenInp.disabled = false;
      }
    }
  }

  // get prize function
  function getPrizeWheelPrize(n = 1, isDailySpin) {
    return new Promise((resolve, reject) => {
      fetch(`/prize-wheel?n=${n}&isDailySpin=${isDailySpin}${isCheesgle? `&uid=${cheesgle('uid')}` : ''}`)
        .then(resp => {
          resp.text().then(text => {
            let r = text;

            if (resp.status == 200) {
              r = r.split(/\s*,\s*/g).map(a => parseInt(a));
            }

            resolve([r, resp]);
          });
        })
        .catch(reject);
    });
  }

  // difficulty icons
  const difficultyIcons = {
    easy: 'sentiment_satisfied',
    hard: 'sentiment_very_dissatisfied',
    creative: 'sentiment_neutral'
  };

  // achievement reward type icons
  const rewardTypeIcons = {
    coins: 'attach_money'
  };

  // set difficulty function
  function setDifficulty(d, dSpan = true) {
    // save difficulty
    difficulty = d;

    // update icon
    difficultyIcon.innerText = difficultyIcons[d];

    // update difficulty span
    if (dSpan)
      difficultySpan.innerText = d;

    // show or hide creative controls
    if (d == 'creative')
      creativeControlsDiv.style.display = 'unset';
    else
      creativeControlsDiv.style.display = 'none';

    // physics properties are updated automatically
  }

  // get random platform size function
  function getPlatformSize() {
    if (is_playing_level && is_playing_level_lid) {
      if (levels.levels[is_playing_level_lid]?.getPlatformSize)
        return levels.levels[is_playing_level_lid].getPlatformSize();
    }

    switch (difficulty) {
      case 'creative':
        const creativeLength = Number(creativeControlPlatformLength.value);
        if (creativeLength)
          return creativeLength;
      // else wil continue to next case

      case 'easy':
        return Math.random() * 60 + 120;
        break;

      default:
        return Math.random() * 100 + 80;
        break;
    }
  }

  // function for clearing blocks
  function clearBlocks() {
    console.groupCollapsed('%c[%cq%c]%c Clearing blocks', 'font-weight: normal;', 'font-family: webdings; font-weight: normal;', 'font-weight: normal', 'font-weight: normal;');
    console.log('Bodies before:', engine.world.bodies.length);
    console.time('remove blocks');
    Composite.allBodies(engine.world).forEach(body => {
      if (body.label.includes('block') || body.label.includes('level'))
        Composite.remove(engine.world, body);
    });
    console.timeEnd('remove blocks');
    console.log('Bodies after:', engine.world.bodies.length);
    console.groupEnd();
  }

  // function for loading achievements
  function getAchievements() {
    return new Promise((resolve, reject) => {
      fetch('/achievements')
        .then(resp => resp.json())
        .then(resp => {
          achievements_cache = resp;
          resolve(resp);
        })
        .catch(reject);
    });
  }

  // function for loading achievements into the achievements screen
  function getAchievements2() {
    return new Promise((resolve, reject) => {
      getAchievements()
        .then(data => {
          // clear all children
          achievementsDiv.textContent = '';

          // populate
          for (let id of Object.entries(data.achievements)) {
            const achievement = id[1];
            id = id[0];

            const prog = checkAchievementProgress(achievement.progressCheck, user_cache) || 0;
            const progPercent = prog / achievement.progressMax * 100;
            const progCapped = progPercent > 100 ? 100 : (progPercent < 0 ? 0 : progPercent);
            const completed = !!user_cache?.achievements?.includes(id);

            const div = document.createElement('div');
            const title = document.createElement('h3');
            const progDiv = document.createElement('div');
            const progLabel = document.createElement('label');
            const progress = document.createElement('progress');
            const description = document.createElement('p');
            const icon = document.createElement('i');
            const rewardDiv = document.createElement('div');
            const rewardIcon = document.createElement('i');
            const reward = document.createElement('span');

            div.className = 'green achievement';

            title.className = 'achievement-title';

            progDiv.title = `${progPercent}%`;
            progDiv.className = 'achievement-progress-container';

            progLabel.htmlFor = `${id}-progress`;
            if (completed)
              progLabel.innerHTML = `<i class="material-icons-outlined">done</i>`;
            else
              progLabel.innerText = `${Math.floor(progCapped)}%`;
            progLabel.className = 'achievement-proglabel';

            progress.max = achievement.progressMax;
            progress.value = prog;
            progress.id = progLabel.htmlFor;
            progress.className = 'achievement-progress';

            description.innerText = achievement.description;
            description.className = 'achievement-description';

            icon.innerText = achievement.icon;
            icon.className = achievement.iconType || 'material-icons-outlined';

            rewardDiv.className = 'achievement-reward-container';

            rewardIcon.innerText = rewardTypeIcons[achievement.rewardType || 'coins'];
            rewardIcon.className = 'achievement-reward-icon material-icons-outlined';

            reward.innerText = achievement.reward;
            reward.className = 'achievement-reward';

            title.appendChild(icon);
            title.appendChild(document.createTextNode(achievement.name));

            progDiv.appendChild(progLabel);
            progDiv.appendChild(progress);

            rewardDiv.appendChild(rewardIcon);
            rewardDiv.appendChild(reward);

            div.appendChild(title);
            div.appendChild(progDiv);
            div.appendChild(description);
            div.appendChild(rewardDiv);

            achievementsDiv.appendChild(div);
          }

          resolve(data);
        })
        .catch(reject);
    });
  }

  // function to check an achievement progress
  function checkAchievementProgress(check, vars) {
    // parse for security
    if (/[a-z0-9]+\([^()]*\)|window|document|location|storage|cache|new|api|definepropert|script/gim.test(check)) {
      showPopup('Security Error', 'There was a security problem checking the progress of an achievement. Please try again later');

      return 0;
    }

    let progress = 0;

    try {
      progress = eval(check);
    }
    catch (err) {
      showPopup('Error', `There was an error checking the progress of an achievement:<br><samp>${err}</samp>`);

      return 0;
    }

    return progress;
  }

  // when signed in with google
  window.onGoogleSignIn = user => {
    fetch('/googleToken', {
      method: 'POST',
      body: JSON.stringify(user),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(resp => {
        resp.text().then(text => {
          if (resp.status == 200) {
            showPopup('Signed in', text);

            // clear localStorage
            delete cheesgleData.uid;
            try {
              localStorage.removeItem('uid');
            } catch (err) { }

            location.reload();
            // const payload = JSON.parse(text);

            // console.groupCollapsed('Signed in with Google');
            // console.log('Name:', payload.name);
            // console.group('Email:', payload.email);
            // console.log('Verified:', payload.email_verified);
            // console.groupEnd();
            // console.log('User ID:', payload.sub);
            // console.log('Picture:', payload.picture);
            // console.groupEnd();
          }
          else {
            throw new Error(text);
          }
        });
      })
      .catch(err => {
        showPopup('Sign in Error', `There was an error signing in with Google:<br><samp>${err}</samp>`);
      })
  };

  // function to update account switcher accounts
  function updateAccountSwitcher() {
    return new Promise((resolve, reject) => {
      if (window.isShowingCreateAccountPopup) {
        resolve(false);
        return;
      }

      // delete previous accounts
      accountSwitcher.textContent = '';

      // check for accounts
      if (user_cache?.goog?.sub && navigator.onLine) {
        // get goog
        getGoog().then(goog => {
          // get current user ID
          const currentID = Cookies.get('uid');

          // get accounts info
          for (const userID of goog.ids) {
            (() => {
              if (userID == currentID)
                return new Promise(resolve => resolve(user_cache));
              else
                return getUserData(userID);
            })().then(user2 => {
              const opt = document.createElement('option');
              opt.label = user2.nick;
              opt.innerText = `${user2.nick} (${user2.coins} coins)`;
              opt.value = userID;
              if (userID == currentID)
                opt.selected = true;
              accountSwitcher.appendChild(opt);
            }).catch(err => {
              console.error('Error fetching user for Account Switcher:', err);
            });
          }

          resolve(true);
        }).catch(err => {
          showPopup('Error', `There was an error getting your information from Google:<br><samp>${err}</samp>`);
        });
      }
      else {
        const opt = document.createElement('option');
        opt.disabled = true;
        opt.label = navigator.onLine ? (user_cache ? 'Not signed in with Google' : 'Not signed in') : 'Not connected to the Internet';
        opt.selected = true;
        accountSwitcher.appendChild(opt);

        resolve(false);
      }
    });
  }

  // function to get goog
  function getGoog(retryTimes = 2) {
    return new Promise((resolve, reject) => {
      fetch('/get-goog')
        .then(resp => {
          resp.text().then(text => {
            if (resp.status == 200) {
              const json = JSON.parse(text);
              resolve(json);
            }
            else {
              if (retryTimes > 0) {
                getGoog(retryTimes - 1)
                  .then(resolve)
                  .catch(reject);
              }
              else
                reject(text);
            }
          });
        })
        .catch(reject)
    });
  }

  // show levels in html
  function updateLevels() {
    if (!user_cache)
      return;

    // remove previous HTML
    levelsDiv.textContent = '';

    // levels beaten
    const levelsUnlocked = user_cache.level || 0;

    // add levels
    for (let i = 0; i < levels.levels.length; i++) {
      const level = levels.levels[i];

      const div = document.createElement('div');
      div.className = 'level';
      div.innerText = i + 1;
      div.dataset.lid = i;

      if (i > levelsUnlocked)
        div.classList.add('locked-level');

      const lock = document.createElement('i');
      lock.innerText = 'lock';
      lock.className = 'level-lock material-icons-outlined';
      lock.setAttribute('translate', 'no');

      div.appendChild(lock);
      levelsDiv.appendChild(div);
    }
  }

  // play a level
  function playLevel(levelId, retry = true) {
    const level = levels.levels[levelId];

    // reset
    if (retry)
      retryBtn.click();

    // move victory detector
    Body.setPosition(victoryDetector, {
      x: groundPos.vx,
      y: level.victoryY
    });

    // make visible
    victoryDetector.render.visible = true;

    // custom bodies
    if (level.create) {
      const bodies = level.create(cnvWidth, cnvHeight).map(body => {
        if (!body.render)
          body.render = {};

        if (user_cache?.itemsSelected?.blockColors) {
          const color = user_cache.itemsSelected.blockColors;
          body.render.fillStyle = (color in blockColorClasses) ? blockColorClasses[color] : color;
        }
        else {
          body.render.fillStyle = 'white';
        }

        body.render.strokeStyle = 'transparent';
        body.render.lineWidth = 0;

        return body;
      });

      Composite.add(engine.world, bodies);
    }

    // custom initial step
    if (typeof level.initStep == 'number')
      step = level.initStep;


    // difficulty
    setDifficulty(level.difficulty || levels.difficulty);

    // resize canvas
    render.canvas.width = window.innerSmall;
    render.canvas.height = window.innerSmall;
    render.options.width = window.innerSmall;
    render.options.height = window.innerSmall;

    // show container
    container.style.display = 'flex';
    homeScreen.style.display = 'none';
    levelsScreen.style.display = 'none';

    // save playing a level
    is_playing_level = true;
    is_playing_level_lid = levelId;

    // move normal ground away
    resetGrounds();

    // run physics
    runner.enabled = true;
  }

  // moves away grounds and victoryDetector depending if is in level
  // should be called after calling clearBlocks()
  function resetGrounds() {
    console.groupCollapsed('%c[%ci%c] Resetting grounds...', 'font-weight: normal;', 'font-family: webdings; font-weight: normal;', 'font-weight: normal;');

    if (is_playing_level) {
      console.group('Is playing level');

      // reset ground if custom ground
      if (levels.levels[is_playing_level_lid].customGround) {
        console.log('Custom ground, moving normal grounds away');

        // move ground down
        Body.setPosition(ground, {
          x: ground.position.x,
          y: deathDetector.position.y * groundPos.ly
        });
        Body.setPosition(ground2, {
          x: ground2.position.x,
          y: deathDetector.position.y * groundPos.ly
        });
      }

      console.groupEnd();
    }
    else {
      console.group('Not playing level');

      // reset ground
      console.log('Putting normal grounds back');
      Body.setPosition(ground, {
        x: groundPos.x,
        y: groundPos.y
      });
      Body.setPosition(ground2, {
        x: groundPos.x2,
        y: groundPos.y2
      });

      // move victoryDetector away
      console.log('Moving victory detector away');
      Body.setPosition(victoryDetector, {
        x: groundPos.vm,
        y: 10
      });

      console.groupEnd();
    }

    console.groupEnd();
  }

  // function to get the status of the daily spin
  function getDailySpinStatus() {
    return new Promise((resolve, reject) => {
      fetch('/prize-wheel/daily/status' + (isCheesgle? `?uid=${cheesgle('uid')}` : ''))
        .then(resp => resp.json())
        .then(data => {
          daily_spin_cache = data;
          resolve(data);
        })
        .catch(reject);
    });
  }

  // get service worker function
  async function getServiceWorker() {
    return navigator.serviceWorker.controller || (await navigator.serviceWorker.ready).active
  }

  // save settings
  function saveSettings() {
    if (cheesgleIsClosing) return;
    console.log('[%c@%c] Saving settings', 'font-family: webdings;', '');
    if (isCheesgle) cheesgle('settings', settings);
    else localStorage.setItem('settings', JSON.stringify(settings));
  }

  // function to play pop sound
  let startedLoadingAudioPop = false;
  async function playPopAudio() {
    if (audioPop.readyState == 4) {
      try {
        const shouldPlay = audioPop.paused ? true : (audioPop.currentTime > 0.06);
        if (shouldPlay) {
          await audioPop.pause();
          audioPop.currentTime = 0;
          await audioPop.play();
        }
      } catch (err) {
        console.log('[%cr%c] Error playing pop audio:', 'font-family: webdings;', '', err);
      }
    } else if (audioPop.readyState == 0 && !startedLoadingAudioPop) {
      audioPop.load();
      startedLoadingAudioPop = true;
    }
  }

  // function to get the latest PWA version from the server
  function getLatestVersion(currentVersion, retryTimes = 2) {
    return new Promise((resolve, reject) => {
      fetch('/latest-pwa-version', {
        method: 'POST',
        body: currentVersion
      })
        .then(resp => {
          if (resp.headers.get('content-type')?.includes('application/json')) {
            resp.json().then(data => {
              version_cache = data;
              resolve(data);
            });
          } else {
            if (resp.status == 502 && retryTimes > 0) {
              console.log('[%cr%c] Error fetching latest version, retrying...', 'font-family: webdings;', '');
              getLatestVersion(currentVersion, retryTimes - 1)
                .then(resolve)
                .catch(reject);
            }
            else
              reject('response is not of type JSON');
          }
        })
        .catch(reject)
    });
  }

  // function to get the current app version
  function getCurrentVersion() {
    try {
      return localStorage.getItem('version') || 1.0;
    } catch (err) {
      return cheesgle('version') || 1.0;
    }
  }

  // function to get smallest window w/h
  function winSmallest() {
    return Math.min(window.innerWidth, window.innerHeight);
  }
  Object.defineProperty(window, 'innerSmall', {
    get: winSmallest,
    set: v => undefined
  });

  // function to show/hide canvas debug info
  function showCanvasDebugInfo(show = null) {
    if (show === null)
      show = settings.enableCanvasDebugInfo;
    canvasDebugInfo.style.display = show ? 'unset' : 'none';
  }

  // function to update canvas debug info
  function updateCanvasDebugInfo() {
    const canvasStyles = getComputedStyle(render.canvas);
    canvasDebugWidth.innerText = `GCS ${canvasStyles.width} (ATTR ${render.canvas.width}px)`;
    canvasDebugHeight.innerText = `GCS ${canvasStyles.height} (ATTR ${render.canvas.height}px)`;
  }

  // function to get/set Cheesgle app data
  function cheesgle(key = null, value = null) {
    if (!isCheesgle) {
      return null;
    }

    if (!key) {
      return cheesgleData || {};
    }

    if (value) {
      if (key != '__updateCheesgle')
        cheesgleData[key] = value;
      window.parent.postMessage({ type: "cheesgleSet", data: JSON.stringify(cheesgleData) }, "*");
    } else {
      if (cheesgleData)
        return cheesgleData[key] || null;
      else return null;
    }
  } window.cheesgleFunc = cheesgle;

  // listen for Cheesgle data
  window.addEventListener('message', e => {
    if (isCheesgle && typeof e.data == 'object' && e.data.type) {
      if (e.data.type == 'info' || e.data.savedAppData) {
        if (e.data.savedAppDataParsed)
        cheesgleData = e.data.savedAppData;
        else cheesgleData = JSON.parse(e.data.savedAppData);
        if (!cheesgleData)
          cheesgleData = {};
        if (!cheesgle('uid') && typeof window.createAccountPopup == 'function')
        window.createAccountPopup();
      }
      else if (e.data.type == 'closing') {
        cheesgleIsClosing = true;
        console.log('Cheesgle App is closing');
      }
    }
  });

  // ask for Cheesgle data
  window.parent.postMessage({ type: 'cheesgleGet' }, '*');

  // initialize socket.io instance
  let socket = io({
    reconnection: false, // prevent reconnecting automatically
    autoConnect: false,  // prevent connecting instantly
    extraHeaders: {
      'X-Cookie': isCheesgle? `uid=${cheesgle('uid') || ''};` : ''
    }
  });

  // module aliases
  let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events;

  // create an engine
  let engine = Engine.create({
    enableSleeping: true
  });
  //engine.world.gravity.y *= 1;
  //engine.velocityIterations = 6;
  //engine.positionIterations = 10;
  //engine.constraintIterations = 8;

  // canvas as background
  const canvasBackground = false;

  // create a renderer
  const cnvWidth = 400;
  const cnvHeight = 400;
  let render = Render.create({
    element: canvasBackground ? document.body : container,
    engine: engine,
    options: {
      wireframes: false,
      showSleeping: false,
      width: cnvWidth,
      height: cnvHeight,
      background: 'transparent',
      hasBounds: true
    }
  });

  // give canvas ID
  render.canvas.id = 'game-canvas';

  // make the canvas background
  if (canvasBackground)
    render.canvas.classList.add('canvas-bg');

  // update multiplayer canvases
  // width and height to singleplayer canvas
  rightCanvas.width = render.options.width;
  rightCanvas.height = render.options.height;

  // canvas background
  render.canvas.classList.add('cyan');
  render.canvas.classList.add('game-canvas');
  rightCanvas.classList.add('cyan');
  rightCanvas.classList.add('game-canvas');

  // cheesgle canvas background
  if (isCheesgle) {
    render.canvas.classList.remove('cyan');
    render.canvas.classList.add('yellow');
    rightCanvas.classList.remove('cyan');
    rightCanvas.classList.add('yellow');
  }

  const groundPos = {
    x: render.options.width / 2,
    y: render.options.height - 10,
    x2: render.options.width / 2,
    y2: render.options.height + 10,
    ly: 2,
    vx: render.options.width / 2,
    vm: render.options.width * 5
  };

  // create ground
  let ground = Bodies.rectangle(groundPos.x, groundPos.y, render.options.width - 10, 10, {
    isStatic: true,
    render: {
      fillStyle: 'white'
    },
    label: 'ground realGround',
    restitution: 0
  });

  // invisible ground bellow for collisions
  let ground2 = Bodies.rectangle(groundPos.x2, groundPos.y2, render.options.width - 10, 50, {
    isStatic: true,
    render: {
      visible: false,
      fillStyle: 'rgba(255, 0, 0, 0.5)'
    },
    label: 'ground2',
    restitution: 0
  });

  // create death detector
  let deathDetector = Bodies.rectangle(render.options.width / 2, render.options.height * 2 - 10, render.options.width * 5, 50, {
    isStatic: true,
    isSensor: true,
    render: {
      visible: false,
      fillStyle: 'orange',
      strokeStyle: 'black'
    },
    label: 'deathDetector'
  });

  // create victory detector
  let victoryDetector = Bodies.rectangle(groundPos.vm, 10, render.options.width - 10, 10, {
    isStatic: true,
    isSensor: true,
    render: {
      visible: false,
      fillStyle: 'rgba(22, 255, 56, 0.33)' // transparent green
    },
    label: 'victoryDetector'
  });

  // save most recently placed block
  let recent = null;

  let current = 0;
  let score = 0;
  let bestScore = 0;
  let step = 1;

  let dead = false;
  let won = false;

  let camera_y = 0;

  let user_cache = null;
  let achievements_cache = null;
  let daily_spin_cache = null;
  let shop_cache = null;
  let version_cache = null;

  let showDeathScreenTimeout = null;

  let is_playing_multiplayer = false;
  let is_playing_level = false;
  let is_playing_level_lid = null;

  let settings = (() => {
    let obj = {}; const v = func => x => {
      saveSettings();
      return func(x);
    }; Object.defineProperties(obj, {
      shareScoreBtnAction: {
        enumerable: true,
        get: () => shareScoreBtnAction.value,
        set: v(x => shareScoreBtnAction.value = x)
      }, enableRecording: {
        enumerable: true,
        get: () => enableRecordingSelect.value,
        set: v(x => enableRecordingSelect.value = x)
      }, enableCanvasDebugInfo: {
        enumerable: true,
        get: () => enableCanvasDebugInfo.value == 'true',
        set: v(x => enableCanvasDebugInfo.value = x)
      }, showDevToolsInShop: {
        enumerable: true,
        get: () => showDevToolsInShop.value == 'true',
        set: v(x => showDevToolsInShop.value = x)
      }
    }); return obj;
  })();

  // load saved settings
  console.log('[%c@%c] Loading settings', 'font-family: webdings;', '');
  try {
    const loadSettings = cheesgle('settings') || JSON.parse(localStorage.getItem('settings'));
    if (loadSettings) {
      for (const k of Object.entries(loadSettings))
        settings[k[0]] = k[1];
      saveSettings();
    }
  } catch (err) {
    console.log("[%cr%c] Error loading settings:", 'font-family: webdings;', '', err);
  }

  // save settings when user changes them
  const saveSettingsHandler = e => {
    if (!e.target.classList.contains('settings-option'))
      return;

    saveSettings();
  };
  document.addEventListener('input', saveSettingsHandler);

  // save settings before leaving the page
  window.addEventListener('beforeunload', e => {
    saveSettings();
  });

  const nickColorClasses = ['rainbow', 'gold', 'silver'];
  const blockColorClasses = {
    rainbow: render.context.createLinearGradient(0, 0, 400, 0),
    gold: render.context.createLinearGradient(0, 0, 400, 0),
    silver: render.context.createLinearGradient(0, 0, 400, 0)
  };
  blockColorClasses.rainbow.addColorStop(0.0, 'red');
  blockColorClasses.rainbow.addColorStop(1 / 6, 'orange');
  blockColorClasses.rainbow.addColorStop(2 / 6, 'yellow');
  blockColorClasses.rainbow.addColorStop(3 / 6, 'green');
  blockColorClasses.rainbow.addColorStop(4 / 6, 'blue');
  blockColorClasses.rainbow.addColorStop(5 / 6, 'indigo');
  blockColorClasses.rainbow.addColorStop(1.0, 'violet');
  blockColorClasses.gold.addColorStop(0.00, 'gold');
  blockColorClasses.gold.addColorStop(0.25, '#f2e9b6');
  blockColorClasses.gold.addColorStop(0.50, '#fefeb3');
  blockColorClasses.gold.addColorStop(0.60, 'gold');
  blockColorClasses.gold.addColorStop(0.75, '#feef9d');
  blockColorClasses.gold.addColorStop(1.00, 'white');
  blockColorClasses.silver.addColorStop(0.00, '#D7E1EC');
  blockColorClasses.silver.addColorStop(0.10, '#bfd9f2');
  blockColorClasses.silver.addColorStop(0.25, 'white');
  blockColorClasses.silver.addColorStop(0.35, '#ebf2f9');
  blockColorClasses.silver.addColorStop(0.50, '#D7E1EC');
  blockColorClasses.silver.addColorStop(0.75, '#d4e9ff');
  blockColorClasses.silver.addColorStop(1.00, '#ebf2f9');

  // video recording stuff
  const enableRecording = (updateBtn = true) => {
    const enabled = settings.enableRecording == 'auto' ? supportsRecording : (settings.enableRecording == 'true' ? true : false);

    // style/hide download recording button
    if (updateBtn) {
      if (enabled) {
        const styles = getComputedStyle(retryBtn);

        downloadRecordingLink.style.border = styles.border;
        downloadRecordingLink.style.color = styles.color;
        downloadRecordingLink.style.margin = styles.margin;
        downloadRecordingLink.style.padding = styles.padding;
        downloadRecordingLink.style.textDecoration = styles.textDecoration;

        downloadRecordingLink.style.display = '';
      }
      else
        downloadRecordingLink.style.display = 'none';
    }

    return enabled;
  };
  let supportsRecording = true;
  if (uaParser) {
    if (['console', 'mobile', 'tablet', 'smarttv', 'wearable', 'embedded'].includes(uaParser.getDevice().type?.toLowerCase()))
      supportsRecording = false;
    else if (['android browser', 'opera mini', 'opera mobi', 'opera tablet', 'chrome headless', 'iemobile', 'nokiabrowser'].includes(uaParser.getBrowser().name?.toLowerCase()))
      supportsRecording = false;
    else if (['android', 'android-x86', 'windows phone', 'windows mobile', 'ios'].includes(uaParser.getOS().name?.toLowerCase()))
      supportsRecording = false;
  }
  let isRecording = false;
  let recordedChunks = [];
  let recordedBlob = null;
  let recordedUrl = '';
  let stream = null;
  let mediaRecorder = null;

  console.log('[%c\xB7%c] Recording is', 'font-family: webdings;', '', enableRecording() ? 'enabled' : 'disabled');

  // update auto option in settings
  enableRecordingOptAuto.innerText = `if available (${supportsRecording ? 'yes' : 'no'})`;

  // death screenshot stuff
  let deathScreenshots = [];
  let shouldTakeDeathScreenshot = false;

  // hide share score button if sharing is not supported
  const featurePolicySupported = !!document.featurePolicy;
  const webSharePolicyEnabled = featurePolicySupported ? (
    document.featurePolicy.features().includes('web-share') ?
      document.featurePolicy.allowsFeature('web-share') :
      true
  ) : true;
  if (!(
    webSharePolicyEnabled &&
    navigator.canShare &&
    navigator.share
  )) {
    console.log('[%ci%c] Share score button was hiden either because the Feature Policy disabled the Web Share API or the browser does not support the Web Share API', 'font-family: webdings;', '');
    shareScoreBtn.style.display = 'none';
  }

  // difficulty
  let difficulty = 'hard';

  // set difficulty
  setDifficulty('easy', false);

  // add all of the bodies to the world
  Composite.add(engine.world, [ground, ground2, deathDetector, victoryDetector]);

  // run the renderer
  Render.run(render);

  // create runner
  let runner = Runner.create({
    isFixed: false
  });

  // run the engine
  Runner.run(runner, engine);

  // difficulties with less bounce
  const difficultiesWithLessBounce = [
    'easy'
  ];

  // difficulty block slopes
  const difficultyBlockSlopes = {
    'easy': 0.5,
    'hard': 0.9,
    'creative': 0.5
  };

  // difficulties with scores
  const difficultiesWithScores = [
    'easy',
    'hard'
  ];

  const difficultiesWithDeaths = [
    'easy',
    'hard'
  ];

  let creativeControls = (() => {
    let obj = {};
    Object.defineProperties(obj, {
      static: {
        get: () => creativeControlStatic.checked,
        set: ck => creativeControlStatic.checked = ck
      },
      bounce: {
        get: () => creativeControlBounce.checked,
        set: ck => creativeControlBounce.checked = ck
      }
    });
    return obj;
  })();

  // before tick
  Events.on(runner, "beforeTick", () => {
    if (typeof current == 'number') {
      current++;

      if (current >= 30) {
        const y = 35 + camera_y;

        const step_ = is_playing_level ? (levels.levels[is_playing_level_lid].getStep ? levels.levels[is_playing_level_lid].getStep() : step) : step;
        if (step_ == 3) {
          current = Bodies.rectangle(20, y, getPlatformSize(), 10);
          //Body.setMass(current, current.mass * 2);
        }
        else {
          current = Bodies.trapezoid(20, y, 30, 60, difficultyBlockSlopes[difficulty]);
          //Body.setMass(current, current.mass / 2);
        }

        if (step >= 4)
          step = 1;

        Body.setStatic(current, true);

        if (!current.render)
          current.render = {};

        current.render.fillStyle = ground.render.fillStyle;
        current.label = 'block';
        current.sleepThreshold = 60;

        Body.setMass(current, 1);

        current.friction = 1;
        current.restitution = 0;
        //current.slop = 0.1;
        //current.inertia = 100;
        //current.inverseInertia = 1 / current.inertia;

        Composite.add(engine.world, current);
      }
    }
    else if (current) {
      try {
        if (!current._dir)
          current._dir = 1;

        if (current._dir == 1 && current.position.x >= cnvWidth - 20)
          current._dir = -1;
        else if (current._dir == -1 && current.position.x <= 20)
          current._dir = 1;

        Body.setPosition(current, {
          x: current.position.x + 2 * current._dir,
          y: current.position.y
        });
      }
      catch (err) {
        console.error('Error in beforeTick on "else if (current)":', err);
      }
    }

    Composite.allBodies(engine.world).forEach(body => {
      // reduce bounce
      if (body.checkVelocityNextTick) {
        body.checkVelocityNextTick = false;

        if (Math.abs(body.velocity.y) >= 2) {
          if (difficultiesWithLessBounce.includes(difficulty)) {
            Body.setVelocity(body, {
              x: body.velocity.x,
              y: body.velocity.y / 5
            });

            console.log('[%c\xBC%c] Reduced bounce on body because difficulty is on', 'font-family: webdings;', '', difficulty);
          }
          else if (creativeControls.bounce) {
            Body.setVelocity(body, {
              x: body.velocity.x,
              y: body.velocity.y / 5
            });

            console.log('[%c\xBC%c] Reduced bounce on body because creative control \'bounce\' is set to', 'font-family: webdings;', '', creativeControls.bounce);
          }
        }
      }

      // move bodies
      const matches = body.label.matchAll(/move_([xy])/gi);
      for (const match of matches) {
        const xy = match[1];

        if (body.position[xy] <= body._move[xy].limits[0])
          body._move[xy].dir = 1;
        else if (body.position[xy] >= body._move[xy].limits[1])
          body._move[xy].dir = -1;

        Body.setPosition(body, {
          ...body.position,
          [xy]: body.position[xy] + (body._move[xy].speed * body._move[xy].dir)
        });
      }
    });
  });

  // after tick
  Events.on(runner, "afterTick", () => {
    // draw score
    if (difficultiesWithScores.includes(difficulty)) {
      render.context.font = '30px Arial';
      render.context.fillStyle = ground.render.fillStyle;
      render.context.fillText(score, 5, 30);
    }

    // take death screenshots
    if (shouldTakeDeathScreenshot && deathScreenshots.length == 0) {
      render.canvas.toBlob(blob => {
        deathScreenshots.push(blob);
      });
    }

    // move camera
    if (dead) {
      Render.lookAt(
        render,
        Composite.allBodies(engine.world).filter(body => body.position.y <= deathDetector.position.y && (
          is_playing_level ? (!body.label.includes('realGround')) : (!body.label.includes('victoryDetector'))
        )),
        {
          x: 100,
          y: 100
        }
      );

      shouldTakeDeathScreenshot = true;
    }
    else {
      if (recent && recent.placed && recent.position.y - camera_y <= 100)
        camera_y -= 5;

      // move camera
      Render.lookAt(
        render,
        [{
          bounds: {
            min: {
              x: 0,
              y: camera_y
            },
            max: {
              x: cnvWidth,
              y: cnvHeight + camera_y
            }
          }
        }]
      );
    }

    // send vertices to server
    // if in multiplayer game
    if (is_playing_multiplayer) {
      socket.volatile.emit('game data', {
        vertices: Composite.allBodies(engine.world).map(body => body.vertices.map(vertice => [vertice.x, vertice.y])),
        score
      });
    }
  });

  const showDeathScreenTimeoutFunc = () => {
    // clear timeout
    if (typeof showDeathScreenTimeout == 'number')
      clearTimeout(showDeathScreenTimeout);
    showDeathScreenTimeout = null;

    // stop recording
    if (mediaRecorder && mediaRecorder.state == 'recording')
      mediaRecorder.stop();
    else
      console.warn(`[%ci%c] Didn\'t stop recording because state is in "${mediaRecorder?.state}"`, 'font-family: webdings;', '');

    // update death screen scores
    scoreH.innerText = score;
    bestScoreH.innerText = bestScore;

    // show death screen
    deathScreen.style.display = 'flex';
    container.style.display = 'none';
    multiplayerGameScreen.style.display = 'none';
    joinGameScreen.style.display = 'none';

    // change chrome theme
    themeColorMeta.content = 'black';

    // change top left/right colors
    topLeft.style.color = 'white';
    topRight.style.color = 'white';

    // change tip
    updateTip();

    // change retry button
    if (is_playing_level) {
      retryBtn.innerText = 'Retry level';
    }
    else {
      retryBtn.innerText = 'Retry';
    }

    // show or hide recording button
    enableRecording();
  };

  // when a collision starts
  Events.on(engine, 'collisionStart', async e => {
    for (const pair of e.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;

      // sound effect
      if ((
        a.label.includes('block') &&
        (dead ? true : !a.placed)
      ) || (
          b.label.includes('block') &&
          (dead ? true : !b.placed)
        )
      )
        await playPopAudio();

      // if a body collides with the deathDetector
      if (
        (!won) && (
          a.label == 'deathDetector' ||
          b.label == 'deathDetector'
        )
      ) {
        if (difficultiesWithDeaths.includes(difficulty)) {
          console.log('[%cw%c] Death', 'font-family: webdings;', '');

          if (!tests[1]) {
            if (!dead) {
              // if new best score
              if (score > bestScore) {
                // save best score
                bestScore = score;
              }

              deathInfo.innerText = '';

              // save to DB
              fetch('/submit-score?filterAwarded=true' + (isCheesgle? `&uid=${cheesgle('uid') || ''}` : ''), {
                method: 'POST',
                body: `${difficulty},${score},${+is_playing_level},${is_playing_level ? is_playing_level_lid : ''},0`
              })
                .then(resp => resp.json())
                .then(resp => {
                  console.log(`[%c\xC2%c] Sent score to server (IPL = ${+is_playing_level}):`, 'font-family: webdings;', '', resp.message);
                  deathInfo.innerText = resp.message;

                  if (resp.achievements.length > 0) {
                    getAchievements()
                      .then(data => {
                        showPopup('Achievements completed!', `<ul>${resp.achievements.map(id => `<li><h3>${achievements_cache.achievements[id].name}</h3></li>`).join('')}</ul>`);
                      })
                      .catch(err => {
                        showPopup('Error', `Error showing achievements:<br><samp>${err}</samp>`);
                      });
                  }
                })
                .catch(err => {
                  console.log('[%cr%c] Error submitting score to server:', 'font-family: webdings;', '', err);
                });

              // check if in a multiplayer game
              if (is_playing_multiplayer) {
                // send death to server
                socket.emit('death');
              }
              else {
                // show death screen
                showDeathScreenTimeout = setTimeout(showDeathScreenTimeoutFunc, 2500);
              }

              // wake all bodies
              Composite.allBodies(engine.world).forEach(body => {
                if (body.label.includes('block')) {
                  // wake body
                  Matter.Sleeping.set(body, false);
                }
              });
            }

            dead = true;
          }
        }
      }

      // remove static so that it's
      // only static for one frame
      if (!tests[2]) {
        if (a.label.includes('block') && a.placed) {
          Body.setStatic(a, false);
          //Matter.Sleeping.set(a, false);
        }
        if (b.label.includes('block') && b.placed) {
          Body.setStatic(b, false);
          //Matter.Sleeping.set(b, false);
        }
      }

      // make static for no bouncing
      // and save placed state
      if (a.label.includes('block') && !a.placed) {
        if (tests[3])
          Body.setStatic(a, true);
        if (tests[4])
          Matter.Sleeping.set(a, true);
        if (tests[5]) {
          if (Math.abs(a.angularVelocity) <= tests[5.1]) {
            Body.setAngularVelocity(a, 0);
            Body.setVelocity(a, { x: 0, y: 0 });
          }
        }
        if (tests[6]) {
          if (Math.abs(a.velocity.x) <= tests[6.1]) {
            Body.setAngularVelocity(a, 0);
            Body.setVelocity(a, { x: 0, y: 0 });
          }
        }
        a.checkVelocityNextTick = true;
        a.placed = true;
      }
      if (b.label.includes('block') && !b.placed) {
        if (tests[3])
          Body.setStatic(b, true);
        if (tests[4])
          Matter.Sleeping.set(b, true);
        if (tests[5]) {
          if (Math.abs(b.angularVelocity) <= tests[5.1]) {
            Body.setAngularVelocity(b, 0);
            Body.setVelocity(b, { x: 0, y: 0 });
          }
        }
        if (tests[6]) {
          if (Math.abs(b.velocity.x) <= tests[6.1]) {
            Body.setAngularVelocity(b, 0);
            Body.setVelocity(b, { x: 0, y: 0 });
          }
        }
        b.checkVelocityNextTick = true;
        b.placed = true;
      }

      // make blocks static
      if (tests[2] || creativeControls.static) {
        if (a.label.includes('block'))
          Body.setStatic(a, true);
        if (b.label.includes('block'))
          Body.setStatic(b, true);
      }

      // creative controls static
      if (creativeControls.static) {
        if (a.label.includes('block'))
          a.label += ' ground';
        if (b.label.includes('block'))
          b.label += ' ground';
      }

      // prevent from sinking into the ground
      if (!dead) {
        if (a.label.includes('block') && a.position.y >= 390)
          Body.setPosition(a, {
            x: a.position.x,
            y: 380.1
          });
        if (b.label.includes('block') && b.position.y >= 390)
          Body.setPosition(b, {
            x: b.position.x,
            y: 380.1
          });
      }

      if (window.log_collision_labels)
        console.log(a.label, '||', b.label)

      // wake up bodies
      if (a.label.includes('wake_up_once') || b.label.includes('wake_up_once')) {
        Matter.Sleeping.set(a, false);
        Matter.Sleeping.set(b, false);
      }
    }
  });

  Events.on(engine, 'collisionActive', e => {
    for (const pair of e.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;

      // if a body collides with the victoryDetector
      if (
        (
          is_playing_level &&
          (!is_playing_multiplayer) &&
          (!dead) &&
          (!won)
        ) && (
          a.label.includes('victoryDetector') ||
          b.label.includes('victoryDetector')
        )
      ) {
        const c = a.label.includes('victoryDetector') ? b : a;

        if (c.placed && c.label.includes('block') && c.velocity.y <= 0.2) {
          console.log('[%cw%c] Victory', 'font-family: webdings;', '');

          // save victory so the following only runs once
          won = true;

          // send to server
          fetch('/submit-score?filterAwarded=true' + (isCheesgle? `&uid=${cheesgle('uid') || ''}` : ''), {
            method: 'POST',
            body: `${difficulty},${score},1,${is_playing_level_lid},1`
          })
            .then(resp => resp.json())
            .then(resp => {
              updateLevels();
            })
            .catch(err => {
              console.error('[%cr%c] Error submitting score to server:', 'font-family: webdings;', '', err);
            });

          setTimeout(() => {
            // show victory screen
            victoryScreen.style.display = 'unset';
            container.style.display = 'none';
            accountScreen.style.display = 'none';
            achievementsScreen.style.display = 'none';
          }, 2000);
        }
      }

      // wake up bodies
      if (a.label.includes('wake_up') || b.label.includes('wake_up')) {
        Matter.Sleeping.set(a, false);
        Matter.Sleeping.set(b, false);

        if (!a.label.includes('wake_up2'))
          a.label += ' wake_up2';
        if (!b.label.includes('wake_up2'))
          b.label += ' wake_up2';
      }
    }
  });

  Events.on(engine, 'collisionEnd', e => {
    for (const pair of e.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;

      // stop waking up bodies
      if (a.label.includes('wake_up2'))
        a.label = a.label.replace(/( wake_up2)|(wake_up2 )/g, '');
      if (b.label.includes('wake_up2'))
        b.label = b.label.replace(/( wake_up2)|(wake_up2 )/g, '');
    }
  });

  // on space
  const clickHandler = e => {
    if (
      !dead &&
      typeof current != 'number' && (
        (e.type == 'keydown' && e.code == 'Space') ||
        (e.type == 'touchstart') ||
        (e.type == 'mousedown')
      ) &&
      !render.canvas.classList.contains('canvas-bg')
    ) {
      // increment step
      step++;

      // drop the block
      Body.setStatic(current, false);

      // wake it up
      Matter.Sleeping.set(current, false);

      // reset speeds
      Body.setAngularVelocity(current, 0);
      Body.setVelocity(current, { x: 0, y: 0 });

      current.placed = false;

      recent = current;
      current = 0;

      if (difficultiesWithScores.includes(difficulty))
        score++;
      else
        score = 0;

      // update canvas debug info
      updateCanvasDebugInfo();
    }

    // video recording
    if (enableRecording(false) && (!dead) && getComputedStyle(container).display != 'none' && !isRecording) {
      isRecording = true;

      // create stream
      if (!stream)
        stream = render.canvas.captureStream(24);

      // create media recorder
      if (!mediaRecorder) {
        try {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: "video/webm; codecs=vp8"
          });
        } catch (err) {
          const lower = err.message.toLowerCase();

          if (lower.includes('notsupportederror') && lower.includes('mimetype')) {
            // mime type not supported, disable recording
            settings.enableRecording = 'false';
          }
        }

        if (mediaRecorder) {
          // when data is received
          mediaRecorder.ondataavailable = e => {
            console.log('[%c\xB7%c] Received recording data', 'font-family: webdings;', '');

            if (enableRecording(false))
              recordedChunks.push(e.data);
          };

          mediaRecorder.onstart = e => {
            console.log('[%c\xB7%c] Started recording', 'font-family: webdings;', '');
            isRecording = true;

            // clear old blob from memory
            URL.revokeObjectURL(downloadRecordingLink.href);

            // clear video from link
            downloadRecordingLink.href = 'javascript:;';
          };

          // when recording stops
          mediaRecorder.onstop = e => {
            if (!enableRecording(false))
              return;

            // create a blob
            recordedBlob = new Blob(recordedChunks, {
              type: "video/webm"
            });

            // create a blob url
            recordedUrl = URL.createObjectURL(recordedBlob);

            // set the download link to the blob url
            downloadRecordingLink.href = recordedUrl;

            console.log('[%c\xB7%c] Stopped recording', 'font-family: webdings;', '');

            isRecording = false;
          };
        }
      }

      // delete old recording
      recordedChunks.length = 0;

      // start recording
      if (enableRecording(false) && mediaRecorder)
        mediaRecorder.start(60 * 1000);
    }

    // view falling blocks for longer
    if (typeof showDeathScreenTimeout == 'number') {
      clearTimeout(showDeathScreenTimeout);
      showDeathScreenTimeout = setTimeout(showDeathScreenTimeoutFunc, 1000);
    }
  };
  window.addEventListener('keydown', clickHandler);
  render.canvas.addEventListener('touchstart', clickHandler);
  render.canvas.addEventListener('mousedown', clickHandler);

  // popup ok button
  popupOkBtn.addEventListener('click', e => {
    hidePopup();
  });

  // home, buy, select and prize wheel buttons
  document.addEventListener('click', e => {
    // home buttons
    if (e.target.matches('button.home-btn, button.home-btn *')) {
      // disconnect from server
      socket.disconnect();

      // show home screen
      homeScreen.style.display = '';
      deathScreen.style.display = 'none';
      victoryScreen.style.display = 'none';
      leaderboardScreen.style.display = 'none';
      multiplayerScreen.style.display = 'none';
      joinGameScreen.style.display = 'none';
      shopScreen.style.display = 'none';
      accountScreen.style.display = 'none';
      container.style.display = 'none';
      creativeControlsDiv.style.display = 'none';
      achievementsScreen.style.display = 'none';
      levelsScreen.style.display = 'none';

      // stop physics
      runner.enabled = false;

      // change chrome theme
      themeColorMeta.content = themeColor;

      topLeft.style.color = '';
      topRight.style.color = '';

      // make canvas the background
      if (canvasBackground) {
        document.body.appendChild(render.canvas);
        render.canvas.classList.add('canvas-bg');

        // resize
        render.canvas.width = window.innerSmall;
        render.canvas.height = render.canvas.width;
        render.options.width = render.canvas.width;
        render.options.height = render.canvas.width;
      } else {
        render.options.width = cnvWidth;
        render.options.height = cnvHeight;
        render.canvas.width = render.options.width;
        render.canvas.height = render.options.height;
      }

      // update user data
      try {
        getUserData2();
      }
      catch (err) {
        console.log('Error loading user data:', err);
      }

      // remove GET params from URL
      history.replaceState(null, '', location.pathname);
    }

    // daily spin buttons
    else if (e.target.matches('div.shop-item button.daily-spin-btn')) {
      // update prize wheel
      prizeWheel.draw();

      // draw marker
      drawPrizeWheelMarker();

      // show prize wheel screen
      prizeWheelScreen.style.display = 'flex';

      // save daily spin
      prizeWheelBtn.classList.add('daily-spin');
    }

    // buy buttons
    else if (e.target.matches('div.shop-item button.buy-btn')) {
      const fullId = getFullIdFromButton(e.target);

      e.target.disabled = true;

      console.log('Buying', fullId);
      buyFromShop(fullId).then(resp => {
        resp.text().then(text => {
          if (resp.status != 200)
            showPopup('Error buying item', text);

          console.log('Bought item:', text);

          updateShop();
        });
      }).catch(err => {
        showPopup('Error', 'There was an error buying the following item, please try again later.');

        console.log('[%cr%c] Error buying item:', 'font-family: webdings;', '', err);

        e.target.disabled = false;
      });
    }

    // select buttons
    else if (e.target.matches('div.shop-item button.select-btn')) {
      const fullId = getFullIdFromButton(e.target);

      e.target.disabled = true;

      selectItem(fullId).then(([text, resp]) => {
        if (resp.status == 200)
          updateShop();
        else
          showPopup('Error', `Error selecting item:<br><samp>${text}</samp>`);
      }).catch(err => {
        showPopup('Error', 'There was an error selecting the following item, please try again later.');

        console.log('[%cr%c] Error selecting item:', 'font-family: webdings;', '', err);

        e.target.disabled = false;
      });
    }

    // prize wheel buttons
    else if (e.target.matches('div.shop-item button.prize-wheel-btn')) {
      // update prize wheel
      prizeWheel.draw();

      // draw marker
      drawPrizeWheelMarker();

      // show prize wheel screen
      prizeWheelScreen.style.display = 'flex';

      // remove daily spin
      prizeWheelBtn.classList.remove('daily-spin');
    }

    // prize wheel background
    else if (e.target.matches('div#prize-wheel-screen')) {
      // if prize wheel isn't spinning
      if (!prizeWheel.isSpinning) {
        // hide prize wheel screen
        prizeWheelScreen.style.display = 'none';

        // update shop
        updateShop();

        // update coins
        getUserData2();
      }
    }

    // change user submit
    else if (e.target.matches('button#change-user-subm')) {
      const id = document.querySelector('input#change-user-inp')?.value.trim();

      if (id) {
        cheesgle('uid', id); cheesgleIsClosing = true;
        try { localStorage.removeItem('uid'); } catch (err) { };
        try { Cookies.set('uid', id); } catch (err) { };

        showPopup('Loading', 'Loading new account', {
          persistent: true,
          button: null
        });

        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    }

    // level
    else if (e.target.matches('div#levels-screen div#levels div.level')) {
      const lock = e.target.querySelector('.level-lock');
      const locked = e.target.classList.contains('locked-level');

      const lid = parseInt(e.target.dataset.lid);
      const lp1 = lid + 1;

      if (locked) {
        // ask if wants to skip
        getUserData(null, true).then(user => {
          if (lid <= user.level + 1)
            getShop(true).then(shop => {
              showPopup('Skip level?', `Do you want to skip level ${lp1} for<i class="material-icons" style="vertical-align: middle; font-size: 1.3em;">attach_money</i>${shop.levels.skipPrice} coins?<br><button data-lid="${lid}" id="skip-level-btn" class="deep green">Skip level</button>`, {
                button: 'Cancel'
              });
            });
        });

        if (lock.dataset.anim)
          clearTimeout(parseInt(lock.dataset.anim));

        lock.style.animationName = 'shake';
        lock.dataset.anim = setTimeout(() => {
          lock.style.animationName = '';
          delete lock.dataset.anim;
        }, 500);
        return;
      }

      if (isNaN(lid) || typeof lid != 'number')
        return;

      playLevel(lid);
    }

    // skip level button
    else if (e.target.matches('button#skip-level-btn')) {
      e.target.disabled = true;

      fetch('/skip-level', {
        method: 'POST',
        body: 'true',
        headers: {
          'Content-Type': 'text/plain'
        }
      })
        .then(resp => {
          if (resp.ok) {
            hidePopup();
            getUserData2().then(() => {
              updateLevels();
            });
          } else {
            resp.text().then(text => {
              showPopup('Error', `Error skipping level: ${text}`);
            });
          }
        });
    }
  });

  // when user clicks outside popup
  popupContainer.addEventListener('click', e => {
    if (e.target.matches('div#popup-container')) {
      // check if popup is persistent
      if (popupContainer.classList.contains('persistent')) {
        console.debug('Prevented hiding popup because it is persistent');
      }
      else
        hidePopup();
    }
  });

  // retry button
  retryBtn.addEventListener('click', e => {
    console.log('[%cq%c] Resetting...', 'font-family: webdings;', '');

    // clear blocks
    clearBlocks();

    // move canvas into container
    container.appendChild(render.canvas);

    // remove the background class
    if (canvasBackground)
      render.canvas.classList.remove('canvas-bg');

    // show container and hide death screen
    container.style.display = 'flex';
    deathScreen.style.display = 'none';

    // change chrome theme
    themeColorMeta.content = themeColor;

    // reset nick and coins color
    topLeft.style.color = '';
    topRight.style.color = '';

    // reset current
    current = 0;

    // reset step
    step = 1;

    // stop death
    dead = false;

    // stop win
    won = false;

    // reset score
    score = 0;

    // reset camera
    camera_y = 0;
    render.bounds.min.x = 0;
    render.bounds.min.y = 0;
    render.bounds.max.x = render.options.width;
    render.bounds.max.y = render.options.height;

    // reset death screenshots
    deathScreenshots.length = 0;
    shareScoreDownload.href = 'javascript:;';

    // level
    if (is_playing_level && is_playing_level_lid) {
      playLevel(is_playing_level_lid, false);
    }
  });

  // share score button
  shareScoreBtn.addEventListener('click', e => {
    console.debug('[%ci%c] There are', 'font-family: webdings;', '', deathScreenshots.length, 'saved death screenshots');

    switch (settings.shareScoreBtnAction) {
      case 'share':
        if (!(navigator.canShare && navigator.share)) {
          console.log('This browser does not support sharing');
          showPopup('Error', 'This browser doesn\'t support sharing');
          return;
        }

        const toShare = {
          text: 'Check out my score in Perfectly Balanced!',
          url: 'https://pb.luisafk.repl.co',
          files: [
            new File([
              deathScreenshots[0]
            ], 'perfectly-balanced-score.png', {
              type: deathScreenshots[0].type
            })
          ]
        };

        if (navigator.canShare(toShare)) {
          navigator.share(toShare).then(() => {
            console.log('Shared death screenshots');
          }).catch(err => {
            console.error('Error sharing death screenshots:', err);
          });
        }
        else {
          delete toShare.files;
          toShare.text = `I got a score of ${score} in Perfectly Balanced!`;

          if (navigator.canShare(toShare)) {
            navigator.share(toShare).then(() => {
              console.log('Shared score text');
            }).catch(err => {
              console.error('Error sharing score text:', err);
            });
          }
          else {
            showPopup('Error', 'Your browser doesn\'t support sharing');
            console.log('This browser does not support sharing the deathScreenshots or text');
          }
        }
        break;
      case 'download':
        const fr = new FileReader();
        fr.onload = e => {
          shareScoreDownload.href = e.target.result;
          shareScoreDownload.click();
        };
        fr.readAsDataURL(deathScreenshots[0]);
        break;
      case 'copy':
        const blob = deathScreenshots[0];
        navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]).then(() => {
          showPopup('Copied', 'Image was copied to clipboard');
        }).catch(err => {
          showPopup('Error', `There was an error copying the image to the clipboard:<br><samp>${err}</samp>`);
        });
        break;
    }
  });

  // camera scroll
  if (tests[0])
    render.canvas.addEventListener('wheel', e => {
      if (e.deltaY > 0)
        camera_y += 5;
      else if (e.deltaY < 0)
        camera_y -= 5;
    });

  // on window resize
  const resizeHandler = e => {
    if (window.innerWidth < window.innerHeight) {
      container.style.width = '100vw';
      container.style.height = 'auto';
    }
    else {
      container.style.width = 'auto';
      container.style.height = '100vh';
    }
  };
  window.addEventListener('resize', resizeHandler);
  resizeHandler();

  // easy btn
  easyBtn.addEventListener('click', e => {
    is_playing_level = false;
    is_playing_level_lid = null;

    // reset
    retryBtn.click();

    // fix grounds
    resetGrounds();

    // set difficulty
    setDifficulty('easy');

    // resize canvas
    render.canvas.width = window.innerSmall;
    render.canvas.height = window.innerSmall;
    render.options.width = window.innerSmall;
    render.options.height = window.innerSmall;

    // start physics
    runner.enabled = true;

    container.style.display = 'flex';
    homeScreen.style.display = 'none';

    // show/hide canvas debug info
    showCanvasDebugInfo();
  });

  // hard button
  hardBtn.addEventListener('click', e => {
    is_playing_level = false;
    is_playing_level_lid = null;

    // reset
    retryBtn.click();

    // fix grounds
    resetGrounds();

    // set difficulty
    setDifficulty('hard');

    // resize canvas
    render.canvas.width = window.innerSmall;
    render.canvas.height = window.innerSmall;
    render.options.width = window.innerSmall;
    render.options.height = window.innerSmall;

    // start physics
    runner.enabled = true;

    container.style.display = 'flex';
    homeScreen.style.display = 'none';

    // show/hide canvas debug info
    showCanvasDebugInfo();
  });

  // levels btn
  levelsBtn.addEventListener('click', e => {
    updateLevels();

    setTimeout(() => {
      window.scrollTo(0, levelsDiv.clientHeight);
    }, 500);

    // show levels screen
    levelsScreen.style.display = 'unset';
    homeScreen.style.display = 'none';
    container.style.display = 'none';
  });

  // creative button
  creativeBtn.addEventListener('click', e => {
    is_playing_level = false;
    is_playing_level_lid = null;

    // reset
    retryBtn.click();

    // fix grounds
    resetGrounds();

    // set difficulty
    setDifficulty('creative');

    // resize canvas
    render.canvas.width = window.innerSmall;
    render.canvas.height = window.innerSmall;
    render.options.width = window.innerSmall;
    render.options.height = window.innerSmall;

    // start physics
    runner.enabled = true;

    container.style.display = 'flex';
    homeScreen.style.display = 'none';

    // show/hide canvas debug info
    showCanvasDebugInfo();
  });

  // multiplayer button
  multiplayerBtn.addEventListener('click', e => {
    multiplayerScreen.style.display = 'unset';
    homeScreen.style.display = 'none';
    deathScreen.style.display = 'none';
    shopScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';

    // change chrome theme
    themeColorMeta.content = themeColor;
  });

  // new game button
  newGameBtn.addEventListener('click', e => {
    if (navigator.onLine) {
      if (socket.connected)
        socket.disconnect();

      socket.connect();

      socket.emit('new game');
    }
    else {
      showPopup('Error', 'Cannot create new game when offline');
    }
  });

  // join game button
  joinGameBtn.addEventListener('click', e => {
    joinGameScreen.style.display = 'unset';
    multiplayerScreen.style.display = 'none';
  });

  // join game id button
  joinGameIdBtn.addEventListener('click', e => {
    if (navigator.onLine) {
      if (socket.connected)
        socket.disconnect();

      socket.connect();

      socket.emit('join game', joinGameIdInp.value);
    }
    else {
      showPopup('Error', 'Cannot join game when offline');
    }
  });

  // leaderboard button
  leaderboardBtn.addEventListener('click', e => {
    leaderboardScreen.style.display = 'flex';
    homeScreen.style.display = 'none';

    let currentUid = null;
    try {
      currentUid = Cookies.get('uid');
    } catch (err) { } if (!currentUid) {
      try {
        currentUid = localStorage.getItem('uid');
      } catch (err) { } if (!currentUid) {
        currentUid = cheesgle('uid');
      }
    }

    getLeaderboard().then(async data => {
      leaderboardList.textContent = '';

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        let user = {};
        try {
          user = await getUserData(row[0]);
        }
        catch (err) {
          console.error('Error fetching user data:', err);
          continue;
        }

        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        const td2 = document.createElement('td');
        const td3 = document.createElement('td');
        const td4 = document.createElement('td');

        td1.innerText = `#${i + 1}`;
        td2.innerText = user?.nick || '';
        td3.innerText = row[1];
        td4.innerText = user?.coins || 0;

        td2.translate = false;
        td4.translate = false;

        // nick colors
        if (user.itemsSelected && user.itemsSelected['nickColors'])
          if (nickColorClasses.includes(user.itemsSelected['nickColors']))
            td2.classList.add(user.itemsSelected['nickColors']);
          else
            td2.style.color = user.itemsSelected['nickColors'];

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);

        // if its the current user
        if (row[0] == currentUid) {
          tr.classList.add('leaderboard-this-user');
        }

        leaderboardList.appendChild(tr);
      }
    }).catch(err => {
      showPopup('Error', `Error loading leaderboard:<br><samp>${err}</samp>`);
    });
  });

  // shop button
  shopBtn.addEventListener('click', e => {
    shopScreen.style.display = 'unset';
    homeScreen.style.display = 'none';
    deathScreen.style.display = 'none';

    // change chrome theme
    themeColorMeta.content = themeColor;

    updateShop();
  });

  // edit nick button
  editNick.addEventListener('click', e => {
    nickInp.contentEditable = true;
    nickInp.focus();
    selectElementContents(nickInp);
  });

  // cretive controls
  creativeControlsDiv.addEventListener('click', e => {
    if (e.target.matches('input[type=checkbox]')) {
      e.target.blur();
      render.canvas.focus();
      console.debug('[%ci%c] Blurred checkbox and focused canvas', 'font-family: webdings;', '');
    }
    else if (e.target.matches('button#creative-reset-camera')) {
      // reset camera
      render.bounds.min.x = 0;
      render.bounds.min.y = 0;
      render.bounds.max.x = render.options.width;
      render.bounds.max.y = render.options.height;
      camera_y = 0;

      // reset current
      if (typeof current != 'number')
        Composite.remove(engine.world, current);

      current = 0;
    }
    else if (e.target.matches('button#creative-clear-bodies')) {
      // clear bodies
      clearBlocks();

      // reset current
      if (typeof current != 'number')
        Composite.remove(engine.world, current);

      current = 0;
    }
  });
  creativeControlsDiv.addEventListener('input', e => {
    if (e.target.matches('select#creative-image-rendering')) {
      render.canvas.style.imageRendering = e.target.value;
      e.target.value = getComputedStyle(render.canvas).imageRendering;
    }
  });

  // on keys
  const nickHandler = e => {
    if (nickInp.contentEditable) {
      if (e.code == 'Enter' || e.type == 'blur') {
        nickInp.contentEditable = false;
        fetch('/set-nick', {
          method: 'POST',
          body: nickInp.innerText
        });
      }
      else if (e.code == 'Escape') {
        nickInp.contentEditable = false;
        nickInp.innerText = user_cache?.nick || '';
      }
    }
  };
  nickInp.addEventListener('keydown', nickHandler);
  nickInp.addEventListener('blur', nickHandler);

  // get user data
  Promise.allSettled([getUserData2(true)]).then(res => {
    if (res[0].status == 'rejected')
      console.log('[%cr%c] Error updating user data:', 'font-family: webdings;', '', res[0].reason);

    // update account switcher
    updateAccountSwitcher();

    // update levels
    updateLevels();

    // update Copy Game ID font size
    gameIdCopy.style.fontSize = getComputedStyle(gameIdSpan).fontSize;

    // update app version
    let current = getCurrentVersion();
    getLatestVersion(current).then(version => {
      // update current version
      current = version.current;
      if (isCheesgle) cheesgle('version', current);
      else localStorage.setItem('version', current);

      // update version indicator
      PWAVersionSpan.innerText = current;

      // update version status
      if (version.latest > current)
        PWAVersionStatus.innerText = `(latest is v${version.latest})`;
      else
        PWAVersionStatus.innerText = `(latest)`;

      // enable/disable update button
      updatePWABtn.disabled = !version.updateRequired;
      if (version.updateRequired) {
        updatePWABtn.innerText = 'Update required';
      }
      else {
        updatePWABtn.innerText = 'Up to date';
      }

      // check if should show update prompt (after two days)
      // also check if update is required
      if ((!window.isShowingCreateAccountPopup) && version.updateRequired && navigator.onLine) {
        showPopup('Loading', `Loading game data, please wait...<br><div id="loading-game-data-progcont"><div id="loading-game-data-prog"></div></div>`, {
          button: null,
          persistent: true
        });

        const progcont = document.querySelector('div#popup #popup-body div#loading-game-data-progcont');
        const prog = progcont.querySelector('div#loading-game-data-prog');

        // clear cache
        clearCacheBtn.click();

        // reload in 2 seconds
        setTimeout(() => {
          // save new version
          if (isCheesgle) cheesgle('version', version.latest);
          else localStorage.setItem('version', version.latest);

          // reload
          location.reload();
        }, 1925);
      }
    }).catch(err => {
      console.log('[%cr%c] Error fetching app version:', 'font-family: webdings;', '', err);
    });
  });

  // when Open settings button is clicked
  document.addEventListener('click', e => {
    if (!e.target.matches('button.settings-btn'))
      return;

    hidePopup();

    accountDiv.click();

    // scroll to updates if necessary
    if (e.target.classList.contains('update-settings-btn'))
      PWAUpdateHeader.scrollIntoView();
  });

  // when game ID clicked
  gameIdCopy.addEventListener('click', e => {
    navigator.clipboard.writeText(`https://ae0.repl.co/p/${gameIdSpan.innerText}`);
  });

  // when joined multiplayer game
  socket.on('joined game', game_id => {
    // run physics
    runner.enabled = true;

    is_playing_multiplayer = true;
    is_playing_level = false;

    // reset
    retryBtn.click();
    clearBlocks();
    resetGrounds();

    multiplayerGameScreen.style.display = 'grid';
    homeScreen.style.display = 'none';
    multiplayerScreen.style.display = 'none';
    joinGameScreen.style.display = 'none';

    gameIdSpan.innerText = game_id;

    if (user_cache.nick)
      leftNick.innerText = user_cache.nick;
    rightNick.innerText = 'Waiting for player';

    rightCanvas.style.visibility = 'hidden';

    // prevent canvas from being background
    if (canvasBackground)
      render.canvas.classList.remove('canvas-bg');
    leftUserDiv.appendChild(render.canvas);
  });

  // when multiplayer game starts
  socket.on('start game', ids => {
    is_playing_multiplayer = true;

    // make easy
    setDifficulty('easy');

    // show right canvas
    rightCanvas.style.visibility = 'visible';

    // reset
    retryBtn.click();

    // set block borders
    rightCtx.strokeStyle = 'transparent';

    // move canvas into multiplayer screen
    leftUserDiv.appendChild(render.canvas);

    // hide container
    container.style.display = 'none';

    // make sure we are always on the left
    if (ids[1] == Cookies.get('uid')) {
      ids[1] = ids[0];
      ids[0] = Cookies.get('uid');
    }

    const user_promises = ids.map(getUserData);

    Promise.all(user_promises).then(users => {
      leftNick.innerText = users[0].nick;
      rightNick.innerText = users[1].nick;

      // nick colors
      if (users[0].itemsSelected && users[0].itemsSelected['nickColors']) {
        const color = users[0].itemsSelected['nickColors'];

        if (nickColorClasses.includes(color))
          leftNick.classList.add(color);
        else
          leftNick.style.color = color;
      }
      if (users[1].itemsSelected && users[1].itemsSelected['nickColors']) {
        const color = users[1].itemsSelected['nickColors'];

        if (nickColorClasses.includes(color))
          rightNick.classList.add(color);
        else
          rightNick.style.color = color;
      }

      if (users[1].itemsSelected && users[1].itemsSelected['blockColors']) {
        const color = users[1].itemsSelected['blockColors'];

        if (color in blockColorClasses)
          rightCtx.fillStyle = blockColorClasses[color];
        else
          rightCtx.fillStyle = color;
      }
      else {
        rightCtx.fillStyle = 'white';
      }
    });
  });

  // when receive oponent data
  socket.on('game data', data => {
    // clear canvas
    rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);

    // draw blocks
    for (const vertice of (data.vertices || [])) {
      draw(vertice, rightCtx);
    }

    // draw score
    rightCtx.font = '30px Arial';
    rightCtx.fillText(data.score || 0, 5, 30);
  });

  // when there is a winner
  socket.on('winner', id => {
    if (id == Cookies.get('uid')) {
      // show victory screen
      victoryScreen.style.display = 'unset';
      multiplayerGameScreen.style.display = 'none';
      container.style.display = 'none';
    }
    else {
      // show death screen
      showDeathScreenTimeoutFunc();
    }
  });

  // when socket.io connects
  socket.on('connect', () => {
    console.log('[%ci%c] Socket.IO connected', 'font-family: webdings;', '');
  });

  // get disconnect explanations
  let last_disconnect_reason = '';
  socket.on('disconnect reason', reason => {
    last_disconnect_reason = reason;
  });

  // when socket.io disconnects
  socket.on('disconnect', nerd_reason => {
    console.log('[%ci%c] Disconnected from server:', 'font-family: webdings;', '', nerd_reason);

    if (nerd_reason != 'io client disconnect')
      setTimeout(() => {
        showPopup('Disconnected from server', last_disconnect_reason);
      });
  });

  // #protocol
  if (parsedHash.has('protocol')) {
    // remove hash from URL
    location.hash = '';

    protocol = decodeURIComponent(parsedHash.get('protocol'));

    if (protocol.startsWith('web+perfectlybalanced://'))
      protocol = protocol.substr(24);

    console.debug('Received protocol:', protocol);

    parsedProtocol = new URLSearchParams(protocol);
  }

  // #gameId
  if (parsedHash.has('gameId') || parsedProtocol.has('gameId')) {
    // remove hash from URL
    location.hash = '';

    joinGameIdInp.value = parsedHash.get('gameId') || parsedProtocol.get('gameId');

    console.log('Joining game from hash, gameId =', joinGameIdInp.value);

    multiplayerBtn.click();
    joinGameBtn.click();
  }

  // #easyMode
  else if (parsedHash.has('easyMode') || parsedProtocol.has('easyMode')) {
    // remove hash from URL
    location.hash = '';

    // go into easy mode
    easyBtn.click();
  }

  // #hardMode
  else if (parsedHash.has('hardMode') || parsedProtocol.has('hardMode')) {
    // remove hash from URL
    location.hash = '';

    // go into hard mode
    hardBtn.click();
  }

  // refresh shop button
  refreshShopBtn.addEventListener('click', e => {
    refreshShopBtn.disabled = true;
    updateShop();
  });

  // create prize wheel
  let prizeWheel = new Winwheel({
    textFontSize: 15,
    canvasId: 'prize-wheel',
    numSegments: 0,
    innerRadius: 50,
    outerRadius: 200,
    segments: [

    ],
    animation: {
      type: 'spinToStop',
      duration: 5,
      spins: 8,
      callbackBefore: 'this.target.isSpinning = true;',
      callbackAfter: 'drawPrizeWheelMarker(true, true);',
      callbackFinished: 'this.target.isSpinning = false; this.target.currentTime++; nextSpin(); drawPrizeWheelMarker(true, true);'
    },
    isSpinning: false,
    times: 1,
    currentTime: 0
  });

  // draw prize wheel marker
  drawPrizeWheelMarker(true, true);

  // when prize wheel button clicked
  prizeWheelBtn.addEventListener('click', e => {
    // is daily spin
    const isDailySpin = prizeWheelBtn.classList.contains('daily-spin');

    if (!prizeWheel.isSpinning) {
      console.log(`[%ci%c] Spinning prize wheel (isDailySpin = ${isDailySpin})`, 'font-family: webdings;', '');

      // reset spins
      prizeWheel.currentTime = 0;

      // disable button
      prizeWheelBtn.disabled = true;

      // disable x10 checkbox
      prizeWheelTenInp.disabled = true;

      // get times to spin
      const times = prizeWheel.times;

      // get prize from server
      getPrizeWheelPrize(times, isDailySpin).then(([prizes, resp]) => {
        // update coins
        getUserData2();

        if (resp.status == 200) {
          console.log(`[%ci%c] Received prizes from server%c: ${prizes.map(p => prizeWheel.segments[p].text).join(', ')}`, 'font-family: webdings;', '', 'color: white;');

          // save prizes in prizeWheel object
          prizeWheel.prizes = prizes;

          // stop physics
          runner.enabled = false;

          // start spin
          nextSpin();
        }
        else {
          // show alert
          showPopup('Error', prizes);

          // enable button
          prizeWheelBtn.disabled = false;
          prizeWheelTenInp.disabled = false;
        }
      }).catch(err => {
        showPopup('Prize wheel error', `There was an error fetching your prizes:<br><samp>${err}</samp>`);

        // enable button
        prizeWheelBtn.disabled = false;
        prizeWheelTenInp.disable = false;
      });
    }
  });

  window.nextSpin = function nextSpin() {
    if (prizeWheel.currentTime >= prizeWheel.times)
      return;

    // set the wheel to stop at the
    // prize returned by the server
    prizeWheel.animation.stopAngle = prizeWheel.getRandomForSegment(prizeWheel.prizes[prizeWheel.currentTime]);

    // reset the wheel angle so it
    // does all of the spins
    prizeWheel.rotationAngle = 0;

    // spin the wheel
    prizeWheel.startAnimation();
  }

  // when x10 checkbox changed
  prizeWheelTenInp.addEventListener('change', e => {
    if (prizeWheelTenInp.checked) {
      prizeWheel.times = 10;
      prizeWheel.animation.duration = 1;
      prizeWheel.animation.spins = 1;
    }
    else {
      prizeWheel.times = 1;
      prizeWheel.animation.duration = 5;
      prizeWheel.animation.spins = 8;
    }
  });

  // when update button is clicked
  updatePWABtn.addEventListener('click', e => {
    PWAVersionStatus.innerText = '(fetching version info)';
    let current = getCurrentVersion();
    getLatestVersion(current).then(version => {
      current = version.current;

      PWAVersionStatus.innerText = '(updating)';
      clearCacheBtn.click();
      setTimeout(() => {
        PWAVersionStatus.innerText = '(reloading)';

        // save new version
        if (isCheesgle) cheesgle('version', version.latest);
        else localStorage.setItem('version', version.latest);

        location.reload();
      }, 5000);
    }).catch(err => {
      PWAVersionStatus.innerText = '(update failed)';
      showPopup('Update error', `There was an error updating the app:<br><samp>${err}</samp>`);
    });
  });

  // when account info clicked
  accountDiv.addEventListener('click', e => {
    accountScreen.style.display = 'unset';
    homeScreen.style.display = 'none';
    achievementsScreen.style.display = 'none';
    levelsScreen.style.display = 'none';
    multiplayerScreen.style.display = 'none';
    multiplayerGameScreen.style.display = 'none';
    deathScreen.style.display = 'none';

    // update user ID
    try {
      userIdInp.value = cheesgle('uid') || Cookies.get('uid') || localStorage.getItem('uid');
    } catch (err) {
      console.log("[%cr%c] Error reading user ID:", 'font-family: webdings;', '', err);
      userIdInp.value = 'none';
    }

    // update install button
    if (getPWADisplayMode() == 'browser') {
      installPWABtn.disabled = false;
      installPWABtn.innerText = 'Install';
    }
    else {
      installPWABtn.disabled = true;
      installPWABtn.innerText = 'Installed';
    }
  });

  // account switcher
  accountSwitcher.addEventListener('change', e => {
    delete cheesgleData.uid;
    Cookies.set('uid', accountSwitcher.value);
    localStorage.removeItem('uid');
    location.reload();
  });

  // show user ID
  userIdShow.addEventListener('click', e => {
    if (userIdInp.type == 'password') {
      userIdInp.type = 'text';
      userIdShow.innerText = 'visibility_off';
    }
    else {
      userIdInp.type = 'password';
      userIdShow.innerText = 'visibility';
    }
  });

  // show change user prompt in account screen
  changeUserBtn.addEventListener('click', e => {
    showPopup('Change user', '<input type="text" id="change-user-inp" placeholder="Enter user ID" required pattern="[a-zA-Z0-9]+" class="deep green"><button id="change-user-subm" class="deep red">Change</button>');
  });

  // clear cache btn
  clearHTMLCacheBtn.addEventListener('click', async e => {
    console.log('[%c\xB3%c] Attempting to clear HTML cache', 'font-family: webdings;', '');

    (await getServiceWorker()).postMessage({
      type: 'CLEAR_HTML_CACHE'
    });
  });
  clearScriptCacheBtn.addEventListener('click', async e => {
    console.log('[%c\xB3%c] Attempting to clear script cache', 'font-family: webdings;', '');

    (await getServiceWorker()).postMessage({
      type: 'CLEAR_SCRIPT_CACHE'
    });
  });
  clearStyleCacheBtn.addEventListener('click', async e => {
    console.log('[%c\xB3%c] Attempting to clear style cache', 'font-family: webdings;', '');

    (await getServiceWorker()).postMessage({
      type: 'CLEAR_STYLE_CACHE'
    });
  });
  clearLevelsCacheBtn.addEventListener('click', async e => {
    console.log('[%c\xB3%c] Attempting to clear levels cache', 'font-family: webdings;', '');

    (await getServiceWorker()).postMessage({
      type: 'CLEAR_LEVELS_CACHE'
    });
  });
  clearCacheBtn.addEventListener('click', async e => {
    console.log('[%c\xB3%c] Attempting to clear all cache', 'font-family: webdings;', '');

    (await getServiceWorker()).postMessage({
      type: 'CLEAR_CACHE'
    });
  });

  // reload btn
  cacheReloadBtn.addEventListener('click', e => {
    location.reload();
  });

  // update CSS display-mode query
  const cssDisplayModeQuery = window.matchMedia('(display-mode: standalone)');
  if (cssDisplayModeQuery) {
    cssDisplayModeQuery.addEventListener('change', e => {
      cssDisplayModeQueryResult.innerText = e.matches;
      jsPwaCheckResult.innerText = getPWADisplayMode();
    });
  }
  cssDisplayModeQueryResult.innerText = cssDisplayModeQuery?.matches || 'null';

  // update PWA check
  jsPwaCheckResult.innerText = getPWADisplayMode();

  // when achievements clicked
  achievementsBtn.addEventListener('click', e => {
    // show achievements screen
    achievementsScreen.style.display = 'unset';

    // hide other screens
    homeScreen.style.display = 'none';
    accountScreen.style.display = 'none';
    shopScreen.style.display = 'none';
    container.style.display = 'none';

    // load achievements
    getAchievements2().catch(err => {
      showPopup('Error', `Error loading achievements:<br><samp>${err}</samp>`);
    });
  });

})();