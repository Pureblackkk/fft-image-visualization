import React from 'react';
import './App.css';

// Load singleton
import { Imager } from '@/utils/image';

// Load component
import PhotoLoader from '@/components/photo-loader';
import PhotoDisplayer from '@/components/photo-displayer';

// Initial singleton
Imager.initialEventerHandler();



function App() {
  return (
    <div className="App">
      <PhotoLoader/>
      <PhotoDisplayer/>
    </div>
  );
}

export default App;
