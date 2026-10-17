  import { CameraView, useCameraPermissions } from 'expo-camera';
  import { useState, useRef } from 'react';
  import React from 'react'
  import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
  import { readAsStringAsync } from 'expo-file-system/legacy';
  //@ts-ignore
  import BottomSheet from 'react-native-simple-bottom-sheet';
  import { Modal, Portal, Text, Button, ActivityIndicator, MD2Colors } from 'react-native-paper';
  import { API_BASE_URL } from '@/constants/api';

  function potentialJSON(textBlob) {
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
        // Optional: Log the string that failed (be careful with large strings)
        // console.error("--- Failed content start ---\n" + jsonString.substring(0, 200) + "...\n--- Failed content end ---");
      } else {
        // Catch other potential errors
        console.error("An unexpected error occurred during parsing:", error);
      }
      return null; // Return null on failure
    }
  }
  
  export default function Waste() {
    const [visible, setVisible] = useState(false);
    const [lVisible, lSetVisible] = useState(false);
    const [recyclable, setRecyclable] = useState(null);
    const [type, setType] = useState('');
    const [info, setInfo] = useState('');
    const ref = useRef(null);
    const [facing, setFacing] = useState('back');
    const [permission, requestPermission] = useCameraPermissions();

    const takePicture = async () => {
      lSetVisible(true);
      //@ts-ignore
      const photo = await ref.current.takePictureAsync({quality:0.5 ,skipProcessing:true});
      let parsed;
      
      if (!photo.hasOwnProperty("base64"))
        //@ts-ignore
        parsed = await readAsStringAsync(photo.uri, { encoding: 'base64' });
      else
        parsed = photo.base64;
        try {
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
          const result = potentialJSON(data);
          if (!result) {
            lSetVisible(false);
            alert(`Backend said: ${data.substring(0, 200)}`);
            return;
          }
          const { recyclable, type, info } = result;
          setRecyclable(recyclable);
          setType(type);
          setInfo(info);
          lSetVisible(false);
          setVisible(true);
        } catch (error: any) {
          console.error('Error sending image to server:', error);
          lSetVisible(false);
          alert(error.name === 'AbortError' ? 'Request timed out. Try again.' : 'Something went wrong. Please try again.');
        }
    };

    if (!permission) {
      return <View />;
    }

    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
          <Button onPress={requestPermission}> Grant Permission </Button>
        </View>
      );
    }

    function toggleCameraFacing() {
      setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
      <>
        <Portal>
          <Modal
            visible={lVisible}
            onDismiss={() =>lSetVisible(false)}
            contentContainerStyle={{
              backgroundColor: '#121212',
              padding: 20,
              width: '90%',
              alignSelf: 'center',
              borderRadius: 10,
            }}
          >
            <ActivityIndicator animating={true} color={MD2Colors.red800} size="large" />
          </Modal>
        </Portal>
        <Portal>
          <Modal
            visible={visible}
            onDismiss={()=>setVisible(false)}
            contentContainerStyle={{
              backgroundColor: '#121212',
              padding: 20,
              width: '90%',
              alignSelf: 'center',
              borderRadius: 10,
            }}
          >
            <ScrollView>
              {recyclable !== null && (
                <>
                  <Text style={{ ...styles.text, color: '#90EE90', fontSize: 40 }}>
                  {`Success!\n\n`}
                  </Text>
                  <Text style={styles.infoText}>
                    {type}
                  </Text>
                  <Text style={{ ...styles.infoText, color: recyclable ? 'green' : 'red' }}>
                    {recyclable ? 'recyclable' : 'not recyclable'} {'\n\n\n'}
                  </Text>
                  <Text style={styles.infoText}>
                    {info} {'\n\n\n'}
                  </Text>
                </>
              )}
              <Button
                onPress={()=>{setVisible(false)}}
                theme={{ colors: { primary: 'white' } }}
                mode="contained"
              >
                Close!
              </Button>
            </ScrollView>
          </Modal>
        </Portal>
        <View style={styles.container}>
          {/*@ts-ignore */}
          <CameraView style={styles.camera} facing={facing} ref={ref}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <Text style={styles.flipIcon}>↺</Text>
                <Text style={styles.flipLabel}>Flip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
              <View style={styles.placeholder} />
            </View>
          </CameraView>
        </View>
        <BottomSheet isOpen={false}>
          <View style={{ height: 300 }} >
          <Text style={styles.header}>How do I use this?</Text>
          <Text style={styles.paragraph}>
            {`\nHave you ever had something you wanted to toss, but were unsure of whether it should go in the trash, recycling bin, or compost?\n\n Our waste classification feature uses the power of AI to tell you where it should go! Just snap a picture of the waste to get started.\n\n\n`}
          </Text>
          <View />
          </View>
        </BottomSheet>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    camera: {
      flex: 1,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 30,
    },
    flipButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 50,
      width: 60,
      height: 60,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    flipIcon: {
      fontSize: 22,
      color: 'white',
      fontWeight: 'bold',
    },
    flipLabel: {
      fontSize: 10,
      color: 'white',
      marginTop: -2,
    },
    captureButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderWidth: 4,
      borderColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
    },
    captureInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: 'white',
    },
    placeholder: {
      width: 60,
    },
    text: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
    },
    infoText: {
      fontSize: 23,
      color: 'white',
      textAlign: 'center',
    },
    header: {
      fontSize: 40,
      color: 'black',
      textAlign: 'center',
    },
    paragraph: {
      fontSize: 18,
      color: 'black',
      textAlign: 'center',
    },
  });
