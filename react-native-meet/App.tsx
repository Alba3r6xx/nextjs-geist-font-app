import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { 
  mediaDevices, 
  RTCView, 
  RTCPeerConnection, 
  RTCSessionDescription, 
  RTCIceCandidate,
  MediaStream,
  MediaStreamTrack 
} from 'react-native-webrtc';
import Controls from './components/Controls';
import ParticipantList from './components/ParticipantList';
import Chat from './components/Chat';

import { Participant, Message } from './types';

export default function App() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pc = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const startLocalStream = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: true,
        }) as MediaStream;
        setLocalStream(stream);

        const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        const peerConnection = new RTCPeerConnection(configuration);
        pc.current = peerConnection;

        stream.getTracks().forEach((track: MediaStreamTrack) => {
          peerConnection.addTrack(track, stream);
        });

        (peerConnection as any).ontrack = (ev: { streams: MediaStream[] }) => {
          if (ev.streams?.[0]) {
            const streamId = ev.streams[0].id;
            setRemoteStreams(prev => ({
              ...prev,
              [streamId]: ev.streams[0]
            }));
          }
        };

        (peerConnection as any).onicecandidate = (ev: { candidate: RTCIceCandidate | null }) => {
          if (ev.candidate && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ 
              type: 'ice-candidate', 
              candidate: ev.candidate 
            }));
          }
        };

        (peerConnection as any).oniceconnectionstatechange = () => {
          const state = peerConnection.iceConnectionState;
          if (state === 'disconnected' || state === 'failed') {
            setError('Connection lost. Please try reconnecting.');
          }
        };
      } catch (err) {
        console.error('Error starting stream:', err);
        setError('Error accessing camera/microphone');
      }

      // Connect to signaling server
      ws.current = new WebSocket('ws://localhost:8080');

      ws.current.onopen = () => {
        console.log('Connected to signaling server');
        setConnected(true);
        createOffer().catch(console.error);
      };

      ws.current.onmessage = async (message) => {
        try {
          const data = JSON.parse(message.data);
          if (!pc.current) return;

          switch (data.type) {
            case 'offer':
              await pc.current.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pc.current.createAnswer();
              await pc.current.setLocalDescription(answer);
              ws.current?.send(JSON.stringify({ type: 'answer', answer }));
              break;

            case 'answer':
              await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
              break;

            case 'ice-candidate':
              if (data.candidate) {
                await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
              break;

            case 'chat':
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: data.sender,
                text: data.text,
                timestamp: Date.now()
              }]);
              break;

            case 'participant-list':
              setParticipants(data.participants);
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('Error processing message:', err);
          setError('Error processing message');
        }
      };

      ws.current.onclose = () => {
        console.log('Disconnected from signaling server');
        setConnected(false);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      const createOffer = async () => {
        if (!pc.current) return;
        const offer = await pc.current.createOffer({});
        await pc.current.setLocalDescription(offer);
        ws.current?.send(JSON.stringify({ type: 'offer', offer }));
      };
    };

    startLocalStream();

    return () => {
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (localStream) {
        localStream.release();
        setLocalStream(null);
      }
    };
  }, []);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const sendMessage = (text: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'chat',
        text,
        sender: 'Me',
      };
      ws.current.send(JSON.stringify(message));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'Me',
        text,
        timestamp: Date.now(),
      }]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.mainContent}>
        <View style={styles.videoGrid}>
          {localStream && (
            <View style={styles.localVideoContainer}>
              <RTCView
                streamURL={localStream.toURL()}
                style={styles.localVideo}
                objectFit="cover"
              />
              <Text style={styles.localLabel}>You</Text>
            </View>
          )}
          <ParticipantList
            participants={participants.map(p => ({
              ...p,
              stream: remoteStreams[p.id] || null,
            }))}
          />
        </View>

        <Chat
          messages={messages}
          onSendMessage={sendMessage}
        />
      </View>

      <Controls
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeaveCall={() => {
          if (pc.current) {
            pc.current.close();
            pc.current = null;
          }
          if (ws.current) {
            ws.current.close();
            ws.current = null;
          }
          if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
          }
          setRemoteStreams({});
          setConnected(false);
          setError(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    backgroundColor: '#dc3545',
    padding: 12,
    alignItems: 'center',
    transform: [{ translateY: 0 }],
    opacity: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#111',
  },
  videoGrid: {
    flex: 2,
    padding: 16,
    gap: 16,
  },
  localVideoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1 }],
  },
  localVideo: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  localLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#fff',
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

// Type assertion for MediaStream
declare global {
  interface MediaStream {
    release(): void;
    toURL(): string;
  }
  interface MediaStreamTrack {
    enabled: boolean;
  }
}
