import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import Vapi from '@vapi-ai/web';


// Put your Vapi Public Key below.
const vapi = new Vapi({
  publicKey: "21a62fd1-30b6-42dc-b1d6-a50bdfba200b",
  debug: true, // Enable debug mode for better error logging
  baseURL: "/call" // Use the proxied endpoint
});

const usePublicKeyInvalid = () => {
  const [showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage] = useState(false);

  useEffect(() => {
    if (showPublicKeyInvalidMessage) {
      setTimeout(() => {
        setShowPublicKeyInvalidMessage(false);
      }, 3000);
    }
  }, [showPublicKeyInvalidMessage]);

  return {
    showPublicKeyInvalidMessage,
    setShowPublicKeyInvalidMessage,
  };
};

const isPublicKeyMissingError = ({ vapiError }) => {
  return vapiError?.message?.includes('Public key is missing or invalid');
};

function App() {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState('');

  const { showPublicKeyInvalidMessage, setShowPublicKeyInvalidMessage } = usePublicKeyInvalid();

    useEffect(() => {
        vapi.on("transcript", (text) => {
          setTranscript(text);
          if (text.trim()) {
            setInputText(text);
          }
        });

        vapi.on("call-start", () => {
          setConnecting(false);
          setConnected(true);
    
          setShowPublicKeyInvalidMessage(false);
        });
    
        vapi.on("call-end", () => {
          setConnecting(false);
          setConnected(false);
    
          setShowPublicKeyInvalidMessage(false);
        });
    
        vapi.on("speech-start", () => {
          setAssistantIsSpeaking(true);
        });
    
        vapi.on("speech-end", () => {
          setAssistantIsSpeaking(false);
        });
    
        vapi.on("volume-level", (level) => {
          setVolumeLevel(level);
        });
    
        vapi.on("error", (error) => {
          console.error(error);
    
          setConnecting(false);
          if (isPublicKeyMissingError({ vapiError: error })) {
            setShowPublicKeyInvalidMessage(true);
          }
        });
    
        // we only want this to fire on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);


  // call start handler
  const startCallInline = async () => {
    try {
      setConnecting(true);
      await vapi.start("5f975d0b-a3a4-470f-a57f-6693f522df9e", {
        retryOnError: true,
        maxRetries: 3
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      setConnecting(false);
      if (isPublicKeyMissingError({ vapiError: error })) {
        setShowPublicKeyInvalidMessage(true);
      }
    }
  };
  const endCall = () => {
    vapi.stop();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      setMessages([...messages, { text: inputText, type: 'user' }]);
      setInputText('');
      setTranscript('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={connected ? endCall : startCallInline}
            className={`p-2 rounded-full ${connected ? 'bg-red-500' : 'bg-blue-500'} text-white`}
          >
            <MicrophoneIcon className="h-6 w-6" />
          </button>
          <button
            type="submit"
            className="p-2 rounded-full bg-blue-500 text-white"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </form>
        {transcript && (
          <div className="mt-2 text-sm text-orange-600">
            Transcribing: {transcript}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;