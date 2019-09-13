import { sleepSeconds } from '../utils';
import { createSession, setLogger } from './carwings';

import * as messaging from "../messaging";
import { logger } from "../logger";

const AC_ON_START = () => ({type: "API", action: "AC_ON_START"});
const AC_ON_POLLING = loop => ({type: "API", action: "AC_ON_POLLING", loop: loop});
const AC_ON_SUCCESS = () => ({type: "API", action: "AC_ON_SUCCESS"});
const AC_ON_TIMEOUT = () => ({type: "API", action: "AC_ON_TIMEOUT"});
const AC_ON_FAILURE = error => ({type: "API", action: "AC_ON_FAILURE", result: error});


const LOGIN_START = {type: "API", action: "LOGIN_START"};
const LOGIN_COMPLETE = {type: "API", action: "LOGIN_COMPLETE"};
const LOGIN_FAILED = {type: "API", action: "LOGIN_FAILED"};
const nissanLogin = async (settings) => {
  const session = createSession(settings.companion.username, settings.companion.password);

  messaging.send(LOGIN_START);
  try {
    await session.connect();
    messaging.send(LOGIN_COMPLETE);
  } catch (error) {
    const errMessage = Object.assign({error: error}, LOGIN_FAILED);
    messaging.send(errMessage);
    return null;
  }

  return session;
};

export const startAC = async (settings) => {
  if (settings.companion.demo) {
    logger.debug(`demo: ${settings.companion.demo}`);
    return;
  }
  const session = await nissanLogin(settings);

  // START
  const resultKey = await session.leafRemote.startClimateControl();
  messaging.send(AC_ON_START());


  // init the loop counter and the timeout
  let loop = 0;
  let isTimeout = false;

  // after apiTimeout seconds flip the isTimeout flag
  let timeout = setTimeout(
    () => isTimeout = true,
    settings.companion.apiTimeout * 1000
  );

  let climateResult = session.leafRemote.getStartClimateControlRequest(resultKey);
  try {
    while (!await climateResult && !isTimeout) {
      // announce new loop and sleep
      loop += 1;
      messaging.send(AC_ON_POLLING(loop));
      logger.warn(`Climate start result not ready yet.  Sleeping: ${settings.companion.apiPollInterval} seconds`);
      await sleepSeconds(settings.companion.apiPollInterval);

      // get a promise for the new result
      climateResult = session.leafRemote.getStartClimateControlRequest(resultKey);
    }

    // we have a climateResult or a timeout
    if (isTimeout) {
      messaging.send(AC_ON_TIMEOUT());
      logger.warn("Climate Start Timed Out!!!");
    } else {
      logger.debug(`climateResult: ${JSON.stringify(climateResult)}`);
      messaging.send(AC_ON_SUCCESS());
      logger.warn("Climate Start Succeeded!!!");
    }
  } catch (error) {
    messaging.send(AC_ON_FAILURE(error));
    logger.error(`Climate Start Failed on Error: ${error}!!!`);
  } finally {
    // cleanup the timeout timer
    clearTimeout(timeout);
  }
};