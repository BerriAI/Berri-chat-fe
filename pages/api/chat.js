import Bugsnag from '@bugsnag/js'

Bugsnag.start({ apiKey: '6f3e42ec2b626188350d6820f1c713f0' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function(req, res) {
  let query = req.body.question;
  console.log("got query on FE");
  console.log(query);
  let chatId = req.body.chatId;
  let model = req.body.model;
  const base64 = require('base64-js');
  const decoded_data = base64.toByteArray(chatId);
  const zeet_url = new TextDecoder().decode(decoded_data);
  let endpoint = "";
  console.log(zeet_url);
  if (zeet_url.includes("berri_query")) {
    // send request to GPT Index server for top of funnel
    endpoint = zeet_url + "&model=" + model + "&query=";
  } else {
    endpoint = zeet_url + '/langchain_agent?query=';
  }
  console.log("Query TRIGGERED");
  console.log(endpoint + query);
  try {
    const response = await fetch(endpoint + query, { timeout: 60 * 1000 });
    const data = await response.json();
    console.log("GOT DATA");
    res.status(200).json({ result: { success: data } })


  } catch (error) {
    console.log(error);
    console.error(error);
    const data = error;
    res.status(404).json({ result: { success: data } })
  }


}