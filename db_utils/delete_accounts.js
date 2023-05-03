const Database = require("@replit/database");
const db = new Database();

db.list().then(uids => {
  let deletable = [];

  let proms = uids.map(uid => db.get(uid));

  Promise.allSettled(proms).then(users => {
    users.forEach((user, i) => {
      if (user.status != 'fulfilled')
      {
        console.error('Error:', user.reason);
        return;
      }

      const uid = uids[i];

      const keys = Object.keys(user.value);

      if (keys.length == 1 && keys[0] == 'nick' && /Player\d+/.test(user.value.nick))
      {
        console.log(uid, user.value);
        deletable.push(uid);
      }
    });

    if (!deletable.length)
    {
      console.log('No empty accounts to delete. Check back later.');
      return;
    }

    console.log(deletable.length, 'empty accounts to delete');
    console.log('Deleting in 5 seconds (ctrl + c to cancel)');

    setTimeout(() => {
      for (const uid of deletable)
      {
        db.delete(uid).then(() => {
          console.log('Deleted', uid);
        });
      }
    }, 5000);
  });
});