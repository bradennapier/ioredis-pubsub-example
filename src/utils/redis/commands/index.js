/* @flow */
import type { RChan$Descriptor } from 'utils/redis';

import * as session from './session';

/*
  Proxies function calls to the session to add
  our redis channel to them as the first argument.
*/
function proxied(inst, target) {
  return new Proxy(target, {
    get(...get) {
      const prop = Reflect.get(...get);
      if (typeof prop === 'function') {
        return (...args) => prop(inst.chan.tx, ...args);
      }
      return prop;
    },
    set(obj, prop) {
      throw new Error(`You may not modify ${prop}`);
    },
  });
}

class RedisCommands {
  +chan: $Shape<RChan$Descriptor>;
  +session = proxied(this, session);
  constructor(chan: $Shape<RChan$Descriptor>) {
    this.chan = chan;
  }
}

/*
  Shortcut utility commands provided with channels.
*/
export default RedisCommands;
