const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const participants = new Map();

wss.on('connection', function connection(ws) {
  const participantId = Math.random().toString(36).substr(2, 9);

  participants.set(participantId, {
    ws,
    name: `User ${participants.size + 1}`,
    isConnected: true
  });

  const participantList = Array.from(participants.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    isConnected: data.isConnected
  }));

  ws.send(JSON.stringify({
    type: 'participant-list',
    participants: participantList
  }));

  console.log(`New client connected (${participantId})`);

  // Broadcast new participant to others
  broadcastToOthers(ws, {
    type: 'participant-joined',
    participant: {
      id: participantId,
      name: participants.get(participantId).name
    }
  });

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);

      // Add sender information to chat messages
      if (data.type === 'chat') {
        data.sender = participants.get(participantId).name;
      }

      // Broadcast to other participants
      broadcastToOthers(ws, data);
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    // Update participant status
    if (participants.has(participantId)) {
      participants.get(participantId).isConnected = false;

      // Broadcast participant left
      broadcastToOthers(ws, {
        type: 'participant-left',
        participantId
      });

      // Remove participant after a delay to allow reconnection
      setTimeout(() => {
        if (participants.has(participantId) && !participants.get(participantId).isConnected) {
          participants.delete(participantId);
        }
      }, 5000);
    }
    console.log(`Client disconnected (${participantId})`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${participantId}:`, error);
  });
});

function broadcastToOthers(sender, data) {
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Handle server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

console.log('Signaling server running on ws://localhost:8080');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
