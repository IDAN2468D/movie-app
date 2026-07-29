import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface NFCTapCardProps {
  movieTitle: string;
  hallName: string;
  seatNumber: string;
  nfcStatus: 'ready' | 'tapping' | 'granted';
  onTap: () => void;
}

export const NFCTapCard: React.FC<NFCTapCardProps> = ({
  movieTitle,
  hallName,
  seatNumber,
  nfcStatus,
  onTap,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topBar}>
        <Text style={styles.walletBadge}> Apple Wallet / Google Wallet</Text>
        <Text style={styles.nfcIcon}>📡 NFC</Text>
      </View>

      <Text style={styles.movieTitle}>{movieTitle}</Text>
      <Text style={styles.detailsText}>
        {hallName} • {seatNumber}
      </Text>

      <TouchableOpacity
        style={[styles.tapBox, nfcStatus === 'granted' && styles.grantedTapBox]}
        onPress={onTap}
      >
        <Text style={styles.tapIcon}>{nfcStatus === 'granted' ? '✅' : '📲'}</Text>
        <Text style={styles.tapText}>
          {nfcStatus === 'granted'
            ? 'גישה אושרה! המעבר פתוח'
            : 'קרב את המכשיר לקורא בכניסה לאולם'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    marginVertical: 12,
  },
  topBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  walletBadge: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  nfcIcon: {
    color: '#E5FF00',
    fontSize: 12,
    fontWeight: '800',
  },
  movieTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  detailsText: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
    marginBottom: 16,
  },
  tapBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  grantedTapBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  tapIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  tapText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
