"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import ParticipantList from "@/components/ParticipantList";
import Chat from "@/components/Chat";
import Controls from "@/components/Controls";
import { Ionicons } from "@expo/vector-icons";

const WS_URL = "ws://localhost:8080";

import type { Participant as BaseParticipant, Message } from '@/types';

export default function MeetingRoom() {
  const [participants, setParticipants] = useState<BaseParticipant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error" | "disconnected"
  >("connecting");
  const [showChat, setShowChat] = useState(false);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      setConnectionStatus("connected");
    };

    ws.current.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "participant-list":
            setParticipants(data.participants);
            break;
          case "participant-joined":
            setParticipants((prev) => [...prev, data.participant]);
            break;
          case "participant-left":
            setParticipants((prev) =>
              prev.filter((p) => p.id !== data.participantId)
            );
            break;
          case "chat":
            setMessages((prev) => [...prev, data]);
            break;
          case "error":
            Alert.alert("Error", data.message);
            break;
          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    ws.current.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
    };

    ws.current.onclose = () => {
      setConnectionStatus("disconnected");
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (text: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const message = {
        type: "chat",
        text,
      };
      ws.current.send(JSON.stringify(message));
    } else {
      Alert.alert("Connection Error", "WebSocket is not connected.");
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const toggleVideo = () => {
    setIsVideoEnabled((prev) => !prev);
  };

  const leaveCall = () => {
    Alert.alert("Leave Call", "Are you sure you want to leave the call?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          if (ws.current) {
            ws.current.close();
          }
          // Navigate back or close the meeting screen
        },
      },
    ]);
  };

  const toggleChat = () => {
    setShowChat((prev) => !prev);
  };

  if (connectionStatus === "connecting") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.statusText}>Connecting...</Text>
      </View>
    );
  }

  if (connectionStatus === "error") {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Connection error. Please try again later.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.participantListContainer}>
        <ParticipantList
          participants={participants.map((p) => ({
            ...p,
            stream: null,
          }))}
        />
      </View>

      {showChat && (
        <View style={styles.chatContainer}>
          <Chat messages={messages} onSendMessage={sendMessage} />
        </View>
      )}

      <View style={styles.controlsContainer}>
        <Controls
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={toggleMute}
          onToggleVideo={toggleVideo}
          onLeaveCall={leaveCall}
          onToggleChat={toggleChat}
        />
        <TouchableOpacity style={styles.chatToggleButton} onPress={toggleChat}>
          <Ionicons
            name={showChat ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
            size={28}
            color="#007AFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  participantListContainer: {
    flex: 4,
    backgroundColor: "#000",
  },
  chatContainer: {
    flex: 3,
    backgroundColor: "#1a1a1a",
    borderLeftWidth: 1,
    borderLeftColor: "#333",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#222",
  },
  chatToggleButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: "#333",
    borderRadius: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  statusText: {
    marginTop: 12,
    color: "#007AFF",
    fontSize: 16,
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: 16,
  },
});
