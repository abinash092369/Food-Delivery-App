import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../api/driver.api';
import { DeliveryAssignment } from '../../types/driver.types';
import {
  MapPin,
  Calendar,
  IndianRupee,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  Loader2
} from 'lucide-react';

export const DeliveryHistoryPage: React.FC = () => {
  const [page, setPage] = useState<number>(0);
  const [historyList, setHistoryList] = useState<DeliveryAssignment[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Pull-to-refresh state
  const [pullDownY, setPullDownY] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const startYRef = useRef<number>(0);

  // Query history
  const { data, refetch, isFetching, isLoading } = useQuery({
    queryKey: ['deliveryHistory', page],
    queryFn: async () => {
      const res = await driverApi.getHistory(page, 20);
      return res.data;
    },
  });

  // Sync query data with list accumulator
  useEffect(() => {
    if (data) {
      if (page === 0) {
        setHistoryList(data.content);
      } else {
        setHistoryList((prev) => {
          // Prevent duplicates
          const existingIds = new Set(prev.map((item) => item.id));
          const filtered = data.content.filter((item) => !existingIds.has(item.id));
          return [...prev, ...filtered];
        });
      }
      setHasMore(!data.last && data.content.length > 0);
    }
  }, [data, page]);

  // Touch handlers for Pull-to-Refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull to refresh when scrolled at the very top
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      // Throttle pull down resistance
      setPullDownY(Math.min(diff * 0.4, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (startYRef.current === 0) return;
    startYRef.current = 0;

    if (pullDownY >= 50) {
      setRefreshing(true);
      setPullDownY(50);
      setPage(0);
      await refetch();
      setRefreshing(false);
    }
    setPullDownY(0);
  };

  const loadMore = () => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  // Helper to format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="space-y-5 relative min-h-[80vh]"
    >
      {/* Pull down indicator */}
      <div
        className="w-full flex items-center justify-center text-primary font-bold overflow-hidden transition-all duration-200"
        style={{ height: `${pullDownY}px` }}
      >
        {refreshing || isFetching ? (
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <ChevronDown
            className="w-5 h-5 mr-2 transition-transform"
            style={{ transform: pullDownY > 50 ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        )}
        <span className="text-xs tracking-wider uppercase">
          {refreshing || isFetching ? 'Refreshing...' : pullDownY > 50 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>

      <div className="flex justify-between items-baseline mb-4">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Delivery History</h1>
        <span className="text-xs font-semibold text-gray-500">{historyList.length} deliveries</span>
      </div>

      {isLoading && page === 0 ? (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs font-semibold text-gray-550">Loading history...</span>
        </div>
      ) : historyList.length === 0 ? (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-3 bg-white border border-gray-150 rounded-3xl p-6 text-center shadow-sm">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto" />
          <div>
            <h3 className="text-base font-extrabold text-gray-800">No deliveries yet</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Your completed delivery assignments will show up here. Go online to accept deliveries!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {historyList.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">
                    Order Number
                  </span>
                  <span className="text-sm font-black text-gray-800">
                    #{item.orderNumber || item.orderId}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(item.deliveredAt || item.assignedAt)}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full flex items-center gap-0.5 inline-flex">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span className="text-xs font-extrabold">{Number(item.earnings || item.earningsAmount || 0).toFixed(0)}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-600 font-bold">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  {Number(item.distanceKm || item.routeDistanceKm || 0).toFixed(1)} km traveled
                </span>
                <span className="text-gray-400 font-medium">
                  Duration: {item.estimatedDurationMin} mins
                </span>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={isFetching}
              className="w-full h-12 border border-gray-200 hover:bg-gray-50 rounded-2xl font-bold text-xs text-gray-600 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              {isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                'Load More Past Deliveries'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryHistoryPage;
