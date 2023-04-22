import Bugsnag from '@bugsnag/js'

Bugsnag.start({ apiKey: '6f3e42ec2b626188350d6820f1c713f0' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const history = [];

export default async function(req, res) {
  let query = req.body.question;
  console.log("got query on FE");
  console.log(query);
  let chatId = req.body.chatId;
  let model = req.body.model;
  const base64 = require('base64-js');
  const decoded_data = base64.toByteArray(chatId);
  const zeet_url = new TextDecoder().decode(decoded_data);
  console.log('zeet url');
  console.log(zeet_url);

  const urlSearchParams = new URLSearchParams(new URL(zeet_url).search);
  const proj_path = urlSearchParams.get('proj_path');
  const user_email = proj_path.split('/')[1];
  const proj_uuid = proj_path.split('/').pop();

  console.log(user_email);
  console.log(proj_uuid);

  let endpoint = "";
  console.log(zeet_url);
  if (zeet_url.includes("berri_query")) {
    // send request to GPT Index server for top of funnel
    let req_string = `?user_email=${user_email}&instance_id=${proj_uuid}&model=${model}&history=${JSON.stringify(history)}`;
    if (zeet_url.includes("abhi")) {
      req_string += '&version=2'
    }
    req_string += '&query='
    endpoint = `https://api.berri.ai/query${req_string}`;
    console.log("befor emaking req");
    console.log(endpoint);

  } else {
    endpoint = zeet_url + '/langchain_agent?query=';
  }
  console.log("Query TRIGGERED");
  console.log(endpoint + query);
  try {
    const response = await fetch(endpoint + query, { timeout: 60 * 1000 });
    const data = await response.json();
    console.log("GOT DATA");
    // only get data.response
    history.push({ query: query, response: data.response });
    console.log("Appended to history", history);
    res.status(200).json({ result: { success: data } })


  } catch (error) {
    console.log(error);
    console.error(error);
    const data = error;
    res.status(404).json({ result: { success: data } })
  }


}