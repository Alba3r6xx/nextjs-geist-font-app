import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Button, Text } from 'react-native';
import { mediaDevices, RTCView, RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream, MediaStreamTrack } from 'react-native-webrtc';

export default function App() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const startLocalStream = async () => {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setLocalStream(stream);

      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
      pc.current = new RTCPeerConnection(configuration);

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        if (pc.current) {
          pc.current.addTrack(track, stream);
        }
      });

      if (pc.current) {
        (pc.current as any).ontrack = (event: any) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        pc.current.onicecandidate = (event) => {
          if (event.candidate && ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
          }
        };
      }

      // Connect to signaling server
      ws.current = new WebSocket('ws://localhost:8080');

      ws.current.onopen = () => {
        console.log('Connected to signaling server');
        setConnected(true);
        createOffer();
      };

      ws.current.onmessage = async (message) => {
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
              try {
                await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
              } catch (e) {
                console.error('Error adding received ice candidate', e);
              }
            }
            break;
          default:
            break;
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
        const offer = await pc.current.createOffer();
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Meet</Text>
      <Text style={{ color: '#fff', marginBottom: 10 }}>
        {connected ? 'Connected' : 'Connecting...'}
      </Text>
      {localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
        />
      )}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <Text style={{ color: '#fff' }}>No remote stream</Text>
      )}
      <Button title="Leave Call" onPress={() => {
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
        setRemoteStream(null);
        setConnected(false);
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 20,
  },
  localVideo: {
    width: 150,
    height: 200,
    backgroundColor: '#222',
  },
  remoteVideo: {
    width: 300,
    height: 400,
    backgroundColor: '#444',
    marginTop: 20,
  },
});
