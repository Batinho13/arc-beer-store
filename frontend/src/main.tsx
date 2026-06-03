import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Web3Wrapper } from './utils/web3Config.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Web3Wrapper>
      <App />
    </Web3Wrapper>
  </React.StrictMode>,
)
