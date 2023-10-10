import { useState, useRef, useCallback } from 'react';
import './index.css';
import { CSSTransition } from 'react-transition-group';
import { useAppStartup } from './useAppStartup';
import { useChatData } from './useChatData';
import { api } from './api';
import ReCAPTCHA from 'react-google-recaptcha';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_PUBLIC;

console.log('SITE_KEY', SITE_KEY);
const CheckIcon = () => (
  <svg
    className="w-full h-full text-green-500 mx-auto"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 12L9 18L22 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SuccessPage = () => (
  <div className="p-8 w-full text-center">
    <div className="w-16 h-16 mx-auto mb-4 relative">
      <CheckIcon />
      <div className="absolute inset-0 bg-green-200 opacity-10 rounded-full"></div>
    </div>
    <h2 className="text-2xl font-bold mb-2">Success!</h2>
    <p className="">
      You're successfully completed verification process. You can close this
      window.
    </p>
  </div>
);

const ChatRules = ({ chatData }) => (
  <div className="p-8 w-full mx-4">
    <div className="text-center mb-6">
      <span className="text-xl font-bold mb-2">Welcome to the chat</span>
      <div className="text-4xl mt-2 mb-4">{chatData.chatTitle}</div>
    </div>
    {chatData.rules ? (
      <div className="text-center">
        <span className="mb-4 text-lg">
          Please, accept these rules before entering the chat:
        </span>
        <ul className="mt-4 list-decimal list-inside">
          {chatData.rules.map((x, index) => (
            <li key={index} className="mt-2 text-lg">
              {x}
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
);

function App() {
  const [isShowSuccess, setShowSuccess] = useState(false);
  const captchaRef = useRef(null);
  const params = new URLSearchParams(window.Telegram.WebApp.initData);
  const verificationId = params.get('start_param');
  const initData = window.Telegram.WebApp.initData;

  const onRecaptchaReady = useCallback(() => {
    window.Telegram.WebApp.MainButton.hideProgress();
    window.Telegram.WebApp.MainButton.enable();
  }, []);

  const onVerify = useCallback(async (token: string) => {
    if (!token) {
      console.error('Captcha token is null or undefined.');
      return;
    }

    try {
      const data = await api<{ success?: boolean; error?: string }>(
        '/challenge',
        { verificationId, body: { recaptchaToken: token, initData } },
      );

      if (data.success) {
        setShowSuccess(true);
        window.Telegram.WebApp.MainButton.hideProgress();
        window.Telegram.WebApp.MainButton.text = 'Return to chat';
        window.Telegram.WebApp.MainButton.color = '#21C004';
        window.Telegram.WebApp.MainButton.onClick(() => {
          window.Telegram.WebApp.close();
        });
      } else {
        console.error('Backend verification failed:', data.error);
      }
    } catch (error) {
      console.error('Error verifying captcha with backend:', error);
    }
  }, []);

  useAppStartup({ captchaRef, onVerify });
  const { chatData, fatalError } = useChatData({
    verificationId,
    initData,
  });

  return (
    <div className="flex items-center justify-center">
      <CSSTransition
        in={!fatalError && !isShowSuccess && !!chatData}
        timeout={500}
        classNames="fade"
        unmountOnExit
      >
        {() =>
          fatalError || (!isShowSuccess && !!chatData) ? (
            <ChatRules chatData={chatData} />
          ) : null
        }
      </CSSTransition>
      <ReCAPTCHA
        ref={captchaRef}
        sitekey={SITE_KEY}
        asyncScriptOnLoad={onRecaptchaReady}
        size="invisible"
      />
      <CSSTransition
        in={isShowSuccess}
        timeout={500}
        classNames="fade"
        unmountOnExit
      >
        {() => (isShowSuccess ? <SuccessPage /> : null)}
      </CSSTransition>
    </div>
  );
}

export default App;
