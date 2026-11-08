import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initFirestoreRealtimeSync } from './services/firestoreSync.ts';

// Initialize real-time multi-device cloud synchronization
initFirestoreRealtimeSync();

createRoot(document.getElementById('root')!).render(<App />);
