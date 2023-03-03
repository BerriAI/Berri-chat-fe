import { useRouter } from 'next/router';
import Index from "./index";
import Bugsnag from '@bugsnag/js'

Bugsnag.start({ apiKey: '6f3e42ec2b626188350d6820f1c713f0' })


const ChatPage = () => {
  const router = useRouter();
  const { chatId } = router.query;
  console.log(chatId);
  return (
    <div>
      <Index chatId={chatId} />
    </div>
  );

};

export default ChatPage;
