import { MutableRefObject, useEffect } from 'react';
import type Reaptcha from 'reaptcha';

export function useAppStartup({
  captchaRef,
}: {
  captchaRef: MutableRefObject<Reaptcha>;
}) {
  useEffect(() => {
    const mainButtonHandler = () => {
      console.log('ONCLICK RECEIVED');
      window.Telegram.WebApp.MainButton.showProgress(true);
      captchaRef.current.execute();
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
