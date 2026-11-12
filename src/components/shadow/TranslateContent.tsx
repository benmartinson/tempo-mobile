import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RootState } from "../../types";
import { useSelector } from "react-redux";
import { removeSpecialPunctuation, addEllipsis } from "../../helpers/helpers";
import { useInterpolatedTime } from "../../hooks/useInterpolatedTime";
import { useStableChunkIdx } from "../../hooks/useStableChunkIdx";
import {
  generateTTS,
  playAudio,
  stopAudio,
} from "../../helpers/streaming_helpers";

// Spoken translations already generated this session, keyed by text, so
// replaying a sentence doesn't call ElevenLabs again.
const ttsCache = new Map<string, Promise<string>>();
const TTS_CACHE_LIMIT = 40;

const getTranslationAudio = (text: string): Promise<string> => {
  const cached = ttsCache.get(text);
  if (cached) return cached;
  const request = generateTTS(text);
  ttsCache.set(text, request);
  request.catch(() => ttsCache.delete(text));
  if (ttsCache.size > TTS_CACHE_LIMIT) {
    const oldest = ttsCache.keys().next().value;
    if (oldest !== undefined) ttsCache.delete(oldest);
  }
  return request;
};

// How long the video must stay paused before the translation is spoken, so
// it doesn't start in the short gap before a new sentence begins playing.
const AUTO_SPEAK_DELAY_MS = 500;

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish",
  en: "English",
  pt: "Portuguese",
};

interface TranslateContentProps {
  translationText: string | null;
  sentenceText?: string;
  isLoading: boolean;
  time?: number;
  playerIsPlaying?: boolean;
  segmentStart?: number;
  segmentEnd?: number;
  playKey?: number;
  playerSpeed?: number;
  isRecording?: boolean;
}

const TranslateContent: React.FC<TranslateContentProps> = ({
  translationText,
  sentenceText,
  isLoading,
  time = 0,
  playerIsPlaying = false,
  segmentStart = 0,
  segmentEnd = 0,
  playKey,
  playerSpeed = 1,
  isRecording = false,
}) => {
  const userSettings = useSelector((state: RootState) => state.userSettings);
  // const localTime = useInterpolatedTime(
  //   time,
  //   playerIsPlaying,
  //   playKey,
  //   playerSpeed,
  // );
  const localTime = time;

  // Speak the translation out loud (ElevenLabs, via the backend /tts route).
  const [speechState, setSpeechState] = useState<
    "idle" | "loading" | "speaking"
  >("idle");
  const speechRunRef = useRef(0);
  const lastAutoSpokenRef = useRef<string | null>(null);

  // True while this component is loading or playing its own audio, so it
  // never stops audio that belongs to another part of the app.
  const speechActiveRef = useRef(false);

  const stopSpeaking = useCallback(() => {
    if (!speechActiveRef.current) return;
    speechActiveRef.current = false;
    speechRunRef.current += 1;
    void stopAudio();
    setSpeechState("idle");
  }, []);

  const speak = useCallback(async (text: string) => {
    const run = ++speechRunRef.current;
    speechActiveRef.current = true;
    setSpeechState("loading");
    try {
      const audio = await getTranslationAudio(text);
      if (speechRunRef.current !== run) return;
      setSpeechState("speaking");
      await playAudio(audio);
    } catch (err) {
      console.error("Failed to speak translation:", err);
    }
    if (speechRunRef.current === run) {
      speechActiveRef.current = false;
      setSpeechState("idle");
    }
  }, []);

  // Start generating the audio as soon as the translation arrives, so it is
  // ready by the time the video segment finishes.
  useEffect(() => {
    if (translationText && !isLoading) {
      getTranslationAudio(translationText).catch(() => {});
    }
  }, [translationText, isLoading]);

  // Speak each new translation once, after the video segment stops playing.
  useEffect(() => {
    if (!translationText || isLoading || playerIsPlaying || isRecording) return;
    if (lastAutoSpokenRef.current === translationText) return;
    const timer = setTimeout(() => {
      lastAutoSpokenRef.current = translationText;
      void speak(translationText);
    }, AUTO_SPEAK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [translationText, isLoading, playerIsPlaying, isRecording, speak]);

  // Don't talk over the video or a recording.
  useEffect(() => {
    if (playerIsPlaying || isRecording) stopSpeaking();
  }, [playerIsPlaying, isRecording, stopSpeaking]);

  // Stop when the sentence changes or the tab is closed.
  useEffect(() => {
    return () => {
      if (!speechActiveRef.current) return;
      speechActiveRef.current = false;
      speechRunRef.current += 1;
      void stopAudio();
    };
  }, [translationText]);

  const displayText = translationText
    ? addEllipsis(removeSpecialPunctuation(translationText), sentenceText)
    : "";

  const words = useMemo(
    () => displayText.split(/\s+/).filter(Boolean),
    [displayText],
  );

  const rawWordIdx = useMemo(() => {
    if (!playerIsPlaying || !words.length || !isRecording) return -1;
    const duration = segmentEnd - segmentStart;
    if (duration <= 0) return -1;
    const elapsed = localTime - segmentStart;
    const timePerWord = duration / words.length;
    const idx = Math.floor(elapsed / timePerWord);
    return Math.min(Math.max(idx, 0), words.length - 1);
  }, [localTime, playerIsPlaying, segmentStart, segmentEnd, words.length]);

  const { activeChunkStart, activeChunkEnd } = useStableChunkIdx({
    wordCount: words.length,
    rawWordIdx,
    isReplay: localTime <= segmentStart + 0.5,
    resetKey: `${segmentStart}-${segmentEnd}-${words.length}`,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4a69bd" />
        <Text style={styles.loadingText}>Loading translation...</Text>
      </View>
    );
  }

  if (!translationText) return null;

  return (
    <View style={styles.questionBubble}>
      {/* <Text style={styles.questionLabel}>{label}</Text> */}
      <TouchableOpacity
        style={styles.speakButton}
        onPress={() =>
          speechState === "idle" ? speak(translationText) : stopSpeaking()
        }
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={
          speechState === "idle" ? "Play translation" : "Stop translation"
        }
      >
        {speechState === "loading" ? (
          <ActivityIndicator size="small" color="#4a69bd" />
        ) : (
          <Ionicons
            name={speechState === "speaking" ? "stop-circle" : "volume-medium"}
            size={22}
            color="#4a69bd"
          />
        )}
      </TouchableOpacity>
      <Text style={styles.questionText}>
        {words.map((word, index) => {
          const isActive =
            activeChunkStart >= 0 &&
            index >= activeChunkStart &&
            index <= activeChunkEnd;
          return (
            <Text key={index} style={isActive ? styles.activeWord : undefined}>
              {index > 0 ? " " : ""}
              {word}
            </Text>
          );
        })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  questionBubble: {
    backgroundColor: "#f0f4ff",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 16,
    marginBottom: 12,
    alignSelf: "flex-start" as const,
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
  },
  speakButton: {
    width: 24,
    height: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4a69bd",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  questionText: {
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 24,
    color: "#222",
  },
  activeWord: {
    color: "#4CAF50",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
});

export default TranslateContent;
