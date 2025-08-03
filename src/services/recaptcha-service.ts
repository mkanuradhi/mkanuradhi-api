import AppError from '../errors/app-error';

export const verifyRecaptcha = async (captchaToken: string): Promise<void> => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const verifyUrl = process.env.RECAPTCHA_VERIFY_URL;
  if (!secretKey || !verifyUrl) {
    throw new AppError("Recaptcha secret key or verify URL is not configured.", 500);
  }
  if (!captchaToken?.trim()) {
    throw new AppError('CAPTCHA token missing', 400);
  }

  const params = new URLSearchParams({
    secret: secretKey,
    response: captchaToken,
  });

  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', },
    body: params,
  });

  const data = await response.json();
  
  if (!data.success) {
    // Google returns an array like ["timeout-or-duplicate", …]
    const codes = (data['error-codes'] ?? []).join(', ');
    throw new AppError(`CAPTCHA verification failed (${codes || 'unknown'})`, 403);
  }
}