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
  const [projPrompt, setProjPrompt] = useState(`
  Context information is below.
---------------------
{context_str}
---------------------
Given the context information and no prior knowledge, generate the answer in for {query_str}
`);

  function handleInputChange(event) {
    setProjPrompt(event.target.value);
  }

  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("gpt-3.5-turbo");

  const options = [
    "gpt-3.5-turbo",
    "gpt-4",
    "text-davinci-003",
  ];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  let api_endpoint = "";
  let create_instance_endpoint = "curl -X POST \   https://api.berri.ai/create_app \   -H 'Content-Type: multipart/form-data' \   -F template_id=9a5f0111-4e8b-428d-8fda-863773fe41cd \   -F user_email=krrish@berri.ai \   -F data_source=<file_location>"
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
    try {
      mixpanel.track("frontend.oops.error")
    } catch (err) {
      console.error(err)
    }
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
    console.log("api_endpoint: ", api_endpoint)
    let instance_id = api_endpoint.split("/")
    instance_id = instance_id[instance_id.length - 1];
    console.log("instance_id: ", instance_id)
    instance_id = instance_id.split("&")[0]
    let user_email = api_endpoint.split("indexes/")[1].split("/")[0]
    let data = [{ "context": JSON.stringify(messages), "correct_response": corrected_response }]
    fetch(`https://api.berri.ai/finetune_instance?instance_id=${instance_id}&user_email=${user_email}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then((response) => {
      console.log(response.json())
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
      body: JSON.stringify({
        chatId: chatId, question: userInput, history: history,
        model: selectedOption
      }),
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


      <main className={styles.main}>
        <div className={styles.footer}>
          <br />
          <p>Powered by <a href="https://berri.ai" target="_blank">BerriAI</a></p>
        </div>
        {modalOpen ? <div class="fixed top-0 left-0 w-full h-full flex items-center justify-center transition-opacity bg-gray-800/90 z-50"><div class="relative transform overflow-hidden rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transition-all bg-gray-900 sm:my-8 sm:w-full sm:p-6 sm:max-w-lg" id="headlessui-dialog-panel-:ra:" data-headlessui-state="open"><div class="flex items-center sm:flex"><div class="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 bg-green-100"><svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-green-700" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg></div><div class="mt-3 text-center sm:mt-0 sm:text-left"><h3 class="text-lg font-medium leading-6 text-gray-200" id="headlessui-dialog-title-:rb:" data-headlessui-state="open">Provide additional feedback</h3></div></div><form><textarea id="feedback-other" placeholder="What would the ideal answer have been?" rows="3" class="mt-4 mb-1 w-full rounded-md bg-gray-800 focus:border-white focus:ring-white" style={{ "height": "90px", "overflow-y": "hidden" }} tabindex="0"></textarea></form><div class="mt-5 flex flex-col gap-3 sm:mt-4 sm:flex-row-reverse"><button class="btn flex justify-center gap-2 btn-neutral" onClick={closeModal}>Submit feedback</button></div></div></div> : null}

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
          </div>

        </div>
      </main>
    </>
  )
}