import React, { useState, useEffect, useRef } from 'react'
import './index.css'
import Reaptcha from 'reaptcha';

const CheckIcon = () => (
  <svg className="w-full h-full text-green-500 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12L9 18L22 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SuccessPage = () => (
  <div className="flex items-center justify-center">
    <div className="p-8 w-full text-center">
      <div className="w-16 h-16 mx-auto mb-4 relative">
        <CheckIcon />
        <div className="absolute inset-0 bg-green-200 opacity-10 rounded-full"></div>
      </div>
      <h2 className="text-2xl font-bold mb-2">Success!</h2>
      <p className="">You're successfully completed verification process. You can close this window.</p>
    </div>
  </div>
);

const ChatRules = ({ chatData }) => (
  <div className="flex items-center justify-center">
    <div className="p-8 w-full mx-4">
      <div className="text-center mb-6">
        <span className="text-xl font-bold mb-2">Welcome to the chat</span>
        <div className="text-4xl mt-2 mb-4">{chatData.chatTitle}</div>
      </div>
      {chatData.rules ? (
        <div className="text-center">
          <span className="mb-4 text-lg">Please, accept these rules before entering the chat:</span>
          <ul className="mt-4 list-decimal list-inside">
            {chatData.rules.map((x, index) => (
              <li key={index} className="mt-2 text-lg">{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  </div>
);

function App() {
  const [fatalError, setFatalError] = useState("");
  const [isShowSuccess, setShowSuccess] = useState(false);
  const [chatData, setChatData] = useState(null);
  const captchaRef = useRef(null);
  const params = new URLSearchParams(window.Telegram.WebApp.initData);
  const startParam = params.get('start_param');


  useEffect(() => {
    const mainButtonHandler = () => {
      console.log('ONCLICK RECEIVED')
      window.Telegram.WebApp.MainButton.showProgress(true);
      captchaRef.current.execute();
      // onVerify("test");
    }

    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.MainButton.text = "Enter Chat";
  
    window.Telegram.WebApp.MainButton
    window.Telegram.WebApp.MainButton.onClick(mainButtonHandler);
    console.log('Set onclick handler !!!!!!!!!!!!!!!!')
    window.Telegram.WebApp.MainButton.show();
    return () => {
      console.log('CLEANUP RUN')
      window.Telegram.WebApp.MainButton.offClick(mainButtonHandler);
    }
  }, [])





  useEffect(() => {
    if (!startParam) {
      console.error("start_param (userObjId) not found in initData.");
      setFatalError("Incorrect start parameter");
      return;
    }

    async function loadData() {
      try {
        const response = await fetch(`/api/verifications/${startParam}/getChat`, { method: 'GET' });
        const data = await response.json();

        if (data.success) {
          setChatData(data.data);
        } else {
          setFatalError("Error while getting chat data");
        }
      } catch (error) {
        setFatalError("Error while fetching data");
        console.error("Error while fetching chat data:", error);
      }
    }

    loadData();
  }, [startParam]);

  async function onVerify(value) {
    window.Telegram.WebApp.MainButton.hideProgress();

    if (!value) {
      console.error("Captcha token is null or undefined.");
      return;
    }

    try {
      const response = await fetch(`/api/verifications/${startParam}/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recaptchaToken: value })
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        window.Telegram.WebApp.MainButton.text = "Return to chat";
        window.Telegram.WebApp.MainButton.color = "#21C004";
        window.Telegram.WebApp.MainButton.onClick(() => {
          window.Telegram.WebApp.close();
        })
      } else {
        console.error("Backend verification failed:", data.error);
      }
    } catch (error) {
      console.error("Error verifying captcha with backend:", error);
    }
  }

  return (
    <div>
      {fatalError || (!isShowSuccess && chatData && <ChatRules chatData={chatData} />)}
      <Reaptcha
        ref={captchaRef}
        sitekey={import.meta.env.VITE_RECAPTCHA_PUBLIC}
        size="invisible"
        onVerify={onVerify}
      />
      {isShowSuccess && <SuccessPage />}
    </div>
  )
}

export default App;
