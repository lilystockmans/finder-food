import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Typography } from '../constants/tokens';
import { Btn } from './Btn';
import { Icon } from './Icon';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface BarcodeScannerProps {
  onScanned: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScanned, onClose }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scanlineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(scanlineY, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(scanlineY, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]).start(() => animate());
    };
    animate();
    return () => scanlineY.stopAnimation();
  }, []);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionBox}>
        <Icon name="camera" size={40} color={Colors.muted} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permSub}>Required to scan barcodes</Text>
        <Btn label="Allow camera" kind="primary" onPress={requestPermission} style={{ marginTop: 16 }} />
        <Btn label="Cancel" kind="ghost" onPress={onClose} style={{ marginTop: 8 }} />
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
  };

  const overlaySize = SCREEN_WIDTH * 0.65;
  const translateY = scanlineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, overlaySize - 2],
  });

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Dark overlay with cut-out */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayRow}>
          <View style={styles.overlaySide} />
          <View style={[styles.cutout, { width: overlaySize, height: overlaySize }]}>
            {/* Corner brackets */}
            {[['tl', 0, 0], ['tr', 0, 'auto'], ['bl', 'auto', 0], ['br', 'auto', 'auto']].map(([pos, t, r]) => (
              <View key={String(pos)} style={[styles.corner, {
                top: typeof t === 'number' ? t : undefined,
                bottom: typeof t === 'string' ? 0 : undefined,
                left: typeof r === 'number' ? r : undefined,
                right: typeof r === 'string' ? 0 : undefined,
              }]} />
            ))}
            {/* Animated scanline */}
            <Animated.View style={[styles.scanline, { transform: [{ translateY }] }]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.hint}>Point at a barcode</Text>
          {scanned && (
            <TouchableOpacity onPress={() => setScanned(false)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Tap to scan again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Icon name="x" size={22} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionBox: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  permTitle: { fontFamily: Typography.geist, fontSize: 18, fontWeight: '500', color: Colors.forest, marginTop: 8 },
  permSub: { fontFamily: Typography.geist, fontSize: 14, color: Colors.muted },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayRow: { flexDirection: 'row' },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingTop: 20 },
  cutout: { overflow: 'hidden' },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.ice,
    borderWidth: 2.5,
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.ice,
    opacity: 0.85,
  },
  hint: {
    fontFamily: Typography.geist,
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  retryBtn: { marginTop: 12, padding: 10 },
  retryText: { fontFamily: Typography.geist, fontSize: 14, color: Colors.ice },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
