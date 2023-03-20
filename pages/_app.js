import '../styles/globals.css'
import { AuthProvider } from "@propelauth/react";

const MyApp = ({ Component, pageProps }) => {
  return (
    <AuthProvider authUrl={"https://auth.berri.ai"}>
      <Component {...pageProps} />
    </AuthProvider>
  );
};

export default MyApp;