import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
import base64 from 'base64-js';
import mixpanel from 'mixpanel-browser';
import Cohere from "cohere-js";

export default function Home({ chatId }) {
  let api_endpoint = "";
  let zeet_url = "";
  Cohere.init("62jzwJUv0fJjYs0e-t6jceIF");
  mixpanel.init('69c4620538e80373ae4ef8edb32ce5e3', { debug: true, ignore_dnt: true });
  if (chatId) {
    const decoded_data = base64.toByteArray(chatId);
    zeet_url = new TextDecoder().decode(decoded_data);
    console.log(zeet_url);
    if (zeet_url.includes("berri_query")) {
      // send request to GPT Index server for top of funnel
      api_endpoint = zeet_url + "&query="
    } else {
      api_endpoint = zeet_url + '/langchain_agent?query=';
    }
  }
  console.log("api endpoint");
  console.log(api_endpoint);
  console.log(zeet_url);
  const [userInput, setUserInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      "message": "Hi there! How can I help?",
      "type": "apiMessage"
    }
  ]);

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  // Focus on text field on load
  useEffect(() => {
    textAreaRef.current.focus();
  }, []);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [...prevMessages, { "message": "Oops! There seems to be an error. Reach out to us here: https://discord.gg/KvG3azf39U", "type": "apiMessage" }]);
    setLoading(false);
    setUserInput("");
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();


    if (userInput.trim() === "") {
      return;
    }

    setLoading(true);
    setMessages((prevMessages) => [...prevMessages, { "message": userInput, "type": "userMessage" }]);

    console.log("Handling submit, making an api request");
    console.log(userInput);

    // Send user question and history to API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatId: chatId, question: userInput, history: history }),
      timeout: 60000,
    });

    if (!response.ok) {
      console.log("response error from Next JS server");
      console.log(response.status);
      handleError();
      return;
    }

    // Reset user input
    setUserInput("");
    const data = await response.json();

    if (data.result.error === "Unauthorized") {
      handleError();
      return;
    }

    if (typeof data.result.success === "object") {
      console.log("data.result.success is an object");
      // data.result.success.response
      setMessages((prevMessages) => [...prevMessages, { "message": data.result.success.response, "type": "apiMessage" }]);
      // data.result.success.references
      setMessages((prevMessages) => [...prevMessages, { "message": "Here is what I looked at: \n" + data.result.success.references, "type": "apiMessage" }]);


    } else if (typeof data.result.success === "string") {
      setMessages((prevMessages) => [...prevMessages, { "message": data.result.success, "type": "apiMessage" }]);
      console.log("data.result.success is a string");
    }


    setLoading(false);

  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  // Keep history in sync with messages
  useEffect(() => {
    if (messages.length >= 3) {
      setHistory([[messages[messages.length - 2].message, messages[messages.length - 1].message]]);
    }
  }, [messages])

  return (
    <>
      <Head>
        <title>BerriAI Chat</title>
        <meta name="description" content="Berri AI Default chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
        <div className={styles.navlogo}>
          <a href="/">BerriAI</a>
        </div>
        <div className={styles.navlinks}>
                <a href="https://colab.research.google.com/drive/1R4e4dd-qr4XxPbOGdAIj0ybtliSlO4Zm?usp=sharing" target="_blank" onClick={() => {
  try {
      mixpanel.track("code.button.clicked")
    } catch (err) {
      console.error(err)
    }
}}>Code for this App</a>

          <a href="https://calendly.com/d/xz2-fqd-gqz/berri-ai-ishaan-krrish" target="_blank">Schedule Demo</a>
          <a href="https://berri.ai/" target="_blank">BerriAI</a>
          <a href="https://discord.com/invite/KvG3azf39U" target="_blank">Discord</a>
          <a href="https://github.com/ClerkieAI/berri_ai" target="_blank">GitHub</a>
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {messages.map((message, index) => {
              return (
                // The latest message sent by the user will be animated while waiting for a response
                <div key={index} className={message.type === "userMessage" && loading && index === messages.length - 1 ? styles.usermessagewaiting : message.type === "apiMessage" ? styles.apimessage : styles.usermessage}>
                  {/* Display the correct icon depending on the message type */}
                  <div className={styles.iconWrapper}>
                    {message.type === "apiMessage" ? (
                      <Image src="/parroticon.png" alt="AI" width="30" height="30" priority={true} className={styles.iconWrapper}/>
                    ) : (
                      <Image src="/usericon.png" alt="Me" width="30" height="30" priority={true} className={styles.iconWrapper}/>
                    )}
                  </div>

                  <div className={styles.markdownanswer}>
                    {/* Messages are being rendered in Markdown format */}
                    <ReactMarkdown linkTarget={"_blank"}>{message.message}</ReactMarkdown>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className={styles.center}>

          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                type="text"
                id="userInput"
                name="userInput"
                placeholder={loading ? "Waiting for response..." : "Type your question..."}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                className={styles.textarea}
              />
              <button
                type="submit"
                disabled={loading}
                className={styles.generatebutton}
              >
                {loading ? <div className={styles.loadingwheel}><CircularProgress color="inherit" size={20} /> </div> :
                  // Send icon SVG in input field
                  <svg viewBox='0 0 20 20' className={styles.svgicon} xmlns='http://www.w3.org/2000/svg'>
                    <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
                  </svg>}
              </button>
            </form>
            <div className="h-64 w-full flex-wrap items-start justify-between">
              <div className="w-full flex pt-10 text-center">
                <input type="text" readOnly className="w-5/6 rounded-lg border border-gray-700 bg-transparent p-2 text-sm mr-2" value={api_endpoint} />

                <button onClick={() => {
  navigator.clipboard.writeText(api_endpoint);
  try {
      mixpanel.track("api.endpoint.copied")
    } catch (err) {
      console.error(err)
    }
}} className="flex h-full w-1/6 items-center justify-center rounded-lg border border-gray-400 py-2 text-gray-600 hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                </button>
              </div>
              <p className="text-center text-sm mt-5 text-gray-400">Copy your API Endpoint for this QA bot</p>
            </div>

          </div>
          <div className={styles.footer}>
            <p>Powered by <a href="https://github.com/ClerkieAI/berri_ai" target="_blank">BerriAI</a></p>
          </div>
        </div>
      </main>
    </>
  )
}
