import logger from "../config/Logger";

const init = async (): Promise<Object> => {
  logger.info(`API is working`);
  return {"msg": "Welcome to the mkanuradhi API"};
}

export { init };
