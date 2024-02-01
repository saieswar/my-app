import React, { useEffect, useRef, useState } from 'react';

const App = () => {
  const [ws, setWs] = useState(null);
  const videoRef = useRef();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const newWs = new WebSocket('ws://localhost:5000');

    newWs.binaryType = 'arraybuffer';

    newWs.onopen = () => {
      console.log('WebSocket connection opened');
      setWs(newWs);
      // Request frames when the WebSocket connection is established
      sendPlayCommand(newWs);
    };

    newWs.onmessage = (event) => {
      if (event.data === 'end') {
        console.log('Video stream ended');
        newWs.close();
      } else {
        const arrayBuffer = event.data;
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        videoRef.current.src = imageUrl;
        if (!isPaused) {
          // Continue to send frames if not paused
          sendPlayCommand(newWs);
        }
      }
    };

    newWs.onclose = () => {
      console.log('WebSocket connection closed');
      setWs(null);
    };

    return () => {
      if (newWs.readyState === WebSocket.OPEN) {
        newWs.close();
      }
    };
  }, [isPaused]);

  const sendPlayCommand = (ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(isPaused ? 'pause' : 'play');
    }
  };

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
    if (ws && ws.readyState === WebSocket.OPEN) {
      sendPlayCommand(ws);
    }
  };

  return (
    <div>
      <h1>Dynamic Frame Viewer</h1>
      <img ref={videoRef} alt="Current Frame" />
      <button onClick={handlePlayPause}>
        {isPaused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
};

export default App;
