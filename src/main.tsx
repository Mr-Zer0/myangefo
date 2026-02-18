import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'
import SearchResults from './pages/SearchResults.tsx'
import DetailPage from './pages/DetailPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/detail/:type/:pcode" element={<DetailPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
