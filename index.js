const { makeConsoleSafe } = require('safe-logging-replit');
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const Database = require('@replit/database');
const { random } = require('./static/random.js');
const fs = require('fs');
const socketio = require('socket.io');
const { parse } = require('cookie');
const shop = require('./shop.json');
const achievements = require('./achievements.json');
const leaderboardIgnore = require('./leaderboardIgnore.json');
const { OAuth2Client } = require('google-auth-library');
const dbUptime = require('./dbUptime.js');
const BadWordFilter = require('bad-words');

makeConsoleSafe(console);

const VERSION = 2.234;

const cyan = 0x5cd6ff;

// error messages
const NOUID = 'No user ID specified';
const NODATA = 'No data available';
const NONICK = 'No nickname specified';
const NOLEVEL = 'No level ID specified';

// load google client
const googleClientID =
  '537840286289-i5pbg7omij5tlo5tsdduraolb41070fj.apps.googleusercontent.com';
const googleClient = new OAuth2Client(googleClientID);

// get shop items for prize wheel
const prizeWheelItems = [];
let prizeWheelTotalChance = 0;
for (let shelfId of Object.entries(shop.shelves)) {
  const shelf = shelfId[1];
  shelfId = shelfId[0];

  for (let itemId of Object.entries(shop.shelves[shelfId].items)) {
    const item = itemId[1];
    itemId = itemId[0];

    const inPrizeWheel = shelf.prizeWheel || item.prizeWheel;

    if (inPrizeWheel && typeof item.chance == 'number' && item.chance > 0) {
      prizeWheelTotalChance += item.chance || 0;
      prizeWheelItems.push(`${shelfId}.${itemId}`);
    }
  }
}

// coins multiplier by difficulty
const coinsMultiplierByDifficulty = {
  easy: 1,
  hard: 2,
};

// bad words filter
const badWordsFilter = new BadWordFilter();

function cleanBadWords(s, filter = badWordsFilter) {
  s = s.replace(/\u200B|\u200C|\x00/g, '');

  for (const swear of filter.list) {
    if (filter.exclude && filter.exclude.includes(swear.toLowerCase())) {
      continue;
    }

    s = s.replace(
      new RegExp(
        swear.replace(/([\.\*\-\\\/\?\+\{\}\[\]\|\(\)])/g, '\\$1'),
        'gi'
      ),
      '*'.repeat(swear.length)
    );
  }

  return s;
}

const app = express();
const server = http.createServer(app);

// init database
const db = new Database();

// make database uptime key
dbUptime.makeUptimeKey(db).then(() => {
  console.log('DB Uptime Key set');
});

const db_prefix_user = 'user_';
const db_prefix_goog = 'goog_';

function parseFullId(fullId) {
  const s = fullId.trim().split('.');

  return s[1] ? s : null;
}

function checkAchievements(vars, filterAwarded = false) {
  let ids = [];

  for (let id of Object.entries(achievements.achievements)) {
    const achievement = id[1];
    id = id[0];

    // check if is already awarded
    if (filterAwarded && vars.achievements.includes(id)) continue;

    let check = false;

    // run the achievement check
    try {
      check = eval(achievement.check);
    } catch (err) {
      console.warn('Error checking achievement', err);
    }

    // if the check returneddd true
    if (check) {
      ids.push(id);
    }
  }

  return ids;
}

function getUser(uid, ...args) {
  if (!uid.startsWith(db_prefix_user)) uid = db_prefix_user + uid;
  return db.get(uid, ...args);
}

async function getUserPair(uid, ...args) {
  const user = await getUser(uid, ...args);
  return [uid, user];
}

function setUser(uid, ...args) {
  return db.set(db_prefix_user + uid, ...args);
}

async function getUsers() {
  const users = await db.list(db_prefix_user);
  return users.map((uid) => uid.substr(db_prefix_user.length));
}

function getGoog(sub, ...args) {
  return db.get(db_prefix_goog + sub, ...args);
}

function setGoog(sub, ...args) {
  return db.set(db_prefix_goog + sub, ...args);
}

async function getGoogs() {
  const googs = await db.list(db_prefix_goog);
  return googs.map((sub) => sub.substr(db_prefix_goog.length));
}

function getDailySpinStatus(user) {
  let resp = {
    ready: false,
    elapsed: null,
    remaining: null,
    now: null,
  };

  resp.now = new Date().getTime();
  resp.elapsed = resp.now - (user.lastDailyPrize || 0);
  resp.remaining = 86400000 - resp.elapsed;

  // 24h elapsed?
  if (resp.elapsed >= 86400000) {
    resp.ready = true;
  }

  return resp;
}

async function sendWebhook(message, user = null) {
  let goog = null;

  if (typeof message == 'string') {
    message = {
      content: message,
    };
  }

  if (typeof message == 'object') {
    if (user?.goog?.sub) {
      goog = await getGoog(user.goog.sub);
    }

    if (Array.isArray(message.embeds)) {
      message.embeds.forEach((embed) => {
        if (user instanceof Object) {
          if (!embed.type) {
            embed.type = 'rich';
          }

          if (!embed.color) {
            embed.color = cyan;
          }

          if (!embed.author) {
            embed.author = {
              name: user.nick,
              url: 'https://perfectly-balanced.luisafk.repl.co',
            };

            if (goog) {
              embed.author.icon_url = goog.payload.picture;
            }
          }

          if (!embed.thumbnail) {
            embed.thumbnail = {
              url: 'https://perfectly-balanced.luisafk.repl.co/favicon192.png',
              width: 192,
              height: 192,
            };
          }

          if (!embed.timestamp) {
            embed.timestamp = new Date().toISOString();
          }
        }
      });
    }
  }

  try {
    const resp = await fetch(`${process.env.DISCORD_WEBHOOK}?wait=true`, {
      method: 'POST',
      body: JSON.stringify(message),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await resp.json();
  } catch (err) {
    console.error(`Error sending Webhook, ${err}`);
    return null;
  }
}

app.use(cookieParser());
app.use(bodyParser.text({ type: 'text/*' }));
app.use(bodyParser.json());
app.set('etag', false);

app.use((req, res, next) => {
  //res.set('Content-Security-Policy', 'frame-ancestors \'self\' https://replit.com https://6969cd69-22de-463d-947c-26e44eed451b.id.repl.co https://ba7c112b-5106-499d-8710-580f1d9e68f6.id.repl.co https://perfectly-balanced-for-cheesgle.luisafk.repl.co https://byte.cheesgle.com https://one.byte.cheesgle.com');
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => {
  console.log('Referer:', req.headers['referer']);
  console.log(
    'IPADDR:',
    req.headers['x-forwarded-for'] || req.socket.remoteAddress
  );

  if (
    req.headers.host &&
    (/(perfectly-balanced[a-z\-]*--luisafk|perfectly-balanced-[a-z\-]+\.luisafk)\.repl\.co/i.test(
      req.headers.host
    ) ||
      !req.headers.host.includes('luisafk'))
  ) {
    res.redirect('https://perfectly-balanced.luisafk.repl.co');
    return;
  }

  getUsers().then((ids) => {
    let id = req.cookies['uid'];

    // if user has saved id
    // but it is not in DB
    if (id && !ids.includes(id)) {
      res.clearCookie('uid');
    }

    fs.readFile(__dirname + '/static/index.html', 'ascii', (err, data) => {
      if (err) {
        console.error('Error reading index HTML:', err);
        res.status(500);
        res.send('There was an error, please try again later.');
        return;
      }

      fs.readFile(
        __dirname + '/static/important.css',
        'ascii',
        (err, data2) => {
          if (err) {
            console.error('Error reading important CSS:', err);
            res.status(500);
            res.send('There was an error, please try again later.');
            return;
          }

          data2 = data2.replace(/^(.+)/gm, '    $1');
          data = data.replace('{{ important.css }}', data2);

          res.set('Content-Type', 'text/html');
          res.send(data);
        }
      );
    });

    if (id) {
      getUser(id).then((user) => {
        const shortNick = user.nick.substr(0, 10);

        console.log(`User "${shortNick}" loaded the game homepage`);
      });
    }
  });
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(__dirname + '/static/sitemap.xml');
});

app.get('/manifest.json', (req, res) => {
  res.set('Content-Type', 'application/manifest+json');
  res.sendFile(__dirname + '/static/manifest.json');
});

app.get('/.well-known/web-app-origin-association', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.sendFile(__dirname + '/static/web-app-origin-association.json');
});

app.get('/db-uptime', (req, res) => {
  const uptime = dbUptime.checkUptime(db, false);

  if (uptime) {
    res.send('Database is up');
  } else {
    res.status(503);
    res.send('Database is down');
  }
});

app.get('/uptime', (req, res) => {
  res.redirect('https://stats.uptimerobot.com/r5ZWgtry49');
});

app.post('/pwa-installed', (req, res) => {
  const id = req.cookies['uid'];

  if (id) {
    if (req.headers['content-type'] == 'text/plain' && req.body == 'true') {
      getUser(id).then((user) => {
        const shortNick = user?.nick?.substr(0, 10) || '';

        user.pwaInstalled = true;

        setUser(id, user).then(() => {
          console.log(`User "${shortNick}" installed PWA`);
          res.send('Saved app install');
          sendWebhook(
            {
              embeds: [
                {
                  title: 'PWA installed!',
                  description: 'A user installed the PWA',
                  fields: [
                    {
                      name: 'Version',
                      value: `v${VERSION}`,
                      inline: true,
                    },
                  ],
                },
              ],
            },
            user
          );
        });
      });
    } else {
      res.status(400);
      res.send();
    }
  } else {
    res.status(401);
    res.send(NOUID);
  }
});

app.post('/latest-pwa-version', (req, res) => {
  const current = parseFloat(req.body);

  if (typeof current == 'number') {
    let resp = {
      latest: VERSION,
      current,
      updateRequired: VERSION > current,
    };

    res.send(resp);
  } else {
    res.status(400);
    res.send('{"error":"No current version sent","status":400}');
  }
});

app.get('/new-user', (req, res) => {
  let id = req.cookies['uid'];

  if (id) {
    res.status(200);
    res.send('User ID exists');
  } else {
    getUsers().then((ids) => {
      while (true) {
        id = random();

        if (!ids.includes(id)) break;
      }

      const user = {
        nick: `Player${ids.length + 1}`,
      };

      setUser(id, user).then(() => {
        console.log(`Created user "${user.nick}"`);
        sendWebhook(
          {
            embeds: [
              {
                title: 'New user!',
                fields: [
                  {
                    name: 'Nick',
                    value: user.nick,
                    inline: true,
                  },
                  {
                    name: 'User ID',
                    value: `\`${id}\``,
                    inline: true,
                  },
                ],
              },
            ],
          },
          user
        );
      });

      res.cookie('uid', id);
      res.status(201);
      res.send('User ID created');
    });
  }
});

app.get('/get-user', (req, res) => {
  // disable cache
  res.set('Cache-Control', 'no-store');

  const id = req.query.uid || req.cookies['uid'];

  if (id) {
    getUser(id, {
      raw: true,
    }).then((data) => {
      if (data) {
        res.set('Content-Type', 'application/json');
        res.send(data);

        const user = JSON.parse(data);
        const shortNick = user.nick.substr(0, 10);

        console.log(`User "${shortNick}" loaded their profile`);
      } else {
        res.status(500);
        res.send(NODATA);
      }
    });
  } else {
    res.status(401);
    res.send(NOUID);
  }
});

app.get('/get-goog', (req, res) => {
  const id = req.cookies['uid'];

  if (id) {
    getUser(id).then((user) => {
      getGoog(user.goog.sub, {
        raw: true,
      }).then((data) => {
        res.set('Content-Type', 'application/json');
        res.send(data);
      });
    });
  } else {
    res.status(401);
    res.send(NOUID);
  }
});

app.post('/set-nick', (req, res) => {
  const id = req.cookies['uid'];

  if (typeof req.body == 'string') {
    if (id) {
      console.log(req.body);
      getUser(id).then((user) => {
        const shortNick = user.nick.substr(0, 10);

        // save old nick
        const old_nick = user.nick;

        // save, filter and trim whitespace
        user.nick = cleanBadWords(
          req.body
            .trim()
            .replace(/[\u200B\u200C\u200E\u200F\u2061\u2062\u2063\u2064]/g, '')
        );

        const shortNick2 = user.nick.substr(0, 10);

        // increment name changes
        if (typeof user.nickChanges != 'number') user.nickChanges = 0;
        if (user.nick != old_nick) user.nickChanges++;

        // update in DB
        setUser(id, user).then(() => {
          console.log(`Updated nick from "${shortNick}" to "${shortNick2}"`);
          sendWebhook(
            {
              embeds: [
                {
                  title: 'User renamed!',
                  description: 'A user changed their nick',
                  fields: [
                    {
                      name: 'Old nick',
                    },
                  ],
                },
              ],
            },
            user
          );
        });
      });
    } else {
      res.status(401);
      res.send(NOUID);
    }
  } else {
    res.status(400);
    res.send(NONICK);
  }
});

app.post('/submit-score', (req, res) => {
  const id = req.query.uid || req.cookies['uid'];
  const parsedBody = req.body.split(',');
  const difficulty = parsedBody[0].trim();
  const score = parseInt(parsedBody[1]);
  const isLevel = parsedBody[2].trim() == '1' ? true : false;
  const levelId = parseInt(parsedBody[3]);
  const levelIdP = levelId + 1;
  const levelBeaten = parsedBody[4]?.trim() == '1' ? true : false;

  if (isLevel && isNaN(levelId)) {
    res.status(400);
    res.send(NOLEVEL);
    return;
  }

  if (id) {
    getUser(id).then((user) => {
      const userLevelP = user?.level + 1;
      const shortNick = user?.nick?.substr(0, 10) || '';

      if (isLevel && levelId > user.level) {
        console.log(
          `User "${shortNick}" beat level ${levelIdP} but has only unlocked level ${userLevelP}`
        );
        res.status(400);
        res.send("The level you submitted hasn't been unlocked");
        return;
      }

      if (!user.bestScore) user.bestScore = 0;

      const oldBestScore = user.bestScore;
      const oldWorstScore = user.worstScore;

      let updatedBestScore = false;

      if (score > user.bestScore) {
        user.bestScore = score;

        console.log(
          `Changed user "${shortNick}" best score from ${oldBestScore} to ${score}`
        );
        sendWebhook(
          {
            embeds: [
              {
                title: 'New Best Score!',
                fields: [
                  {
                    name: 'Old Best Score',
                    value: oldBestScore.toString(),
                    inline: true,
                  },
                  {
                    name: 'New Best Score',
                    value: score.toString(),
                    inline: true,
                  },
                ],
              },
            ],
          },
          user
        );

        updatedBestScore = true;
      }

      if (!user.worstScore || score < user.worstScore) {
        user.worstScore = score;

        console.log(
          `Changed user "${shortNick}" worst score from ${oldWorstScore} to ${score}`
        );
        sendWebhook(
          {
            embeds: [
              {
                title: 'New Worst Score!',
                fields: [
                  {
                    name: 'Old Worst Score',
                    value: oldWorstScore ? oldWorstScore.toString() : 'None',
                    inline: true,
                  },
                  {
                    name: 'New Worst Score',
                    value: score.toString(),
                    inline: true,
                  },
                ],
              },
            ],
          },
          user
        );
      }

      // user levels
      if (typeof user.level == 'number' && user.level < 0) user.level = 0;
      if (isLevel && !user.level) user.level = 0;

      let coinsToReward = 0;
      if (!isLevel || (isLevel && levelId == user.level && levelBeaten)) {
        if (!user.coins) user.coins = 0;

        const oldCoins = user.coins;

        // reward coins from score
        coinsToReward = isLevel
          ? levelId == user.level
            ? shop.levels.reward
            : 0
          : Math.floor(score / 10) * coinsMultiplierByDifficulty[difficulty];
        user.coins += coinsToReward;

        // round coins down
        user.coins = Math.floor(user.coins);

        // make sure coins are greater than 0
        if (user.coins < 0) user.coins = 0;

        if (coinsToReward > 0) {
          console.log(
            `Changed user "${shortNick}" coins from ${oldCoins} to ${user.coins}`
          );
        }

        if (isLevel && levelId == user.level && levelBeaten) {
          user.level++;
          console.log(
            `User "${shortNick}" beat level ${levelIdP} and unlocked level ${
              user.level + 1
            }`
          );
          sendWebhook(
            {
              embeds: [
                {
                  title: 'Level beaten!',
                  fields: [
                    {
                      name: 'Level #',
                      value: levelIdP.toString(),
                      inline: true,
                    },
                    {
                      name: 'Level ID',
                      value: levelId.toString(),
                      inline: true,
                    },
                  ],
                },
              ],
            },
            user
          );
        }
      }

      const achs = checkAchievements(
        {
          achievements: [],
          ...user,
          score,
        },
        !!req.query.filterAwarded || false
      );

      if (achs.length > 0) {
        console.log(
          `Awarded user "${shortNick}" achievements ${achs
            .map((ach) => `"${achievements.achievements[ach].name}"`)
            .join(', ')}`
        );
        sendWebhook(
          {
            embeds: [
              {
                title: 'Achievements awarded!',
                fields: [
                  {
                    name: 'Achievements',
                    value: achs
                      .map(
                        (ach) =>
                          `\u200b    \u2022 ${achievements.achievements[ach].name}`
                      )
                      .join('\n'),
                    inline: false,
                  },
                ],
              },
            ],
          },
          user
        );

        if (!user.achievements) user.achievements = [];

        for (const ach of achs) {
          if (!user.achievements.includes(ach)) user.achievements.push(ach);

          switch (achievements.achievements[ach].rewardType) {
            case 'coins':
            default:
              user.coins += achievements.achievements[ach].reward;
              console.log(
                `Awarded user "${shortNick}" ${achievements.achievements[ach].reward} coins for achievement "${achievements.achievements[ach].name}"`
              );
              break;
          }
        }
      }

      setUser(id, user);

      res.send({
        message: (
          (updatedBestScore ? 'Updated best score' : '') +
          '\n' +
          (coinsToReward > 0 ? `Rewarded ${coinsToReward} coins` : '')
        ).trim(),
        achievements: achs,
      });
    });
  } else {
    res.status(401);
    res.send(NOUID);
  }
});

app.post('/skip-level', (req, res) => {
  if (req.body != 'true') {
    res.status(400);
    res.send('Not confirmed');
    return;
  }

  const id = req.cookies['uid'];

  if (id) {
    getUser(id).then((user) => {
      if (!user.coins) user.coins = 0;
      if (!user.level) user.level = 0;

      if (user.coins >= shop.levels.skipPrice) {
        user.coins -= shop.levels.skipPrice;
        user.level++;

        setUser(id, user).then(() => {
          res.send('Skipped level');
          sendWebhook(
            {
              embeds: [
                {
                  title: 'Skipped level!',
                  description: 'The user skipped a level',
                  fields: [
                    {
                      name: 'Price',
                      value: `\$${shop.levels.skipPrice}`,
                      inline: true,
                    },
                  ],
                },
              ],
            },
            user
          );
        });
      } else {
        res.status(400);
        res.send('Not enough coins');
      }
    });
  } else {
    res.status(401);
    res.send(NOUID);
  }
});

app.get('/leaderboard', (req, res) => {
  fs.stat(__dirname + '/leaderboard.json', (err, stat) => {
    if (err == null) {
      res.status(200);
      res.sendFile(__dirname + '/leaderboard.json');
    } else if (err.code === 'ENOENT') {
      res.status(500);
      res.send('Leaderboard is being calculated. Please wait');
    } else {
      console.error('Error stating leaderboard file in GET request:', err);
      res.status(500);
      res.send('File stat error.');
    }
  });
});

app.get('/shop', (req, res) => {
  res.sendFile(__dirname + '/shop.json');
});

app.post('/shop/buy', (req, res) => {
  const id = req.cookies['uid'];

  if (id) {
    if (req.body) {
      const fullId = req.body;
      const [shelfId, itemId] = parseFullId(fullId);

      if (shelfId && itemId) {
        if (shelfId in shop.shelves) {
          if (itemId in shop.shelves[shelfId].items) {
            const buyingDisabled =
              shop.shelves[shelfId].buyingDisabled ||
              shop.shelves[shelfId].items[itemId].buyingDisabled;

            if (buyingDisabled) {
              res.status(403);
              res.send('Buying this item is disabled');
            } else {
              getUser(id).then((user) => {
                const shortNick = user?.nick?.substr(0, 10) || '';

                if (user.items?.includes(fullId)) {
                  res.status(400);
                  res.send('Item already bought');
                } else {
                  const price =
                    shop.shelves[shelfId].items[itemId].price ||
                    shop.shelves[shelfId].price;
                  if (user.coins >= price) {
                    user.coins -= price;

                    if (!user.items) user.items = [];

                    if (!user.itemsSelected) user.itemsSelected = {};

                    user.items.push(fullId);

                    if (shelfId == 'coins') {
                      user.coins += shop.shelves[shelfId].items[itemId].coins;
                    } else {
                      user.itemsSelected[shelfId] = itemId;
                    }

                    setUser(id, user).then(() => {
                      res.status(200);
                      res.send('Item bought');
                      sendWebhook(
                        {
                          embeds: [
                            {
                              title: 'Item bought!',
                              description: 'An item was bought in the shop.',
                              fields: [
                                {
                                  name: 'User name',
                                  value: shortNick,
                                  inline: true,
                                },
                                {
                                  name: 'User ID',
                                  value: `\`${id}\``,
                                  inline: true,
                                },
                                {
                                  name: 'Shelf ID',
                                  value: `\`${shelfId}\``,
                                  inline: true,
                                },
                                {
                                  name: 'Item ID',
                                  value: `\`${itemId}\``,
                                  inline: true,
                                },
                                {
                                  name: 'Item price',
                                  value: price,
                                  inline: true,
                                },
                              ],
                            },
                          ],
                        },
                        user
                      );
                    });
                  } else {
                    res.status(402);
                    res.send('Not enough coins');
                  }
                }
              });
            }
          } else {
            res.status(400);
            res.send('Invalid item ID');
          }
        } else {
          res.status(400);
          res.send('Invalid shelf ID');
        }
      } else {
        res.status(400);
        res.send('Invalid ID');
      }
    } else {
      res.status(400);
      res.send('No item specified');
    }
  } else {
    res.status(401);
    res.send(NOUID);
  }
});

app.post('/shop/select', (req, res) => {
  const id = req.cookies['uid'];

  if (id) {
    const fullId = req.body;
    const [shelfId, itemId] = parseFullId(fullId);

    if (fullId && shelfId && itemId) {
      getUser(id).then((user) => {
        if (
          shop.shelves[shelfId].selectingDisabled ||
          shop.shelves[shelfId].items[itemId].selectingDisabled
        ) {
          res.status(403);
          res.send('Item cannot be selected');
          return;
        }

        if (!user.itemsSelected) user.itemsSelected = {};

        user.itemsSelected[shelfId] = itemId;

        setUser(id, user).then(() => {
          res.status(200);
          res.send('Selected item');
        });
      });
    } else {
      res.status(400);
      res.send('Invalid item ID');
    }
  } else {
    res.status(401);
    res.send(NOUID);
  }
});

app.get('/achievements', (req, res) => {
  res.sendFile(__dirname + '/achievements.json');
});

app.get('/prize-wheel', (req, res) => {
  // no cache
  res.set('Cache-Control', 'no-store');

  const id = req.cookies['uid'];
  const n = req.query.n || 1;
  const isDailySpin = req.query.isDailySpin == 'true';
  const price = isDailySpin ? 0 : (shop.prizeWheel?.price || 0) * n;

  if (id) {
    if (n < 1) {
      res.status(400);
      res.send('Invalid number of spins');
      return;
    }

    getUser(id).then((user) => {
      const shortNick = user.nick.substr(0, 10);

      let canSpin = false;

      let dailySpinStatus = getDailySpinStatus(user);

      if (isDailySpin) {
        if (n > 1) {
          res.status(400);
          res.send('You can only spin one daily spin at a time');
          return;
        }
        if (dailySpinStatus.ready) {
          // save current time
          user.lastDailyPrize = new Date().getTime();

          canSpin = true;
        } else {
          res.status(400);
          res.send('Daily spin is not ready');
          return;
        }
      } else {
        if (user.coins >= price) {
          canSpin = true;
        } else {
          res.status(400);
          res.send('Not enough coins');
          return;
        }
      }

      if (canSpin) {
        if (!user.items) user.items = [];

        if (!user.itemsSelected) user.itemsSelected = {};

        let itemsN = [];

        for (let a = 0; a < n; a++) {
          const r = Math.floor(Math.random() * prizeWheelTotalChance);
          let itemN = null;
          let fullId = null;
          let shelfId = null;
          let itemId = null;
          let chanceCounter = 0;

          for (let i = 0; i < prizeWheelItems.length; i++) {
            const _fullId = prizeWheelItems[i];
            const [_shelfId, _itemId] = parseFullId(_fullId);
            const item = shop.shelves[_shelfId].items[_itemId];

            chanceCounter += item.chance;

            if (r <= chanceCounter) {
              itemN = i + 1;
              fullId = _fullId;
              shelfId = _shelfId;
              itemId = _itemId;

              itemsN.push(itemN);

              break;
            }
          }

          let shelf = shop.shelves[shelfId];
          let item = shop.shelves[shelfId].items[itemId];

          // log message
          let isPersistent = shelf.persistent || item.persistent;
          if (isPersistent || (!user.items.includes(fullId) && !isPersistent)) {
            console.log(`User "${shortNick}" won ${fullId} in prize wheel`);
            sendWebhook(
              {
                embeds: [
                  {
                    title: 'Prize Wheel!',
                    fields: [
                      {
                        name: 'User name',
                        value: shortNick,
                        inline: true,
                      },
                      {
                        name: 'User ID',
                        value: `\`${id}\``,
                        inline: true,
                      },
                      {
                        name: 'Item ID',
                        value: `\`${fullId}\``,
                        inline: true,
                      },
                      {
                        name: 'Is Daily Spin',
                        value: `\`${isDailySpin}\``,
                        inline: true,
                      },
                    ],
                  },
                ],
              },
              user
            );
          }

          // add item to user's items
          if (!isPersistent)
            if (!user.items.includes(fullId)) user.items.push(fullId);

          // select the item
          if (!(shelf.selectingDisabled || item.selectingDisabled))
            user.itemsSelected[shelfId] = itemId;

          // give reward
          let coins = shelf.coins || item.coins;
          if (coins) user.coins += coins;
        }

        // take coins
        user.coins -= price;

        setUser(id, user).then(() => {
          res.status(200);
          res.send(itemsN.join(','));
        });
      } else {
        res.status(400);
        res.send('You are not allowed to spin at this time');
        return;
      }
    });
  } else {
    res.status(401);
    res.send(NOUID);
  }
});

app.get('/prize-wheel/total', (req, res) => {
  // no cache
  res.set('Cache-Control', 'no-store');

  res.status(200);
  res.send(prizeWheelTotalChance.toString());
});

app.get('/prize-wheel/daily/status', (req, res) => {
  // no cache
  res.set('Cache-Control', 'no-store');

  const id = req.query.uid || req.cookies['uid'];

  if (id) {
    getUser(id).then((user) => {
      if (!user.lastDailyPrize) user.lastDailyPrize = 0;

      const status = getDailySpinStatus(user);

      res.send(status);
    });
  } else {
    res.status(401);
    res.send('Unauthorized');
  }
});

app.post('/googleToken', (req, res) => {
  // no cache
  res.set('Cache-Control', 'no-store');

  const id = req.cookies['uid'];

  googleClient
    .verifyIdToken({
      idToken: req.body?.credential,
      audience: googleClientID,
    })
    .then((ticket) => {
      const payload = ticket.getPayload();

      console.log(
        `User ${payload.email}${payload.email_verified ? '✅' : ''} "${
          payload.name
        }" signed in with Google`
      );
      getUser(id).then((user) => {
        sendWebhook(
          {
            embeds: [
              {
                title: 'Signed in with Google!',
                fields: [
                  {
                    name: 'Email',
                    value: payload.email,
                    inline: true,
                  },
                  {
                    name: 'Email verified',
                    value: payload.email_verified.toString(),
                    inline: true,
                  },
                  {
                    name: 'Name',
                    value: payload.name,
                    inline: true,
                  },
                  {
                    name: 'Google User ID',
                    value: payload.sub,
                    inline: true,
                  },
                  {
                    name: 'Expires',
                    value: `<t:${payload.exp}>`,
                    inline: true,
                  },
                  {
                    name: 'Issuer',
                    value: payload.iss,
                    inline: true,
                  },
                  {
                    name: 'Issued at',
                    value: `<t:${payload.iat}>`,
                    inline: true,
                  },
                  {
                    name: 'Organization',
                    value: payload.hd || 'None',
                    inline: true,
                  },
                ],
              },
            ],
          },
          user
        );
      });

      getGoogs().then((googs) => {
        if (googs.includes(payload.sub)) {
          // goog exists
          getGoog(payload.sub).then((goog) => {
            if (!goog.ids) goog.ids = [];

            if (id && goog.ids.includes(id)) {
              goog.payload = payload;
              setGoog(payload.sub, goog).then(() => {
                getUser(id).then((user) => {
                  if (!user.goog) user.goog = {};

                  // save goog sub in user
                  user.goog.sub = payload.sub;

                  setUser(id, user).then(() => {
                    res.send('Updated account');
                  });
                });
              });
            } else {
              if (id) {
                goog.ids.push(id);
                setGoog(payload.sub, goog);
              }
              res.cookie('uid', goog.ids[0]);
              res.send('Signed in to account');
            }
          });
        } else {
          // goog doesn't exist, create
          let goog = {
            ids: [id],
            payload,
          };

          // save goog
          setGoog(payload.sub, goog).then(() => {
            getUser(id).then((user) => {
              if (!user.goog) user.goog = {};

              // save goog sub in user
              user.goog.sub = payload.sub;

              setUser(id, user).then(() => {
                res.send('Linked Google account');
              });
            });
          });
        }
      });
    })
    .catch((err) => {
      console.error('Error on Google sign-in:', err);
      res.status(500);
      res.send('Error on sign in');
    });
});

app.use(express.static(__dirname + '/static'));

const io = new socketio.Server(server, {
  cors: {
    origin: '*',
  },
});

let connected_users = {};
let game_data = {};

function disconnect(socket, reason = null) {
  if (reason) socket.emit('disconnect reason', reason);

  socket.disconnect();

  if (socket.id in connected_users) delete connected_users[socket.id];
}

io.on('connection', (socket) => {
  const cookieHeader =
    socket.handshake.headers.cookie || socket.handshake.headers['x-cookie'];
  const cookies = cookieHeader ? parse(cookieHeader) : {};

  const id = cookies['uid'];

  let game_id = null;

  if (id) {
    // if user already connected
    if (id in connected_users) {
      disconnect(socket, 'You are already connected (maybe in another tab)');
      return;
    } else {
      connected_users[socket.id] = id;
    }
  } else {
    // if no user ID sent
    disconnect(socket, 'Not logged in');
    return;
  }

  socket.on('new game', () => {
    let room_id = null;

    while (true) {
      room_id = random().substr(0, 6).toUpperCase();

      if (!io.sockets.adapter.rooms.get(room_id)) break;
    }

    console.log(`Created new multiplayer game with ID ${room_id}`);
    getUser(id).then((user) => {
      sendWebhook(
        {
          embeds: [
            {
              title: 'New multiplayer game!',
              fields: [
                {
                  name: 'Room ID',
                  value: room_id,
                  inline: true,
                },
                {
                  name: 'Join link',
                  value: `[click to join](https://perfectly-balanced.luisafk.repl.co/#gameId=${room_id})`,
                  inline: true,
                },
              ],
            },
          ],
        },
        user
      );
    });

    socket.join(room_id);
    game_id = room_id;

    game_data[room_id] = {
      users: {},
    };

    game_data[room_id].users[socket.id] = {
      score: 0,
      dead: false,
    };

    socket.emit('joined game', room_id);
  });

  socket.on('join game', (room_id) => {
    if (room_id) {
      // get users in room
      let users = io.sockets.adapter.rooms.get(room_id);

      if (!users || users.size == 0 || !game_data[room_id]) {
        disconnect(socket, 'Game does not exist');
        return;
      } else if (users.size == 1) {
        socket.join(room_id);
        socket.emit('joined game', room_id);
        io.to(room_id).emit(
          'start game',
          [socket.id, ...users].map((sid) => connected_users[sid])
        );
        game_id = room_id;

        game_data[room_id].users[socket.id] = {
          score: 0,
          dead: false,
        };
      } else {
        disconnect(socket, 'Game is full');
        return;
      }
    } else {
      disconnect(socket, 'No game ID specified');
      return;
    }
  });

  socket.on('game data', (data) => {
    if (game_id) {
      if (data) {
        game_data[game_id].users[socket.id].score = data.score || 0;
        socket.in(game_id).volatile.emit('game data', data);
      } else {
        disconnect(socket, 'Sent no game data');
        return;
      }
    } else {
      disconnect(socket, 'Sent game data but not in a game');
      return;
    }
  });

  const deathHandler = () => {
    if (game_data[game_id]?.users[socket.id]) {
      game_data[game_id].users[socket.id].dead = true;

      let bestUser = null;
      let allDead = true;

      for (const socket_id of Object.keys(game_data[game_id].users)) {
        const user = game_data[game_id].users[socket_id];

        if (!bestUser || user.score > game_data[game_id].users[bestUser].score)
          bestUser = socket_id;

        if (!user.dead) {
          allDead = false;
          break;
        }
      }

      if (allDead) {
        io.in(game_id).emit('winner', connected_users[bestUser]);
      }
    } else {
      console.log(
        "Received death but either user is not in a game or game doesn't exist"
      );
      if (game_data[game_id]?.users instanceof Array) {
        io.sockets.sockets.forEach((socket) => {
          if (game_data[game_id].users.includes(socket.id)) {
            disconnect(
              socket,
              'There was a server error, please try again later'
            );
            return;
          }
        });
      }
    }
  };

  socket.on('death', deathHandler);

  socket.on('disconnect', () => {
    delete connected_users[socket.id];

    // mark user as disconnected
    if (game_data[game_id])
      game_data[game_id].users[socket.id].disconnected = true;
    else {
      game_id = null;
      return;
    }

    // call death handler which marks
    // user as dead and announces winner
    deathHandler();

    // if all users are disconnected
    if (
      Object.entries(game_data[game_id].users).every(
        (user) => user[1].disconnected
      )
    ) {
      // delete this game's data
      delete game_data[game_id];
      game_id = null;
    }
  });
});

// start the server
server.listen(3000, () => {
  // print database viewer link for easy access
  // note: link unclickable because of safe-logging-replit
  console.log('Server started, database URL:');
  console.log(
    `https://replit-database-viewer.luisafk.repl.co/?url=${Buffer.from(
      process.env['REPLIT_DB_URL']
    ).toString('base64')}\n`
  );
});

// calculate leaderboard
setInterval(() => {
  console.log('Calculating leaderboard');

  // get all user IDs
  getUsers().then((ids) => {
    users = ids
      .filter((id) => !leaderboardIgnore.includes(id))
      .map((id) => getUserPair(id));

    // await promises
    Promise.all(users).then((users) => {
      // sort by best scores
      users = users.sort(
        (a, b) => (b[1].bestScore || 0) - (a[1].bestScore || 0)
      );

      // get best 25
      users = users.slice(0, 25);

      // get only IDs and best scores
      users = users.map((user) => [user[0], user[1].bestScore || 0]);

      // convert to JSON
      const json = JSON.stringify(users, null, 2);

      // save to file
      fs.writeFile(__dirname + '/leaderboard.json', json, 'ascii', (err) => {
        if (err) console.error('Error saving leaderboard to file:', err);
        else console.log('Saved leaderboard to file');
      });
    });
  });
}, 90000);
