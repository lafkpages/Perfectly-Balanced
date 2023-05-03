const KEY = 'uptime-test';

class UptimeError extends Error
{
  constructor(message)
  {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  KEY,
  UptimeError,
  makeUptimeKey: async db => {
    try {
      await db.set(KEY, true);
    } catch (err) {
      throw new UptimeError('Could not make uptime key');
    }
  },
  checkUptime: async (db, err=true) => {
    try {
      const val = await db.get(KEY);

      if (val !== true)
        throw new UptimeError('Uptime key does not contain the correct uptime value');

      return true;
    } catch (err) {
      if (err)
        throw new UptimeError('Database is down');
      else
        return false;
    }
  }
};