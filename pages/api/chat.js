export default async function(req, res) {


  let query = req.body.question;
  console.log(req.query);
  console.log(req.body);
  let chatId = req.body.chatId;
  const base64 = require('base64-js');
  const decoded_data = base64.toByteArray(chatId);
  const zeet_url = new TextDecoder().decode(decoded_data);

  let endpoint = "";
  console.log(zeet_url);
  if (zeet_url.includes("berri_query")) {
    // send request to GPT Index server for top of funnel
    endpoint = zeet_url + "&query="
  } else {
    endpoint = zeet_url + '/langchain_agent?query=';
  }

  console.log("IN SEARCH TRIGGERED");
  console.log(endpoint + query);
  try {
    const response = await fetch(endpoint + query);
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