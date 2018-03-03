/* @flow */
import type Redis from 'ioredis';
import type { Datastream$SessionState } from 'types/datastream';

import { timein } from 'utils/time';

// The shape saved upon systemIdentityID sessions.
export type Redis$SessionStateShapes = {|
  +systemIdentityID: Datastream$SessionState,
  +dealerIdentityID: {},
  +projectIdentityID: {},
|};

export type Redis$SessionTypes = $Keys<Redis$SessionStateShapes>;

export type Redis$SessionState<T> = $Shape<
  $ElementType<Redis$SessionStateShapes, T>,
>;

// a hash storing session information about a specific
// client generally with a ttl of 1 day from connection
// or disconnection time.
function getSessionMetaKey(type: string, id: string) {
  return `session:${type}:${id}:meta`;
}

// a list of keys that should be referenced by the client
// when they connect.
function getSessionKeySet(type: string, id: string) {
  return `session:${type}:${id}:keyset`;
}

/* Capture the session hash for the given type/id */
export function getIdentitySession<R: Redis, T: Redis$SessionTypes>(
  redis: R,
  type: T,
  id: string,
): Promise<void | { [key: string]: any }> {
  const key = getSessionMetaKey(type, id);
  return redis.hgetall(key);
}

export function setIdentitySession<
  R: Redis,
  T: Redis$SessionTypes,
  V: Redis$SessionState<T>,
>(redis: R, type: T, id: string, value: V): Promise<'OK'> {
  const key = getSessionMetaKey(type, id);
  return redis.hmset(key, value);
}

export function setGetIdentitySession<
  R: Redis,
  T: Redis$SessionTypes,
  V: Datastream$SessionState,
>(
  redis: R,
  type: T,
  id: string,
  value: V,
): Promise<void | Datastream$SessionState> {
  const key = getSessionMetaKey(type, id);

  if (!value.identity) {
    throw new Error(
      '[ERROR] | [REDIS] | setGetIdentitySession | identity not found in value',
    );
  }

  // set the session to expire in 1 days
  const opts = {
    expires: timein(1, 'day'),
  };

  return redis.hsetifget(key, {}, value, opts);
}

export function setGetIfIdentitySession<
  R: Redis,
  T: Redis$SessionTypes,
  V: Datastream$SessionState,
>(
  redis: R,
  type: T,
  id: string,
  value: V,
): Promise<void | Datastream$SessionState> {
  const key = getSessionMetaKey(type, id);

  if (!value.identity) {
    throw new Error(
      '[ERROR] | [REDIS] | setGetIdentitySession | identity not found in value',
    );
  }

  // only set if the identity matches our current identity
  const ifValue = { identity: value.identity };

  // set the session to expire in 1 days
  const opts = {
    expires: timein(1, 'day'),
  };

  return redis.hsetifget(key, ifValue, value, opts);
}

// resets the ttl of the identity session key (defaults to in 1 day)
export function refreshIdentitySession<R: Redis, T: Redis$SessionTypes>(
  redis: R,
  type: T,
  id: string,
  time?: number = timein(1, 'day'),
): Promise<1 | 0> {
  const key = getSessionMetaKey(type, id);
  return redis.pexpireat(key, time);
}

// removes a session
export function removeIdentitySession<R: Redis, T: Redis$SessionTypes>(
  redis: R,
  type: T,
  id: string,
): Promise<1 | 0> {
  const key = getSessionMetaKey(type, id);
  return redis.del(key);
}

export function getSessionState<R: Redis, T: Redis$SessionTypes>(
  redis: R,
  type: T,
  id: string,
) {
  const keyset = getSessionKeySet(type, id);
  return redis.getkeyset(keyset);
}

export function removeSessionState<R: Redis, T: Redis$SessionTypes>(
  redis: R,
  type: T,
  id: string,
  ...keys: Array<string>
) {
  const keyset = getSessionKeySet(type, id);
  return redis.delkeyset(keyset, ...keys);
}

export function setSessionState<
  R: Redis,
  T: Redis$SessionTypes,
  V: { [key: string]: * },
>(redis: R, type: T, id: string, key: string, value: V): Promise<'OK'> {
  const keyset = getSessionKeySet(type, id);
  return redis.setkeyset(keyset, key, value);
}
