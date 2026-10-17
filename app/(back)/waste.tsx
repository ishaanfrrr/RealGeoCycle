import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import React from 'react';
import { StyleSheet, Pressable, View, ScrollView, Text, ActivityIndicator } from 'react-native';
import { readAsStringAsync } from 'expo-file-system/legacy';
import Ionicons from '@expo/vector-icons/Ionicons';
import { API_BASE_URL } from '@/constants/api';
import { Button, EmptyState, IconBadge } from '@/components/ui';
import { colors, radius, spacing, type } from '@/constants/theme';

function potentialJSON(textBlob: any) {
  // 1. Input Validation
  if (typeof textBlob !== 'string') {
    console.error("Error: Input must be a string. Received:", typeof textBlob);
    return null;
  }

  // 2. Normalize: Trim surrounding whitespace
  let content = textBlob.trim();

  // 3. Define markers
  const startMarker = "```json";
  const endMarker = "```";

  let jsonString;

  // 4. Check for and strip markers
  if (content.startsWith(startMarker)) {
    if (content.endsWith(endMarker)) {
      // Extract content between markers
      const startIndex = startMarker.length;
      // Use negative index for slice to count from the end
      const endIndex = content.length - endMarker.length;

      // Check if markers overlap or content is empty between them
      if (startIndex >= endIndex) {
         jsonString = ""; // Represents empty content between markers
      } else {
         jsonString = content.slice(startIndex, endIndex).trim(); // Trim whitespace *inside* markers too
      }

    } else {
      // Starts with ```json but doesn't end with ``` - treat as malformed
      console.warn(`Warning: String starts with '${startMarker}' but does not end with '${endMarker}'. Treating as invalid.`);
      // Don't attempt parsing in this ambiguous case
      return null;
    }
  } else {
    // Assume the entire trimmed string is the JSON content
    jsonString = content;
  }

  // 5. Handle empty extracted string (e.g., input was "```json```" or just "")
  if (!jsonString) {
      // An empty string is not valid JSON according to JSON.parse()
      console.warn("Warning: Extracted string for parsing is empty.");
      return null;
  }

  // 6. Attempt to parse
  try {
    const parsedData = JSON.parse(jsonString);
    return parsedData;
  } catch (error) {
    // Check if it's a JSON parsing error specifically
    if (error instanceof SyntaxError) {
      console.error("Error decoding JSON:", error.message);
    } else {
      // Catch other potential errors
      console.error("An unexpected error occurred during parsing:", error);
    }
    return null; // Return null on failure
  }
}

type ScanResult =
  | { kind: 'result'; recyclable: boolean; type: string; info: string }
  | { kind: 'error'; message: string };

export default function Waste() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const ref = useRef(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();

  const takePicture = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      //@ts-ignore
      const photo = await ref.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
      let parsed;
      if (!photo.hasOwnProperty("base64"))
        //@ts-ignore
        parsed = await readAsStringAsync(photo.uri, { encoding: 'base64' });
      else
        parsed = photo.base64;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: parsed,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.text();
      console.log('Backend response:', data);
      const parsedResult = potentialJSON(data);
      if (!parsedResult) {
        setResult({ kind: 'error', message: 'We couldn\'t identify that item. Try again with it centred and well lit.' });
        return;
      }
      const { recyclable, type, info } = parsedResult;
      setResult({ kind: 'result', recyclable: !!recyclable, type, info });
    } catch (error: any) {
      console.error('Error sending image to server:', error);
      setResult({
        kind: 'error',
        message: error.name === 'AbortError' ? 'That took too long. Check your connection and try again.' : 'Something went wrong. Please try again.',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="camera-outline"
          title="Camera access needed"
          message="GeoCycle uses your camera to scan items and tell you whether they can be recycled."
          action={<Button label="Allow camera" icon="camera" onPress={requestPermission} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/*@ts-ignore */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} ref={ref} />

      <View style={styles.hintPill} pointerEvents="none">
        <Ionicons name="sparkles" size={14} color={colors.primary} />
        <Text style={styles.hintText}>Point at an item and tap to scan</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.sideSlot} />
        <Pressable
          onPress={takePicture}
          disabled={analyzing}
          accessibilityRole="button"
          accessibilityLabel="Scan item"
          style={({ pressed }) => [styles.captureButton, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <View style={styles.captureInner} />
        </Pressable>
        <Pressable
          onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
          accessibilityRole="button"
          accessibilityLabel="Flip camera"
          style={({ pressed }) => [styles.roundButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
        </Pressable>
      </View>

      {analyzing && (
        <View style={styles.overlay}>
          <View style={styles.analyzingCard}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[type.heading, { marginTop: spacing.lg }]}>Analyzing…</Text>
            <Text style={[type.bodyMuted, { marginTop: spacing.xs }]}>This takes a few seconds</Text>
          </View>
        </View>
      )}

      {result && (
        <View style={[styles.overlay, { justifyContent: 'flex-end' }]}>
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
              {result.kind === 'result' ? (
                <>
                  <View style={styles.resultHeader}>
                    <IconBadge
                      name={result.recyclable ? 'leaf' : 'trash'}
                      color={result.recyclable ? colors.primary : colors.danger}
                      bg={result.recyclable ? colors.primarySoft : colors.dangerSoft}
                      size={52}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.verdict, { color: result.recyclable ? colors.primary : colors.danger }]}>
                        {result.recyclable ? 'Recyclable' : 'Not recyclable'}
                      </Text>
                      <Text style={type.heading}>{result.type}</Text>
                    </View>
                  </View>
                  <Text style={[type.body, { color: colors.textMuted }]}>{result.info}</Text>
                </>
              ) : (
                <>
                  <View style={styles.resultHeader}>
                    <IconBadge name="alert-circle" color={colors.warning} bg={colors.warningSoft} size={52} />
                    <Text style={[type.heading, { flex: 1 }]}>Scan didn't work</Text>
                  </View>
                  <Text style={[type.body, { color: colors.textMuted }]}>{result.message}</Text>
                </>
              )}
              <Button label="Scan another item" icon="scan" onPress={() => setResult(null)} style={{ marginTop: spacing.xl }} />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hintPill: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(10, 15, 12, 0.75)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  hintText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  sideSlot: {
    width: 52,
  },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(10, 15, 12, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  verdict: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
});
