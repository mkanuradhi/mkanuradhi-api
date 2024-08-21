import logger from "../config/Logger";

const sendEmail = async (name: string, email: string, message: string): Promise<Object> => {

  logger.info(`Email sent ${name}`);
  
  return {"msg": "success"};
}

export { sendEmail };
