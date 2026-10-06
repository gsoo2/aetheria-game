import React from 'react';
import {createRoot} from 'react-dom/client';
import Game from '../components/game/Game';
import '../app/globals.css';
import '../app/cute-ui.css';
createRoot(document.getElementById('root')!).render(<Game/>);

