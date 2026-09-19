import '../styles/globals.css';
import { AuthProvider } from '../store/authContext';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>AI Traffic Intelligence & Road Network Optimization</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Simulation, forecasting, and decision-support platform for metropolitan road networks" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
