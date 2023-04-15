import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import {
  useLogoutFunction,
  useRedirectFunctions,
  withAuthInfo,
} from "@propelauth/react";
import Index from "./index";
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import CircularProgress from '@mui/material/CircularProgress';
import base64 from 'base64-js';
import mixpanel from 'mixpanel-browser';
import Cohere from "cohere-js";
import Link from 'next/link';

function encodeLink(proj_directory) {
  let endpoint = `https://storequeryabhi2-aylu.zeet-berri.zeet.app/berri_query?proj_path=${proj_directory}`
  console.log("in encode link");
  console.log(endpoint);
  const encodedEndpoint = Buffer.from(endpoint).toString('base64');
  const encodedEndpointUrl = "https://play.berri.ai/" + encodeURIComponent(encodedEndpoint);

  //let encoded_endpoint_url = encodeURIComponent(endpoint);
  console.log(encodedEndpointUrl);
  endpoint = ` / ${encodedEndpointUrl}`;
  return encodedEndpointUrl
}


const Dashboard = withAuthInfo(({ user, isLoggedIn }) => {
  const { redirectToSignupPage, redirectToLoginPage } = useRedirectFunctions();
  console.log(user, isLoggedIn)
  const router = useRouter();
  console.log("Calling dashboard step 0");


  const currentUrl = router.asPath;
  //const { chatId } = router.query;
  console.log("curr url")
  console.log(currentUrl);

  if (isLoggedIn) {
    const userEmail = user.email

    const [tableData, setTableData] = useState([]);

    useEffect(() => {
      const fetchTableData = async () => {
        try {
          console.log("Calling dashboard");
          console.log(`https://storequeryabhi2-aylu.zeet-berri.zeet.app/get_projects?user_email=${userEmail}`);
          const res = await fetch(`https://storequeryabhi2-aylu.zeet-berri.zeet.app/get_projects?user_email=${userEmail}`);
          const data = await res.json();
          console.log("getting projects");
          console.log(data);
          setTableData(data);
          console.log(data);
        } catch (error) {
          console.error(error);
        }
      };

      fetchTableData();
    }, []);

    return (
      <div>



        <div className={styles.topnav}>
          <div className={styles.navlogo}>
            <a href="/">BerriAI</a>
          </div>
          <div className={styles.navlinks}>


            <a href="https://calendly.com/d/xz2-fqd-gqz/berri-ai-ishaan-krrish" target="_blank" onClick={() => {
              try {
                mixpanel.track("schedule.demo.button.clicked")
              } catch (err) {
                console.error(err)
              }
            }} className="mx-1 border-2 border-berri-yellow-base text-center p-1 sm:p-2 rounded-md"
            >
              <p className="hidden sm:block">Schedule Demo</p>
              <p className="block sm:hidden">Demo</p>
            </a>
            <a href="https://discord.com/invite/KvG3azf39U" target="_blank" className="mx-1 border-2 border-berri-yellow-base text-center p-1 sm:p-2 rounded-md">Discord</a>
            <a href="https://berri.ai/" target="_blank" className="mx-1 flex-shrink-0 bg-gradient-to-r from-berri-yellow-200 to-berri-pink-base text-center p-1.5 sm:p-2.5 rounded-md text-black">+ New App</a>



            {/*           <a className="hidden sm:block" href="https://tempslack.ishaan-jaff.repl.co/slack/install" target="_blank">
            <img
              alt="Add to Slack"
              className="mx-1 w-40 h-140"
              src="https://platform.slack-edge.com/img/add_to_slack.png"
              srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
            />
          </a> */}
            <a className="block sm:hidden" href="https://tempslack.ishaan-jaff.repl.co/slack/install" target="_blank">
              <img
                alt="Slack Logo"
                width={25}
                height={25}
                src="https://mirrorful-production.s3.us-west-1.amazonaws.com/assets/Slack-mark-RGB.png"
                srcSet="https://mirrorful-production.s3.us-west-1.amazonaws.com/assets/Slack-mark-RGB.png 1x, https://mirrorful-production.s3.us-west-1.amazonaws.com/assets/Slack-mark-RGB.png 2x"
              />
            </a>






            {/*           <a href="https://discord.com/invite/KvG3azf39U" target="_blank">Discord</a> */}
            {/*           <a href="https://github.com/ClerkieAI/berri_ai" target="_blank">GitHub</a> */}
          </div>
        </div>
        <main className={styles.main}>
          <div>
            <h1>{tableData.length} Berris for {userEmail}</h1>
          </div>

          {
  tableData.length > 0 && (
    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          {Object.keys(tableData[0])
            .filter((header) => header !== 'source_data_map' && header !== 'app_config') // Filter out 'source_data_map' and 'app_config'
            .map((header) => (
              <th key={header} scope="col" className="px-6 py-3">
                {header}
              </th>
            ))}
          <th key="instance_id" scope="col" className="px-6 py-3">
            Instances
          </th>
        </tr>
      </thead>
      <tbody>
        {tableData.map((row, i) => (
          <tr
            key={i}
            className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b dark:bg-gray-800 dark:border-gray-700`}
          >
            {Object.entries(row)
              .filter(([key]) => key !== 'source_data_map' && key !== 'app_config') // Filter out 'source_data_map' and 'app_config'
              .map(([key, value], j) => (
                <td key={j} className="px-6 py-4">
                  {value}
                </td>
              ))}
            <td key={`${i}-button`} className="px-6 py-4">
              <a href={encodeLink(`indexes/${userEmail}/${row.instance_id}`)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Go
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}


          
        </main>





      </div >

    )
  }
  else {
    // return (

    //   <div>
    //     To get started, please log in to your account.
    //     <br />
    //     <button onClick={() => redirectToSignupPage()}>Sign up</button>
    //     <button onClick={() => redirectToLoginPage()}>Log in</button>
    //   </div>
    // );
    redirectToLoginPage();
  };

});

export default Dashboard;
