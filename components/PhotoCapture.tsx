import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Colors, Typography } from '../constants/tokens';
import { Btn } from './Btn';
import { Icon } from './Icon';

interface PhotoCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export function PhotoCapture({ onCapture, onClose }: PhotoCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.perm}>
        <Icon name="camera" size={40} color={Colors.muted} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Btn label="Allow camera" kind="primary" onPress={requestPermission} style={{ marginTop: 16 }} />
        <Btn label="Cancel" kind="ghost" onPress={onClose} style={{ marginTop: 8 }} />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    console.log('[camera] taking picture...');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      console.log('[camera] photo uri:', photo?.uri);
      if (!photo?.uri) { console.log('[camera] no uri, aborting'); return; }
      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      console.log('[camera] resized base64 length:', resized.base64?.length);
      if (resized.base64) onCapture(resized.base64);
      else console.log('[camera] no base64 returned from manipulator');
    } catch (e) {
      console.log('[camera] error:', e);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Icon name="x" size={22} color={Colors.white} />
      </TouchableOpacity>

      <View style={styles.bottom}>
        <Text style={styles.hint}>Point at your meal</Text>
        <TouchableOpacity
          style={[styles.shutter, capturing && styles.shutterCapturing]}
          onPress={takePicture}
          activeOpacity={0.8}
        >
          {capturing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  perm: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  permTitle: { fontFamily: Typography.geist, fontSize: 18, fontWeight: '500', color: Colors.forest, marginTop: 8 },
  closeBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 48, paddingTop: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', gap: 16,
  },
  hint: { fontFamily: Typography.geist, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  shutter: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.ember,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: Colors.white,
  },
  shutterCapturing: { opacity: 0.7 },
  shutterInner: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.ember,
    borderWidth: 3, borderColor: Colors.white,
  },
});
