import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Animated } from 'react-native';
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
  const buttonScale = new Animated.Value(1);

  const animateButton = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity 
          style={[styles.button, isMuted && styles.buttonActive]} 
          onPress={() => animateButton(onToggleAudio)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isMuted ? "mic-off" : "mic"} 
            size={24} 
            color="#fff" 
            style={styles.icon}
          />
          <Text style={styles.buttonText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity 
          style={[styles.button, !isVideoEnabled && styles.buttonActive]} 
          onPress={() => animateButton(onToggleVideo)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isVideoEnabled ? "videocam" : "videocam-off"} 
            size={24} 
            color="#fff" 
            style={styles.icon}
          />
          <Text style={styles.buttonText}>
            {isVideoEnabled ? 'Stop Video' : 'Start Video'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity 
          style={[styles.button, styles.leaveButton]} 
          onPress={() => animateButton(onLeaveCall)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="call" 
            size={24} 
            color="#fff" 
            style={styles.icon}
          />
          <Text style={[styles.buttonText, styles.leaveButtonText]}>Leave</Text>
        </TouchableOpacity>
      </Animated.View>

      {onToggleChat && (
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => animateButton(onToggleChat)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chatbubble-ellipses" 
              size={24} 
              color="#fff" 
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 24,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonActive: {
    backgroundColor: '#404040',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  leaveButton: {
    backgroundColor: '#dc3545',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  leaveButtonText: {
    fontWeight: '600',
  },
  icon: {
    marginBottom: 2,
    opacity: 0.9,
  },
});
