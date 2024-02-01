const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const videoPath = 'sample.avi'; // Update with your actual file path
const frameRate = 360; // Update with your desired frame rate

const buffer = [];
let isPaused = false;

wss.on('connection', (ws) => {
  const ffmpegProcess = spawn('ffmpeg', [
    '-i', videoPath,
    '-vf', `fps=${frameRate}`,
    '-f', 'image2pipe',
    '-'
  ]);

  ffmpegProcess.stdout.on('data', (data) => {
    if (!isPaused) {
      buffer.push(data);
      sendFrameToClient(ws);
    }
  });

  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`FFmpeg stderr: ${data}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
    ws.send('end');
    ws.close();
  });

  ws.on('message', (message) => {
    if (message === 'pause') {
      isPaused = true;
    } else if (message === 'play') {
      isPaused = false;
      sendFrameToClient(ws);
    }
  });

  ws.on('close', () => {
    ffmpegProcess.kill();
  });
});

function sendFrameToClient(ws) {
  if (buffer.length > 0 && ws.readyState === WebSocket.OPEN) {
    const frameData = buffer.shift();
    ws.send(frameData, { binary: true }, (error) => {
      if (error) {
        console.error('WebSocket send error:', error);
      } else {
        // Continue to send frames if not paused
        if (!isPaused) {
          sendFrameToClient(ws);
        }
      }
    });
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


