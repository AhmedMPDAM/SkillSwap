import React from 'react';
import Layout from './navigation/Layout';
import { SocketProvider } from './context/SocketContext';

export default function App() {
  return (
    <SocketProvider>
      <Layout />
    </SocketProvider>
  );
}
