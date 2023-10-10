import { useEffect, useState } from 'react';

let isInited = false;

export function useChatData({
  verificationId,
  initData,
}: {
  verificationId: string;
  initData: string;
}) {
  const [chatData, setChatData] = useState(null);
  const [fatalError, setFatalError] = useState('');

  useEffect(() => {
    if (isInited) {
      return;
    }
    isInited = true;

    if (!verificationId) {
      console.error('start_param (userObjId) not found in initData.');
      setFatalError('Incorrect start parameter');
      return;
    }

    async function loadData() {
      try {
        const response = await fetch(
          `/api/verifications/${verificationId}/getChat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
          },
        );
        const data = await response.json();

        if (data.success) {
          setChatData(data.data);
        } else {
          if (data.error === 'INVALID_USER') {
            return setFatalError(
              'Sorry, this verification request is meant to be verified by another user. Please close this window.',
            );
          }
          setFatalError(`Error while getting chat data: ${data.error}`);
        }
      } catch (error) {
        setFatalError('Error while fetching data');
        console.error('Error while fetching chat data:', error);
      }
    }

    loadData();
  }, [verificationId]);

  return { chatData, fatalError };
}
