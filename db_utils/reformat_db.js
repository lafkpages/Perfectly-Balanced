const Database = require("@replit/database");
const db = new Database();

db.list().then(keys => {
  for (const key of keys)
  {
    db.get(key).then(value => {
      if (!value?.items)
        return;

      const oldLength = value.items.length;

      let newItems = [];

      for (const item of value.items) {
        if (!newItems.includes(item))
          newItems.push(item);
      }

      value.items = newItems;

      db.set(key, value).then(() => {
        console.log(`UID=${key}  OLD=${oldLength}  NEW=${newItems.length}`);
      });
    });
  }
});