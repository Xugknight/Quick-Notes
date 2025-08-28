import { Routes, Route } from 'react-router';
import NotesPage from '../src/pages/NotesPage/NotesPage'
import './App.css'

export default function App() {
  return (
    <main>
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>Quick Notes</h1>
          </div>
        </div>
      </header>


      <Routes>
        <Route path="/" element={<NotesPage />} />
        <Route path="*" element={<NotesPage />} />
      </Routes>
    </main>
  );
}