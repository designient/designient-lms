import React from 'react';
import './index.css';
import { render } from 'react-dom';
import { App } from './App';
import { initializeTheme } from './hooks/useTheme';
// Initialize theme before render to prevent flash of wrong theme
initializeTheme();
render(<App />, document.getElementById('root'));