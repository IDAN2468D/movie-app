import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Haptics from 'expo-haptics';
import { API_BASE_URL } from '@/constants/Config';

export interface IAuction {
  _id: string;
  originalSeat: string;
  targetSeat?: string;
  highestBid: number;
  pointsRequired: number;
  ownerId?: { name: string };
  expiresAt: string;
}

export function useSeatAuctionSocket(showtimeId: string, token: string | null) {
  const [auctions, setAuctions] = useState<IAuction[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const socketUrl = API_BASE_URL.replace('/api', '');
    const socketInstance = io(socketUrl, { autoConnect: true });
    setSocket(socketInstance);

    socketInstance.emit('join_auction', { showtimeId });

    socketInstance.on('initial_auctions', (data: IAuction[]) => {
      setAuctions(data);
    });

    socketInstance.on('bid_updated', ({ auctionId, highestBid }: { auctionId: string; highestBid: number }) => {
      setAuctions((prev) =>
        prev.map((auc) => (auc._id === auctionId ? { ...auc, highestBid } : auc))
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    });

    socketInstance.on('swap_confirmed', ({ auctionId }: { auctionId: string }) => {
      setAuctions((prev) => prev.filter((auc) => auc._id !== auctionId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [showtimeId]);

  const fetchActiveAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/mcp/seatauction/active/${showtimeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAuctions(json.data);
          return;
        }
      }
    } catch {
      // Offline fallback simulation
    } finally {
      setLoading(false);
    }

    setAuctions([
      { _id: 'auc-1', originalSeat: 'H-12', highestBid: 80, pointsRequired: 50, ownerId: { name: 'יוני' }, expiresAt: new Date(Date.now() + 3600000).toISOString() },
      { _id: 'auc-2', originalSeat: 'G-14', targetSeat: 'F-14', highestBid: 0, pointsRequired: 30, ownerId: { name: 'שירה' }, expiresAt: new Date(Date.now() + 1800000).toISOString() },
    ]);
  }, [showtimeId, token]);

  const placeBid = async (auctionId: string, pointsBid: number) => {
    if (socket) {
      socket.emit('new_bid_placed', { showtimeId, auctionId, highestBid: pointsBid, highestBidderName: 'אני' });
    }
    setAuctions((prev) =>
      prev.map((auc) => (auc._id === auctionId ? { ...auc, highestBid: pointsBid } : auc))
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return { auctions, loading, socket, fetchActiveAuctions, placeBid };
}
