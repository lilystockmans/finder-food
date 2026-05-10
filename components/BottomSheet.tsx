import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Colors, Radius } from '../constants/tokens';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number | string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function BottomSheet({ visible, onClose, children, maxHeight = SCREEN_HEIGHT * 0.78 }: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { maxHeight: maxHeight as number }]}>
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.line,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  content: {
    padding: 22,
    paddingBottom: 36,
  },
});
