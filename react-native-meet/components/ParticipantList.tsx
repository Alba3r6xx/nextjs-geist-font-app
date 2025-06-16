import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { RTCView } from 'react-native-webrtc';

interface Participant {
  id: string;
  stream: MediaStream | null;
  name: string;
}

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
    backgroundColor: '#000',
  },
  participantContainer: {
    margin: 8,
    alignItems: 'center',
  },
  participantVideo: {
    width: 120,
    height: 160,
    backgroundColor: '#222',
    borderRadius: 8,
    overflow: 'hidden',
  },
  noVideoContainer: {
    width: 120,
    height: 160,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  participantName: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
});
