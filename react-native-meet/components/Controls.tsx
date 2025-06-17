import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ControlsProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeaveCall: () => void;
  onToggleChat?: () => void;
}

export default function Controls({
  isMuted,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeaveCall,
  onToggleChat,
}: ControlsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onToggleAudio}>
        <Ionicons 
          name={isMuted ? "mic-off" : "mic"} 
          size={24} 
          color="#fff" 
        />
        <Text style={styles.buttonText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onToggleVideo}>
        <Ionicons 
          name={isVideoEnabled ? "videocam" : "videocam-off"} 
          size={24} 
          color="#fff" 
        />
        <Text style={styles.buttonText}>
          {isVideoEnabled ? 'Stop Video' : 'Start Video'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.leaveButton]} 
        onPress={onLeaveCall}
      >
        <Ionicons name="call" size={24} color="#fff" />
        <Text style={styles.buttonText}>Leave</Text>
      </TouchableOpacity>

      {onToggleChat && (
        <TouchableOpacity style={styles.button} onPress={onToggleChat}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  leaveButton: {
    backgroundColor: '#dc3545',
  },
});
