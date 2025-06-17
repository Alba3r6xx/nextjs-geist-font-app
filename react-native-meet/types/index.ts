import { MediaStream } from 'react-native-webrtc';

export interface Participant {
  id: string;
  name: string;
  stream?: MediaStream | null;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}
