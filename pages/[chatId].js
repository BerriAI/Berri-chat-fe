import { useRouter } from 'next/router';
import Index from "./index";

const ChatPage = () => {
  const router = useRouter();
  const { chatId } = router.query;
  console.log(chatId);
  return (
    <div>
      <Index chatId={chatId}/>
    </div>
  );
  
};

export default ChatPage;
