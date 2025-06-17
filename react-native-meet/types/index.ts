export interface Participant {
  id: string;
  name: string;
  isConnected?: boolean;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  type: string;
}
