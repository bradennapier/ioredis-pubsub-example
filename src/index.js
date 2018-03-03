import 'app-module-path/register';

import path from 'path';
import createRedisChannel from 'utils/redis';

const channelID = 'chan';

const redisConfig = {
  path: path.resolve('~/redis.sock'),
};

let chan;

function tryParse(payload) {
  try {
    return JSON.parse(payload);
  } catch (e) {
    return payload;
  }
}

function tryStringify(payload) {
  try {
    return JSON.stringify(payload);
  } catch (e) {
    return payload;
  }
}

function handleReceiveMessage(channelID, payload) {
  const payload = tryParse(payload);
  console.log(
    `
    -------- ${channelID} --------
  `,
    payload,
    `
    -------- ------------ --------
  `,
  );
}

function sendMessage(_payload) {
  const payload = tryStringify(_payload);
  return chan.tx.publish(channelID, payload);
}

function startApplication() {
  console.log('Creating Redis Channel');
  chan = createRedisChannel(channelID, redisConfig);

  console.log('Setting up Event Callbacks');

  chan.rx.on('message', handleReceiveMessage);

  console.log('Subscribing to Channel "foo:bar"');
  chan.rx.subscribe(channelID);
}
