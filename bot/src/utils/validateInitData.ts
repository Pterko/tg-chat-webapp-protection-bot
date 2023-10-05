import * as crypto from 'crypto';

interface ValidationResult {
    isValid: boolean;
    data: { [key: string]: any };
}

/**
 * Validate data received from Mini App
 * 
 * @param initData - The initData received from Telegram.WebApp.initData
 * @param botToken - The bot's token (defaults to process.env.BOT_TOKEN)
 * @returns ValidationResult
 */
function validateDataFromMiniApp(initData: string, botToken: string = process.env.BOT_TOKEN as string): ValidationResult {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash') || "";

  if (!receivedHash) return { isValid: false, data: {} };

  params.delete('hash');

  let parsedData: { [key: string]: any } = {};
  for (const [key, value] of params.entries()) {
      try {
          parsedData[key] = JSON.parse(decodeURIComponent(value));
      } catch (err) {
          parsedData[key] = value;
      }
  }

  // Check for outdated data
  const authDate = params.get('auth_date');
  if (authDate && (Date.now() / 1000) - parseInt(authDate) > 86400) {
      return { isValid: false, data: parsedData };
  }

  // Create the data-check-string
  const dataCheckString = Array.from(params.keys())
      .sort()
      .map(key => `${key}=${params.get(key)}`)
      .join('\n');

  // Compute the secret_key
  const secretKeyHmac = crypto.createHmac('sha256', "WebAppData");
  const secretKey = secretKeyHmac.update(botToken).digest();

  // Verify integrity of data
  const dataHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  
  return {
      isValid: dataHash === receivedHash,
      data: parsedData
  };
}



export default validateDataFromMiniApp;