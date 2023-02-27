import Link from 'next/link';
import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
import base64 from 'base64-js';
import mixpanel from 'mixpanel-browser';
import Cohere from "cohere-js";
import { useRouter } from 'next/router';



export default function NewPage() {
  const prefix = "@BerriAI setup:"
  const router = useRouter();
  const { api_endpoint } = router.query;

  return (
    <div>

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
        </div>
      </div>
      <div className="border border-gray-700 rounded-lg p-4 mt-6 mx-6 bg-transparent mx-auto">
        <h1 className="text-center">BerriAI Slack Integration</h1>
        <p className="text-center mt-4">Copy and Run the following text into your slack channel to activate BerriAI, after you install BerriAI in your Slack Workspace</p>
        <p className="text-center">This tells Berri the endpoint to call for your project</p>
        <div className="h-64 flex-wrap items-start justify-between">
          <div className="flex pt-10 text-center">
            <input type="text" readOnly className="w-5/6 rounded-lg border border-gray-700 bg-transparent p-2 text-sm mr-2" value={prefix + api_endpoint} />
            <button onClick={() => {
              navigator.clipboard.writeText(prefix + api_endpoint);
              try {
                mixpanel.track("slack.endpoint.copied")
              } catch (err) {
                console.error(err)
              }
            }} className="flex h-full w-1/6 items-center justify-center rounded-lg border border-gray-400 py-2 text-gray-600 hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" className="flex h-full w-1/6 items-center justify-center" />
              </svg>
            </button>
          </div>
          <p className="text-center mt-6">Next Step: Install to your Slack workspace</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid black', padding: '10px', backgroundColor: 'transparent' }}>
            <a href="https://slack.com/oauth/v2/authorize?client_id=4623456842593.4858953621442&scope=app_mentions:read,chat:write,channels:read,channels:history&user_scope=">
              <img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" />
            </a>
          </div>

        </div>
      </div>

      <p className="text-center text-sm mt-5 text-gray-400">Support, Email: ishaan@berri.ai, Phone/Text: +1 412-618-6238</p>


    </div >



  );
}
