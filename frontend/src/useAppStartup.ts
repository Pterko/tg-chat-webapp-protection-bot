import { MutableRefObject, useEffect } from 'react';
import type ReCaptcha from 'react-google-recaptcha';

export function useAppStartup({
  captchaRef,
  onVerify
}: {
  captchaRef: MutableRefObject<ReCaptcha>;
  onVerify: (token: string) => Promise<void>
}) {
  useEffect(() => {
    const mainButtonHandler = async () => {
      console.log('ONCLICK RECEIVED');
      window.Telegram.WebApp.MainButton.showProgress(true);
      const token = await captchaRef.current.executeAsync();
      await onVerify(token);
    };

    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.MainButton.setText('Enter Chat');
    window.Telegram.WebApp.MainButton.onClick(mainButtonHandler);
    window.Telegram.WebApp.MainButton.show();

    return () => {
      console.log('CLEANUP RUN');
      window.Telegram.WebApp.MainButton.offClick(mainButtonHandler);
    };
  }, []);
}
