import logger from "../config/logger-config";

const init = async (): Promise<Object> => {
  logger.info(`API is working`);
  return {"msg": "Welcome to the mkanuradhi API"};
}

export { init };
