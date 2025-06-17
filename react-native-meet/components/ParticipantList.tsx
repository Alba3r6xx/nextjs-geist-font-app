import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { Participant } from '../types';

interface ParticipantListProps {
  participants: Participant[];
}

export default function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <ScrollView style={styles.container}>
      {participants.map((participant) => (
        <View key={participant.id} style={styles.participantContainer}>
          {participant.stream ? (
            <RTCView
              streamURL={participant.stream.toURL()}
              style={styles.participantVideo}
              objectFit="cover"
            />
          ) : (
            <View style={styles.noVideoContainer}>
              <Text style={styles.noVideoText}>{participant.name.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.participantName}>{participant.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingHorizontal: 8,
  },
  participantContainer: {
    margin: 8,
    alignItems: 'center',
    opacity: 1,
    transform: [{ scale: 1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  participantVideo: {
    width: 160,
    height: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noVideoContainer: {
    width: 160,
    height: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  noVideoText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  participantName: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
