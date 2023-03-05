import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
import base64 from 'base64-js';
import mixpanel from 'mixpanel-browser';
import Cohere from "cohere-js";
import Link from 'next/link';
import Bugsnag from '@bugsnag/js'

Bugsnag.start({ apiKey: '6f3e42ec2b626188350d6820f1c713f0' })
//Bugsnag.notify(new Error('Test error'))

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '20px'
  }
};
// vercel 1

export default function Home({ chatId }) {
  let api_endpoint = "";
  let zeet_url = "";
  Cohere.init("62jzwJUv0fJjYs0e-t6jceIF");
  mixpanel.init('69c4620538e80373ae4ef8edb32ce5e3', { debug: true, ignore_dnt: true });
  try {
    mixpanel.track("chat.app.reached")
  } catch (err) {
    console.error(err)
  }
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
  const [modalOpen, setModalOpen] = useState(false);
  const [systemResponse, setSystemResponse] = useState(null);
  const [feedbackType, setfeedbackType] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      "message": "Hi there! How can I help?",
      "type": "apiMessage"
    }
  ]);
  const [showReferences, setShowReferences] = useState(false);
  const handleShowReferences = () => {
    console.log("Reference Toggle");
    setShowReferences(!showReferences);
    console.log(showReferences);
  };


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
    Bugsnag.notify(new Error('Frontend OOPs error'), function(event) {
      //if (event.getUser().id === '1') return false
      event.severity = 'warning'
      event.addMetadata('QueryInfo', {
        query: userInput,
        api_endpoint: api_endpoint
      })
    })
  }

  // Create an event handler for the buttons
  const handleUserFeedback = (system_response) => {
    // Get the value of the textarea
    const corrected_response = document.getElementById('feedback-other').value;
    // Send a request to the API with the user's selection
    fetch(`https://BerriPromptLogsAPI.krrishdholakia.repl.co/add_log?repo=${api_endpoint}&user_message=${encodeURIComponent(JSON.stringify(messages))}&system_response=${systemResponse}&user_reaction=${feedbackType}&corrected_response=${corrected_response}`).then(() => {
      // Do something after the request is successful
      console.log("successfully posted")
    });
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
      setMessages((prevMessages) => [
        ...prevMessages.map((message) => ({ ...message, mostRecent: false })),
        { message: data.result.success.response, type: "apiMessage", references: data.result.success.references, mostRecent: true },
      ]);

      console.log(data.result.success.references);

      // data.result.success.references
      //setMessages((prevMessages) => [...prevMessages, { "message": data.result.success.references, "type": "apiMessage" }]);







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

  // Define a function to open the modal
  const openModal = (message) => {
    setModalOpen(true);
    setSystemResponse(message.message)
  };

  // Define a function to close the modal
  const closeModal = () => {
    setModalOpen(false);
    handleUserFeedback()
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
          {/*           <a href="https://colab.research.google.com/drive/1R4e4dd-qr4XxPbOGdAIj0ybtliSlO4Zm?usp=sharing" target="_blank" onClick={() => {
            try {
              mixpanel.track("code.button.clicked")
            } catch (err) {
              console.error(err)
            }
          }} style={{ border: "2px solid green", padding: "2%", borderRadius: "10px" }}>Edit the Code</a> */}

          <a href="https://calendly.com/d/xz2-fqd-gqz/berri-ai-ishaan-krrish" target="_blank" onClick={() => {
            try {
              mixpanel.track("schedule.demo.button.clicked")
            } catch (err) {
              console.error(err)
            }
          }} style={{ border: "2px solid green", padding: "2%", borderRadius: "10px" }}>Schedule Demo</a>
          <a href="https://berri.ai/" target="_blank" style={{ padding: "2%", backgroundColor: "#048c2c", borderRadius: "10px" }}>+ New App</a>
          <div>
            <a href="https://tempslack.ishaan-jaff.repl.co/slack/install" target="_blank"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>


          </div>






          {/*           <a href="https://discord.com/invite/KvG3azf39U" target="_blank">Discord</a> */}
          {/*           <a href="https://github.com/ClerkieAI/berri_ai" target="_blank">GitHub</a> */}
        </div>
      </div>
      <p className="text-center text-sm mt-5 text-gray-400">Free plan: This app lives for 7 days, Sign up for our BerriAI:
        <a href="https://checkout.stripe.com/c/pay/cs_live_a1nhMmn3xZ6vbN9siaOHNIXiUSzk5EtRK9gvJWUiISn1AOxSvNhjAPpFR9#fidkdWxOYHwnPyd1blppbHNgWjA0SGFXQTxGMnFGXWk0TVRLbmpRVUl8SGdJRGphQTFfbUtKY0ozaEpnNjdwNFZCTTRUNU5fR09rfExiTjNxcmNxfWRHZFdKXU1mYl1GcFRdfDZDc0k2UTB1NTVDdzV8VlFAQycpJ3VpbGtuQH11anZgYUxhJz8nMG5EMW41NnFjMUk9M2R2YFBSJ3gl" target="_blank"> paid plan here</a>

      </p>
      <main className={styles.main}>
        {modalOpen ? <div class="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-500/90 transition-opacity dark:bg-gray-800/90"><div class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all dark:bg-gray-900 sm:my-8 sm:w-full sm:p-6 sm:max-w-lg" id="headlessui-dialog-panel-:ra:" data-headlessui-state="open"><div class="flex items-center sm:flex"><div class="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 bg-green-100"><svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-green-700" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></div><div class="mt-3 text-center sm:mt-0 sm:text-left"><h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200" id="headlessui-dialog-title-:rb:" data-headlessui-state="open">Provide additional feedback</h3></div></div><form><textarea id="feedback-other" placeholder="What would the ideal answer have been?" rows="3" class="mt-4 mb-1 w-full rounded-md dark:bg-gray-800 dark:focus:border-white dark:focus:ring-white" style={{ "height": "90px", "overflow-y": "hidden" }} tabindex="0"></textarea></form><div class="mt-5 flex flex-col gap-3 sm:mt-4 sm:flex-row-reverse"><button class="btn flex justify-center gap-2 btn-neutral" onClick={closeModal}>Submit feedback</button></div></div></div> : null}
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {messages.map((message, index) => {
              return (
                // The latest message sent by the user will be animated while waiting for a response
                <div key={index} className={message.type === "userMessage" && loading && index === messages.length - 1 ? styles.usermessagewaiting : message.type === "apiMessage" ? styles.apimessage : styles.usermessage}>
                  {/* Display the correct icon depending on the message type */}
                  <div className={styles.iconWrapper}>
                    {message.type === "apiMessage" ? (
                      <Image src="/parroticon.png" alt="AI" width="30" height="30" priority={true} className={styles.iconWrapper} />
                    ) : (
                      <Image src="/usericon.png" alt="Me" width="30" height="30" priority={true} className={styles.iconWrapper} />
                    )}
                  </div>

                  <div class="relative flex w-[calc(100%-50px)] flex-col gap-1 md:gap-3 lg:w-[calc(100%-115px)]">
                    {/* Messages are being rendered in Markdown format */}
                    <ReactMarkdown linkTarget={"_blank"}>{message.message}</ReactMarkdown>
                    {message.type === "apiMessage" && message.mostRecent && (
                      <div className="refs-container">
                        <div className="button-container">
                          <button
                            className={`${styles.refsWrapper} ${showReferences ? styles.expanded : ""
                              }`}
                            onClick={handleShowReferences}
                            style={{
                              padding: "1%",
                              backgroundColor: "transparent",
                              border: "1px solid #fff",
                              borderRadius: "5px",
                              color: "#fff",
                              fontSize: "0.8em",
                            }}
                          >
                            <span className={styles.collapseIcon}>
                              {showReferences ? "▲" : "▼"}
                            </span>
                            {showReferences ? "Hide References" : "Show References"}

                          </button>
                        </div>
                        {showReferences && message.mostRecent && message.references && (
                          <div className="references">
                            {typeof message.references === "string" ? (
                              <div>
                                <p>{message.references}...</p>
                              </div>
                            ) : (
                              message.references
                                .filter((ref) => ref.message_id === message.mostRecent.id)
                                .map((ref, index) => (
                                  <div key={index}>
                                    <h2>Source Text:</h2>
                                    <p>{ref.source_text}....</p>
                                    <h2>Similarity:</h2>
                                    <p>{ref.similarity * 100}%</p>
                                  </div>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add two buttons for thumbs up/thumbs down */}
                  {message.type === "apiMessage" ? <div class="text-gray-400 float-right"><button class="p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400" onClick={() => { setfeedbackType("thumbs_up"); openModal(message) }} ><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></button><button class="p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400" onClick={() => { setfeedbackType("thumbs_down"); openModal(message) }} ><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg></button></div> : null}
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
              <p className="text-center text-sm mt-5 text-gray-400">Contact us, Email: ishaan@berri.ai, krrishdholakia@berri.ai, Phone/Text: +1 412-618-6238</p>


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
