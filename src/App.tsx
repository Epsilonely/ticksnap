import React from 'react';
import logo from './logo.svg';

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <header className="text-center">
        <img
          src={logo}
          className="min-w-40 animate-spin"
          alt="logo"
        />
        <p className="mt-4 text-lg text-gray-50">
          Edit <code className="font-mono text-blue-600">src/App.tsx</code> and save to reload.
        </p>
        <a
          className="mt-4 inline-block text-blue-500 hover:text-blue-700 underline"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;