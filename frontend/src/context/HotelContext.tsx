import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  HotelInfo,
  RoomType,
  PhysicalRoom,
  Booking,
  OfferCoupon,
  Review,
  StaffMember,
  GuestRequest,
  NotificationItem,
  UserProfile,
  AddOnService,
  RoomStatus,
  BookingStatus,
  StayDuration,
  ApprovalStatus
} from '../types/hotel';
import {
  INITIAL_HOTEL,
  INITIAL_ROOM_TYPES,
  INITIAL_PHYSICAL_ROOMS,
  INITIAL_BOOKINGS,
  INITIAL_OFFERS,
  INITIAL_ADD_ONS,
  INITIAL_REVIEWS,
  INITIAL_STAFF,
  INITIAL_GUEST_REQUESTS,
  INITIAL_NOTIFICATIONS,
  CURRENT_DEMO_USER
} from '../data/seedData';
import { apiRequest } from '../services/api';

export type ActivePortal = 'guest' | 'user' | 'hotel_admin' | 'super_admin';

export type Currency = 'INR' | 'USD' | 'EUR';

interface CurrencyRate {
  symbol: string;
  rate: number;
}

const CURRENCIES: Record<Currency, CurrencyRate> = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.012 },
  EUR: { symbol: '€', rate: 0.011 }
};

export interface SearchState {
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  roomsCount: number;
  selectedCategory: string; // 'all' or room category
  priceRange: [number, number];
  amenitiesFilter: string[];
}

interface HotelContextType {
  // Master state
  hotel: HotelInfo;
  roomTypes: RoomType[];
  physicalRooms: PhysicalRoom[];
  bookings: Booking[];
  offers: OfferCoupon[];
  addOns: AddOnService[];
  reviews: Review[];
  staff: StaffMember[];
  guestRequests: GuestRequest[];
  notifications: NotificationItem[];
  currentUser: UserProfile | null;

  // UI state
  activePortal: ActivePortal;
  setActivePortal: (portal: ActivePortal) => void;
  currentView: ActivePortal;
  setCurrentView: (portal: ActivePortal) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatCurrency: (amountINR: number) => string;

  // Stay Duration & Selection
  stayDuration: StayDuration;
  setStayDuration: (d: StayDuration) => void;
  selectedRoomNumberForBooking: string | null;
  setSelectedRoomNumberForBooking: (roomNo: string | null) => void;

  // Search & Filters
  searchState: SearchState;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;
  nightsCount: number;

  // Modals & Flows
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isMyBookingsOpen: boolean;
  setIsMyBookingsOpen: (open: boolean) => void;
  isGalleryOpen: boolean;
  setIsGalleryOpen: (open: boolean) => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  selectedRoomForDetails: RoomType | null;
  setSelectedRoomForDetails: (room: RoomType | null) => void;
  selectedRoomForBooking: RoomType | null;
  setSelectedRoomForBooking: (room: RoomType | null) => void;
  latestConfirmedBooking: Booking | null;
  setLatestConfirmedBooking: (booking: Booking | null) => void;

  // Operations
  createBooking: (
    bookingData: Omit<
      Booking,
      | 'id'
      | 'createdAt'
      | 'bookingCode'
      | 'startTime'
      | 'expiresAt'
      | 'twentyFourHourRate'
      | 'durationDiscountAmount'
      | 'approvalStatus'
      | 'stayDuration'
    > & {
      stayDuration?: StayDuration;
      assignedRoomNumber?: string;
      twentyFourHourRate?: number;
      durationDiscountAmount?: number;
      approvalStatus?: ApprovalStatus;
    }
  ) => Booking;
  approveBooking: (codeOrId: string) => { success: boolean; message: string; booking?: Booking };
  rejectBooking: (codeOrId: string, reason?: string) => { success: boolean; message: string };
  expireBookingNow: (codeOrId: string) => void;
  searchBookingByCode: (code: string) => Booking | undefined;
  searchBookingAsync: (code: string) => Promise<Booking | null>;
  registerExternalBooking: (bookingData: any) => Booking;
  refreshBookingsFromBackend: () => Promise<void>;
  cancelBooking: (bookingId: string) => { success: boolean; message: string; refundAmount: number };
  checkInGuest: (bookingId: string, assignedRoomNumber?: string) => void;
  checkOutGuest: (bookingId: string) => void;
  updatePhysicalRoomStatus: (roomNumber: string, status: RoomStatus, notes?: string, assignedHousekeeper?: string) => void;
  updateBookingPaymentStatus: (bookingId: string, paymentStatus: any) => void;
  
  // Room Type Management
  updateRoomType: (id: string, data: Partial<RoomType>) => void;
  updateRoomTypePricing: (id: string, basePrice: number, discountPercentage: number) => void;
  addRoomType: (data: Omit<RoomType, 'id'>) => void;
  deleteRoomType: (id: string) => void;

  // Offers
  addOfferCoupon: (coupon: Omit<OfferCoupon, 'id' | 'usageCount'>) => void;
  addOffer: (coupon: Omit<OfferCoupon, 'id' | 'usageCount'>) => void;
  toggleOfferStatus: (id: string) => void;
  deleteOffer: (id: string) => void;

  // Reviews
  addReview: (review: Omit<Review, 'id' | 'approved' | 'helpfulVotes' | 'date'>) => void;
  toggleReviewApproval: (id: string) => void;
  approveReview: (id: string, approved: boolean) => void;
  respondToReview: (id: string, text: string, responderName: string) => void;
  replyToReview: (id: string, text: string, responderName: string) => void;
  voteHelpfulReview: (id: string) => void;

  // Staff
  addStaff: (member: Omit<StaffMember, 'id' | 'joinedDate'>) => void;
  addStaffMember: (member: Omit<StaffMember, 'id' | 'joinedDate'>) => void;
  updateStaff: (id: string, data: Partial<StaffMember>) => void;
  updateStaffStatus: (id: string, status: string) => void;
  deleteStaff: (id: string) => void;
  deleteStaffMember: (id: string) => void;

  // Hotel Info
  updateHotelInfo: (info: Partial<HotelInfo>) => void;
  updateHotelSettings: (info: Partial<HotelInfo>) => void;

  // Guest Requests
  createGuestRequest: (request: Omit<GuestRequest, 'id' | 'createdAt' | 'status'>) => void;
  updateGuestRequestStatus: (id: string, status: 'pending' | 'in_progress' | 'completed', assignedTo?: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;

  // User
  login: (phoneOrEmail: string, name?: string) => void;
  logout: () => void;
  upgradeToWizard: () => void;

  // Reset
  resetToDemoData: () => void;
  resetToFactoryDefaults: () => void;

  // Quick Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Real-Time Auto-Update
  isAutoUpdateEnabled: boolean;
  setIsAutoUpdateEnabled: (val: boolean) => void;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

// Helper for dates: today and tomorrow formatted YYYY-MM-DD
function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

const STORAGE_PREFIX = 'SV_GRAND_LUXURY_TPT_V2_';

export function normalizeBackendBooking(b: any, physicalRooms: PhysicalRoom[]): Booking {
  const bookingId = b.bookingId || b.id || `SVG-${Date.now()}`;
  const guestName = b.guestName || b.name || 'Guest';
  const guestPhone = b.phone || b.guestPhone || '';
  const guestEmail = b.email || b.guestEmail || '';
  const roomName = b.roomName || 'Deluxe AC Room';

  // Resolve roomTypeId
  let roomTypeId = 'rt-double-ac';
  const lowerName = (roomName + ' ' + (b.roomType || '')).toLowerCase();
  const isNonAc = lowerName.includes('non-ac') || lowerName.includes('non ac');
  const isSingle = lowerName.includes('single');
  if (isNonAc) {
    roomTypeId = isSingle ? 'rt-single-non-ac' : 'rt-double-non-ac';
  } else {
    roomTypeId = isSingle ? 'rt-single-ac' : 'rt-double-ac';
  }

  // Resolve assigned room number
  let assignedRoomNumber = b.assignedRoomNumber;
  if (!assignedRoomNumber) {
    const existingRoom = physicalRooms.find(
      (r) => r.currentBookingId === bookingId || r.currentBookingCode === bookingId
    );
    if (existingRoom) {
      assignedRoomNumber = existingRoom.roomNumber;
    } else {
      const avail = physicalRooms.find(
        (r) => r.roomTypeId === roomTypeId && r.status === 'available'
      );
      if (avail) {
        assignedRoomNumber = avail.roomNumber;
      }
    }
  }

  const checkIn = b.checkIn || new Date().toISOString().slice(0, 10);
  const checkOut = b.checkOut || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nights = Number(b.nights || 1);
  const adults = Number(b.adults ?? 1);
  const children = Number(b.children ?? 0);
  const grandTotal = Number(b.grandTotal || b.roomTotal || b.price || 1500);
  const price = Number(b.price || (nights > 0 ? Math.round(grandTotal / nights) : 1500));

  const isApproved = b.status === 'approved' || b.status === 'confirmed';
  const isCancelled = b.status === 'cancelled';
  const isCheckedIn = b.status === 'checked_in';
  const isCheckedOut = b.status === 'checked_out';

  const approvalStatus: ApprovalStatus = isApproved || isCheckedIn || isCheckedOut ? 'approved' : (isCancelled ? 'rejected' : 'pending');
  const bookingStatus: BookingStatus = isCancelled ? 'cancelled' : (isCheckedIn ? 'checked_in' : (isCheckedOut ? 'checked_out' : 'confirmed'));

  const expiresAt = b.expiresAt || new Date(new Date(checkOut + 'T11:00:00Z').getTime()).toISOString();

  return {
    id: bookingId,
    bookingCode: bookingId,
    guestId: b.userId ? `user-${b.userId}` : 'guest',
    guestName,
    guestEmail,
    guestPhone,
    roomTypeId,
    roomTypeName: roomName,
    assignedRoomNumber,
    stayDuration: (b.stayDuration as StayDuration) || '24h',
    startTime: b.createdAt || new Date().toISOString(),
    expiresAt,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    nights,
    roomsCount: 1,
    guestsCount: {
      adults,
      children
    },
    twentyFourHourRate: price,
    durationDiscountAmount: 0,
    baseAmount: b.roomTotal || grandTotal,
    discountAmount: 0,
    couponCode: b.couponCode,
    addOns: b.addOns || [],
    taxAmount: 0,
    totalAmount: grandTotal,
    paymentMethod: b.paymentMethod || 'upi',
    paymentStatus: b.paymentStatus || 'paid',
    approvalStatus,
    bookingStatus,
    transactionId: b.transactionId || `TXN-${bookingId.replace(/[^A-Za-z0-9]/g, '')}`,
    specialRequests: b.specialRequests,
    createdAt: b.createdAt || new Date().toISOString(),
    refundAmount: b.refundAmount,
    refundStatus: b.refundStatus || 'none'
  };
}

export const HotelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial states from LocalStorage or seed data
  const [hotel, setHotel] = useState<HotelInfo>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'HOTEL');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'SV Grand Luxury Rooms') {
          return { ...parsed, images: INITIAL_HOTEL.images };
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_HOTEL;
  });

  const [roomTypes, setRoomTypes] = useState<RoomType[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'ROOM_TYPES');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(r => r.id === 'rt-single-ac')) {
          return INITIAL_ROOM_TYPES.map((room) => {
            const savedRoom = parsed.find((item) => item.id === room.id);
            return savedRoom ? { ...room, ...savedRoom, images: room.images } : room;
          });
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_ROOM_TYPES;
  });

  const [physicalRooms, setPhysicalRooms] = useState<PhysicalRoom[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'PHYSICAL_ROOMS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(r => r.roomTypeId === 'rt-single-ac')) {
          return INITIAL_PHYSICAL_ROOMS.map((room) => {
            const savedRoom = parsed.find((item) => item.roomNumber === room.roomNumber);
            return savedRoom
              ? {
                  ...room,
                  ...savedRoom,
                  roomNumber: room.roomNumber,
                  floor: room.floor,
                  roomTypeId: room.roomTypeId
                }
              : room;
          });
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_PHYSICAL_ROOMS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'BOOKINGS');
    return saved ? JSON.parse(saved) : (INITIAL_BOOKINGS as Booking[]);
  });

  const [offers, setOffers] = useState<OfferCoupon[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'OFFERS');
    return saved ? JSON.parse(saved) : INITIAL_OFFERS;
  });

  const [addOns] = useState<AddOnService[]>(INITIAL_ADD_ONS);

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'REVIEWS');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'STAFF');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'REQUESTS');
    return saved ? JSON.parse(saved) : INITIAL_GUEST_REQUESTS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'NOTIFICATIONS');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'USER');
    return saved ? JSON.parse(saved) : CURRENT_DEMO_USER;
  });

  // UI state
  const [activePortal, setActivePortal] = useState<ActivePortal>('guest');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 12h vs 24h Stay Duration and specific room selection
  const [stayDuration, setStayDuration] = useState<StayDuration>('24h');
  const [selectedRoomNumberForBooking, setSelectedRoomNumberForBooking] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<RoomType | null>(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<RoomType | null>(null);
  const [latestConfirmedBooking, setLatestConfirmedBooking] = useState<Booking | null>(null);
  const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(true);

  const currentView = activePortal === 'guest' ? 'user' : activePortal;
  const setCurrentView = (portal: ActivePortal) => {
    setActivePortal(portal === 'user' ? 'guest' : portal);
  };

  // Search filter state
  const [searchState, setSearchState] = useState<SearchState>({
    checkInDate: getTodayString(),
    checkOutDate: getTomorrowString(),
    adults: 2,
    children: 0,
    roomsCount: 1,
    selectedCategory: 'all',
    priceRange: [1000, 10000],
    amenitiesFilter: []
  });

  const nightsCount = calculateNights(searchState.checkInDate, searchState.checkOutDate);

  // Broadcast sync helper
  const broadcastSync = () => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('sv_grand_hotel_live_sync');
        channel.postMessage({ type: 'STATE_CHANGED', timestamp: Date.now() });
        channel.close();
      } catch (e) {
        // BroadcastChannel fallback
      }
    }
  };

  // Sync to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'HOTEL', JSON.stringify(hotel));
  }, [hotel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'ROOM_TYPES', JSON.stringify(roomTypes));
  }, [roomTypes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'PHYSICAL_ROOMS', JSON.stringify(physicalRooms));
    broadcastSync();
  }, [physicalRooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'BOOKINGS', JSON.stringify(bookings));
    broadcastSync();
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'OFFERS', JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'REVIEWS', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'STAFF', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'REQUESTS', JSON.stringify(guestRequests));
  }, [guestRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'NOTIFICATIONS', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_PREFIX + 'USER', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_PREFIX + 'USER');
    }
  }, [currentUser]);

  // Real-time synchronization across browser tabs and views
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSync = () => {
      try {
        const savedBookings = localStorage.getItem(STORAGE_PREFIX + 'BOOKINGS');
        if (savedBookings) setBookings(JSON.parse(savedBookings));
        const savedRooms = localStorage.getItem(STORAGE_PREFIX + 'PHYSICAL_ROOMS');
        if (savedRooms) setPhysicalRooms(JSON.parse(savedRooms));
      } catch (e) {
        // ignore parse errors
      }
    };

    window.addEventListener('storage', handleSync);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('sv_grand_hotel_live_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'STATE_CHANGED') {
          handleSync();
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleSync);
      if (channel) channel.close();
    };
  }, []);

  // Auto-expiration ticker: checks every 5 seconds if room booked duration has expired,
  // marks it checked_out, and automatically makes the physical room Available again!
  useEffect(() => {
    const checkExpirations = () => {
      const nowMs = Date.now();
      let hasRoomExpired = false;

      setBookings((prevBookings) => {
        let changed = false;
        const next = prevBookings.map((b) => {
          if (
            b.expiresAt &&
            b.bookingStatus !== 'checked_out' &&
            b.bookingStatus !== 'cancelled' &&
            new Date(b.expiresAt).getTime() <= nowMs
          ) {
            changed = true;
            hasRoomExpired = true;
            return {
              ...b,
              bookingStatus: 'checked_out' as BookingStatus
            };
          }
          return b;
        });
        return changed ? next : prevBookings;
      });

      if (hasRoomExpired) {
        setPhysicalRooms((prevRooms) =>
          prevRooms.map((room) => {
            if (
              room.bookedUntil &&
              new Date(room.bookedUntil).getTime() <= nowMs &&
              room.status === 'occupied'
            ) {
              return {
                ...room,
                status: 'available',
                currentGuestName: undefined,
                currentBookingId: undefined,
                currentBookingCode: undefined,
                currentStayDuration: undefined,
                bookedUntil: undefined,
                approvalStatus: undefined,
                notes: 'Cleaned and auto-released after stay duration expired'
              };
            }
            return room;
          })
        );

        showToast('🕒 A room booking duration expired: Room automatically returned to Available!');
      }
    };

    const timer = setInterval(checkExpirations, 5000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const formatCurrency = (amountINR: number): string => {
    const info = CURRENCIES[currency];
    const converted = amountINR * info.rate;
    if (currency === 'INR') {
      return `₹${Math.round(converted).toLocaleString('en-IN')}`;
    }
    return `${info.symbol}${converted.toFixed(2)}`;
  };

  const addNotification = (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newItem: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  // Register an external or backend booking into state & physical room assignments
  const registerExternalBooking = (rawBooking: any): Booking => {
    const normalized = normalizeBackendBooking(rawBooking, physicalRooms);

    setBookings((prev) => {
      const normId = normalized.id.toUpperCase();
      const normCode = normalized.bookingCode.toUpperCase();
      const idx = prev.findIndex(
        (b) => b.id.toUpperCase() === normId || b.bookingCode?.toUpperCase() === normCode
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...normalized };
        return updated;
      }
      return [normalized, ...prev];
    });

    if (normalized.assignedRoomNumber) {
      setPhysicalRooms((prevRooms) =>
        prevRooms.map((r) => {
          if (r.roomNumber === normalized.assignedRoomNumber) {
            if (!r.currentBookingId || r.currentBookingId === normalized.id) {
              const isFree = normalized.bookingStatus === 'cancelled' || normalized.bookingStatus === 'checked_out';
              return {
                ...r,
                status: isFree ? 'available' : 'occupied',
                currentGuestName: isFree ? undefined : normalized.guestName,
                currentBookingId: isFree ? undefined : normalized.id,
                currentBookingCode: isFree ? undefined : normalized.bookingCode,
                currentStayDuration: isFree ? undefined : normalized.stayDuration,
                bookedUntil: isFree ? undefined : normalized.expiresAt,
                approvalStatus: isFree ? undefined : normalized.approvalStatus,
                notes: isFree
                  ? 'Available'
                  : normalized.approvalStatus === 'approved'
                  ? `Admin Approved (Code: ${normalized.bookingCode})`
                  : `Awaiting Admin Approval (Code: ${normalized.bookingCode})`
              };
            }
          }
          return r;
        })
      );
    }

    broadcastSync();
    return normalized;
  };

  // Synchronize bookings from backend database
  const refreshBookingsFromBackend = async () => {
    try {
      const res = await apiRequest('/api/admin/overview');
      if (res?.bookings && Array.isArray(res.bookings)) {
        res.bookings.forEach((b: any) => {
          registerExternalBooking(b);
        });
      }
    } catch {
      // not admin, continue to user bookings
    }

    try {
      const acc = await apiRequest('/api/bookings');
      if (acc?.bookings && Array.isArray(acc.bookings)) {
        acc.bookings.forEach((b: any) => {
          registerExternalBooking(b);
        });
      }
    } catch {
      // Keep offline/local data
    }
  };

  // Background Live Auto-Update Ticker (every 4 seconds)
  useEffect(() => {
    refreshBookingsFromBackend();
    if (!isAutoUpdateEnabled) return;
    const interval = setInterval(() => {
      refreshBookingsFromBackend();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoUpdateEnabled]);

  // Window Focus Auto-Refresh
  useEffect(() => {
    const onFocus = () => refreshBookingsFromBackend();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Search booking by confirmation code or ID with fuzzy, alphanumeric, and prefix matching
  const searchBookingByCode = (code: string): Booking | undefined => {
    if (!code) return undefined;
    const clean = code.trim().toUpperCase();
    const cleanNoHyphen = clean.replace(/[^A-Z0-9]/g, '');

    // 1. Exact match on booking code or ID
    const exact = bookings.find(
      (b) =>
        b.bookingCode?.toUpperCase() === clean ||
        b.id.toUpperCase() === clean
    );
    if (exact) return exact;

    // 2. Alphanumeric match (ignoring dashes / spaces)
    if (cleanNoHyphen.length >= 3) {
      const alphaMatch = bookings.find((b) => {
        const bCodeClean = (b.bookingCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const bIdClean = (b.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        return bCodeClean === cleanNoHyphen || bIdClean === cleanNoHyphen;
      });
      if (alphaMatch) return alphaMatch;
    }

    // 3. Substring match on code or phone or guest name
    return bookings.find((b) => {
      const bCode = (b.bookingCode || '').toUpperCase();
      const bId = (b.id || '').toUpperCase();
      const bCodeClean = bCode.replace(/[^A-Z0-9]/g, '');
      return (
        bCode.includes(clean) ||
        bId.includes(clean) ||
        (cleanNoHyphen.length >= 4 && bCodeClean.includes(cleanNoHyphen)) ||
        (clean.length >= 4 && b.guestPhone?.includes(clean)) ||
        (clean.length >= 3 && b.guestName?.toUpperCase().includes(clean))
      );
    });
  };

  // Search booking asynchronously (checks local memory first, falls back to backend verify API)
  const searchBookingAsync = async (code: string): Promise<Booking | null> => {
    if (!code) return null;
    const local = searchBookingByCode(code);
    if (local) return local;

    try {
      const res = await apiRequest(`/api/admin/bookings/verify/${encodeURIComponent(code.trim())}`);
      if (res?.booking) {
        return registerExternalBooking(res.booking);
      }
    } catch {
      // Not found in database
    }
    return null;
  };

  // Admin Verification & Approval
  const approveBooking = (codeOrId: string) => {
    const clean = codeOrId.trim().toUpperCase();
    const target = searchBookingByCode(clean);

    if (!target) {
      return { success: false, message: 'No reservation found matching this booking code' };
    }

    if (target.approvalStatus === 'approved') {
      return { success: true, message: 'Booking is already approved and confirmed', booking: target };
    }

    const updatedBooking: Booking = {
      ...target,
      approvalStatus: 'approved',
      bookingStatus: 'confirmed'
    };

    setBookings((prev) => prev.map((b) => (b.id === target.id ? updatedBooking : b)));

    // Confirm physical room is firmly Booked / Occupied
    if (target.assignedRoomNumber) {
      setPhysicalRooms((prev) =>
        prev.map((r) =>
          r.roomNumber === target.assignedRoomNumber
            ? {
                ...r,
                status: 'occupied',
                approvalStatus: 'approved',
                notes: `Admin Approved (Code: ${target.bookingCode})`
              }
            : r
        )
      );
    }

    // Sync to backend asynchronously
    apiRequest(`/api/admin/bookings/${encodeURIComponent(target.id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' })
    }).catch((err) => console.debug('Backend status sync error:', err));

    addNotification({
      title: `Booking Approved: ${target.bookingCode}`,
      message: `Front Desk Admin verified & approved reservation for ${target.guestName} (Room ${target.assignedRoomNumber || 'N/A'}, ${target.stayDuration}). Key issued!`,
      type: 'checkin'
    });

    showToast(`✅ Booking ${target.bookingCode} Approved by Admin!`);
    return { success: true, message: 'Booking approved successfully', booking: updatedBooking };
  };

  // Reject / Cancel booking
  const rejectBooking = (codeOrId: string, reason?: string) => {
    const clean = codeOrId.trim().toUpperCase();
    const target = searchBookingByCode(clean);

    if (!target) return { success: false, message: 'Booking not found' };

    setBookings((prev) =>
      prev.map((b) =>
        b.id === target.id
          ? {
              ...b,
              approvalStatus: 'rejected',
              bookingStatus: 'cancelled'
            }
          : b
      )
    );

    // Free physical room back to available
    if (target.assignedRoomNumber) {
      setPhysicalRooms((prev) =>
        prev.map((r) =>
          r.roomNumber === target.assignedRoomNumber
            ? {
                ...r,
                status: 'available',
                currentGuestName: undefined,
                currentBookingId: undefined,
                currentBookingCode: undefined,
                currentStayDuration: undefined,
                bookedUntil: undefined,
                approvalStatus: undefined,
                notes: reason || 'Booking rejected by admin'
              }
            : r
        )
      );
    }

    // Sync to backend asynchronously
    apiRequest(`/api/admin/bookings/${encodeURIComponent(target.id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' })
    }).catch((err) => console.debug('Backend status sync error:', err));

    showToast(`Booking ${target.bookingCode} rejected and room freed.`);
    return { success: true, message: 'Booking rejected and room made available.' };
  };

  // Fast-forward / Expire stay now (for testing Requirement 6 auto-release)
  const expireBookingNow = (codeOrId: string) => {
    const clean = codeOrId.trim().toUpperCase();
    const target = bookings.find(
      (b) => b.bookingCode?.toUpperCase() === clean || b.id.toUpperCase() === clean
    );
    if (!target) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === target.id
          ? {
              ...b,
              bookingStatus: 'checked_out',
              expiresAt: new Date(Date.now() - 1000).toISOString()
            }
          : b
      )
    );

    if (target.assignedRoomNumber) {
      setPhysicalRooms((prev) =>
        prev.map((r) =>
          r.roomNumber === target.assignedRoomNumber
            ? {
                ...r,
                status: 'available',
                currentGuestName: undefined,
                currentBookingId: undefined,
                currentBookingCode: undefined,
                currentStayDuration: undefined,
                bookedUntil: undefined,
                approvalStatus: undefined,
                notes: 'Stay duration expired - Auto released'
              }
            : r
        )
      );
    }

    showToast(`⚡ Fast-forward: Stay for ${target.bookingCode} expired! Room ${target.assignedRoomNumber} is now Available.`);
  };

  // Booking Operations
  const createBooking = (
    bookingData: Omit<
      Booking,
      | 'id'
      | 'createdAt'
      | 'bookingCode'
      | 'startTime'
      | 'expiresAt'
      | 'twentyFourHourRate'
      | 'durationDiscountAmount'
      | 'approvalStatus'
      | 'stayDuration'
    > & {
      stayDuration?: StayDuration;
      assignedRoomNumber?: string;
      twentyFourHourRate?: number;
      durationDiscountAmount?: number;
      approvalStatus?: ApprovalStatus;
    }
  ): Booking => {
    // 1. Double-booking Prevention Validation:
    if (bookingData.assignedRoomNumber) {
      const room = physicalRooms.find((r) => r.roomNumber === bookingData.assignedRoomNumber);
      if (room && room.status !== 'available') {
        const errorMsg = `Room ${bookingData.assignedRoomNumber} is already ${room.status}. Double booking is prevented. Please select another room.`;
        showToast(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
    }

    // 2. Generate unique memorable booking confirmation code: e.g. SVG-48219
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const bookingCode = `SVG-${randomSuffix}`;
    const newId = bookingCode;

    // Find available room if not explicitly picked
    let assignedRoomNumber = bookingData.assignedRoomNumber || selectedRoomNumberForBooking || undefined;
    if (!assignedRoomNumber) {
      const matchingRoom = physicalRooms.find(
        (r) => r.roomTypeId === bookingData.roomTypeId && r.status === 'available'
      );
      assignedRoomNumber = matchingRoom ? matchingRoom.roomNumber : undefined;
    }

    // 3. Calculate stay start time and expiration based on stay duration (12h vs 24h)
    const chosenDuration: StayDuration = bookingData.stayDuration || stayDuration || '24h';
    const now = new Date();
    const startTime = now.toISOString();
    const durationHours = chosenDuration === '12h' ? 12 : 24 * Math.max(1, bookingData.nights || 1);
    const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();

    const transactionId =
      bookingData.transactionId ||
      `TXN-${randomSuffix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newBooking: Booking = {
      ...bookingData,
      id: newId,
      bookingCode,
      assignedRoomNumber,
      stayDuration: chosenDuration,
      startTime,
      expiresAt,
      twentyFourHourRate: bookingData.twentyFourHourRate || 1500,
      durationDiscountAmount: bookingData.durationDiscountAmount || (chosenDuration === '12h' ? Math.round(1500 * 0.3) : 0),
      approvalStatus: 'pending', // PENDING ADMIN APPROVAL FOR FINAL CONFIRMATION
      bookingStatus: 'confirmed',
      paymentStatus: bookingData.paymentStatus || 'paid',
      transactionId,
      createdAt: startTime
    };

    setBookings((prev) => [newBooking, ...prev]);

    // 4. Immediately lock physical room to prevent double booking!
    if (assignedRoomNumber) {
      setPhysicalRooms((prev) =>
        prev.map((r) =>
          r.roomNumber === assignedRoomNumber
            ? {
                ...r,
                status: 'occupied',
                currentGuestName: bookingData.guestName,
                currentBookingId: newId,
                currentBookingCode: bookingCode,
                currentStayDuration: chosenDuration,
                bookedUntil: expiresAt,
                approvalStatus: 'pending',
                notes: `Awaiting Admin Approval (Code: ${bookingCode})`
              }
            : r
        )
      );
    }

    // Add notification
    addNotification({
      title: `Booking Confirmed: ${newId}`,
      message: `Reservation for ${bookingData.guestName} in ${bookingData.roomTypeName} confirmed (${bookingData.checkInDate} to ${bookingData.checkOutDate}).`,
      type: 'booking'
    });

    setLatestConfirmedBooking(newBooking);
    showToast(`🎉 Booking confirmed! Ref ID: ${newId}`);
    return newBooking;
  };

  const cancelBooking = (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return { success: false, message: 'Booking not found', refundAmount: 0 };

    if (target.bookingStatus === 'cancelled') {
      return { success: false, message: 'Booking is already cancelled', refundAmount: 0 };
    }

    // 100% refund if paid online, or 0 if pay at hotel
    const refund = target.paymentStatus === 'paid' ? target.totalAmount : 0;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              bookingStatus: 'cancelled' as BookingStatus,
              refundAmount: refund,
              refundStatus: refund > 0 ? 'processed' : 'none'
            }
          : b
      )
    );

    // Free up physical room if assigned
    if (target.assignedRoomNumber) {
      setPhysicalRooms((prev) =>
        prev.map((r) =>
          r.roomNumber === target.assignedRoomNumber
            ? {
                ...r,
                status: 'cleaning',
                currentGuestName: undefined,
                currentBookingId: undefined,
                notes: 'Needs turnover after cancellation'
              }
            : r
        )
      );
    }

    addNotification({
      title: `Booking Cancelled: ${bookingId}`,
      message: `Stay cancelled for ${target.guestName}. Refund of ₹${refund} initiated to original payment source.`,
      type: 'booking'
    });

    showToast(`Booking ${bookingId} cancelled. Refund: ₹${refund}`);
    return { success: true, message: 'Cancelled successfully', refundAmount: refund };
  };

  const checkInGuest = (bookingId: string, assignedRoomNumber?: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    let roomToAssign = assignedRoomNumber || target.assignedRoomNumber;
    if (!roomToAssign) {
      const freeRoom = physicalRooms.find(
        (r) => r.roomTypeId === target.roomTypeId && r.status === 'available'
      );
      if (freeRoom) roomToAssign = freeRoom.roomNumber;
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              bookingStatus: 'checked_in',
              assignedRoomNumber: roomToAssign
            }
          : b
      )
    );

    if (roomToAssign) {
      setPhysicalRooms((prev) =>
        prev.map((r) =>
          r.roomNumber === roomToAssign
            ? {
                ...r,
                status: 'occupied',
                currentGuestName: target.guestName,
                currentBookingId: bookingId
              }
            : r
        )
      );
    }

    showToast(`Guest ${target.guestName} checked into Room ${roomToAssign || 'Assigned'}`);
  };

  const checkOutGuest = (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, bookingStatus: 'checked_out' } : b))
    );

    if (target.assignedRoomNumber) {
      setPhysicalRooms((prev) =>
        prev.map((r) =>
          r.roomNumber === target.assignedRoomNumber
            ? {
                ...r,
                status: 'cleaning',
                currentGuestName: undefined,
                currentBookingId: undefined,
                notes: 'Checked out today - Deep cleaning required'
              }
            : r
        )
      );
    }

    showToast(`Guest checked out of Room ${target.assignedRoomNumber}. Sent to Housekeeping!`);
  };

  const updatePhysicalRoomStatus = (
    roomNumber: string,
    status: RoomStatus,
    notes?: string,
    assignedHousekeeper?: string
  ) => {
    setPhysicalRooms((prev) =>
      prev.map((r) => {
        if (r.roomNumber === roomNumber) {
          return {
            ...r,
            status,
            notes: notes !== undefined ? notes : r.notes,
            assignedHousekeeper:
              assignedHousekeeper !== undefined ? assignedHousekeeper : r.assignedHousekeeper,
            lastCleaned: status === 'available' ? 'Just now' : r.lastCleaned
          };
        }
        return r;
      })
    );
    showToast(`Room ${roomNumber} updated to ${status.toUpperCase()}`);
  };

  const updateBookingPaymentStatus = (bookingId: string, paymentStatus: any) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, paymentStatus } : b))
    );
    showToast(`Booking ${bookingId} payment updated to ${paymentStatus}`);
  };

  // Room Type Management
  const updateRoomType = (id: string, data: Partial<RoomType>) => {
    setRoomTypes((prev) => prev.map((rt) => (rt.id === id ? { ...rt, ...data } : rt)));
    showToast(`Room type details updated`);
  };

  const updateRoomTypePricing = (id: string, basePrice: number, discountPercentage: number) => {
    setRoomTypes((prev) =>
      prev.map((rt) => (rt.id === id ? { ...rt, basePrice, discountPercentage } : rt))
    );
    showToast(`Room tariff and discount updated`);
  };

  const addRoomType = (data: Omit<RoomType, 'id'>) => {
    const newId = `rt-${Date.now().toString(36)}`;
    const newRoomType: RoomType = { ...data, id: newId };
    setRoomTypes((prev) => [...prev, newRoomType]);
    showToast(`New room type "${data.name}" created`);
  };

  const deleteRoomType = (id: string) => {
    setRoomTypes((prev) => prev.filter((rt) => rt.id !== id));
    showToast(`Room category deleted`);
  };

  // Offers
  const addOfferCoupon = (coupon: Omit<OfferCoupon, 'id' | 'usageCount'>) => {
    const newId = `c-${Date.now().toString(36)}`;
    const newCoupon: OfferCoupon = { ...coupon, id: newId, usageCount: 0 };
    setOffers((prev) => [newCoupon, ...prev]);
    showToast(`Coupon code ${coupon.code} added`);
  };

  const toggleOfferStatus = (id: string) => {
    setOffers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const deleteOffer = (id: string) => {
    setOffers((prev) => prev.filter((c) => c.id !== id));
    showToast('Coupon removed');
  };

  // Reviews
  const addReview = (review: Omit<Review, 'id' | 'approved' | 'helpfulVotes' | 'date'>) => {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      date: 'Just now',
      approved: true,
      helpfulVotes: 0
    };
    setReviews((prev) => [newReview, ...prev]);
    showToast('Thank you! Your verified review has been published.');
  };

  const toggleReviewApproval = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, approved: !r.approved } : r))
    );
  };

  const approveReview = (id: string, approved: boolean) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, approved } : r))
    );
    showToast(approved ? 'Review approved & live' : 'Review unapproved');
  };

  const respondToReview = (id: string, text: string, responderName: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              managerResponse: {
                text,
                date: 'Just now',
                responderName
              }
            }
          : r
      )
    );
    showToast('Response posted to guest review');
  };

  const voteHelpfulReview = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpfulVotes: r.helpfulVotes + 1 } : r))
    );
  };

  // Staff
  const addStaff = (member: Omit<StaffMember, 'id' | 'joinedDate'>) => {
    const newStaff: StaffMember = {
      ...member,
      id: `staff-${Date.now()}`,
      joinedDate: getTodayString()
    };
    setStaff((prev) => [...prev, newStaff]);
    showToast(`Staff member ${member.name} registered`);
  };

  const updateStaff = (id: string, data: Partial<StaffMember>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    showToast('Staff details updated');
  };

  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    showToast('Staff member deleted');
  };

  // Hotel Info
  const updateHotelInfo = (info: Partial<HotelInfo>) => {
    setHotel((prev) => ({ ...prev, ...info }));
    showToast('Hotel profile & policies updated');
  };

  // Guest Requests
  const createGuestRequest = (request: Omit<GuestRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: GuestRequest = {
      ...request,
      id: `req-${Date.now()}`,
      status: 'pending',
      createdAt: 'Just now'
    };
    setGuestRequests((prev) => [newReq, ...prev]);
    showToast(`Request submitted for Room ${request.roomNumber}. Front desk notified!`);
  };

  const updateGuestRequestStatus = (
    id: string,
    status: 'pending' | 'in_progress' | 'completed',
    assignedTo?: string
  ) => {
    setGuestRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? {
              ...req,
              status,
              ...(assignedTo !== undefined ? { assignedTo } : {})
            }
          : req
      )
    );
    showToast(`Request marked as ${status}`);
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // User
  const login = (phoneOrEmail: string, name?: string) => {
    const isEmail = phoneOrEmail.includes('@');
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: name || (isEmail ? phoneOrEmail.split('@')[0] : 'Guest User'),
      email: isEmail ? phoneOrEmail : 'guest@oyorooms.com',
      phone: isEmail ? '+91 98765 43210' : phoneOrEmail,
      isWizardMember: true,
      wizardTier: 'Gold',
      walletBalance: 500,
      role: 'guest'
    };
    setCurrentUser(newUser);
    setActivePortal('guest'); // Direct entry to User Portal upon login / signup
    setIsAuthModalOpen(false);
    showToast(`Welcome back, ${newUser.name}!`);
  };

  const logout = () => {
    setCurrentUser(null);
    setActivePortal('guest'); // Reset to User Portal
    showToast('Logged out successfully');
  };

  const upgradeToWizard = () => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        isWizardMember: true,
        wizardTier: 'Gold',
        walletBalance: currentUser.walletBalance + 500
      });
    }
    showToast('🎉 Congratulations! You are now an OYO Wizard Gold Member.');
  };

  // Reset demo
  const resetToDemoData = () => {
    localStorage.removeItem(STORAGE_PREFIX + 'HOTEL');
    localStorage.removeItem(STORAGE_PREFIX + 'ROOM_TYPES');
    localStorage.removeItem(STORAGE_PREFIX + 'PHYSICAL_ROOMS');
    localStorage.removeItem(STORAGE_PREFIX + 'BOOKINGS');
    localStorage.removeItem(STORAGE_PREFIX + 'OFFERS');
    localStorage.removeItem(STORAGE_PREFIX + 'REVIEWS');
    localStorage.removeItem(STORAGE_PREFIX + 'STAFF');
    localStorage.removeItem(STORAGE_PREFIX + 'REQUESTS');
    localStorage.removeItem(STORAGE_PREFIX + 'NOTIFICATIONS');
    localStorage.removeItem(STORAGE_PREFIX + 'USER');

    setHotel(INITIAL_HOTEL);
    setRoomTypes(INITIAL_ROOM_TYPES);
    setPhysicalRooms(INITIAL_PHYSICAL_ROOMS);
    setBookings(INITIAL_BOOKINGS as Booking[]);
    setOffers(INITIAL_OFFERS);
    setReviews(INITIAL_REVIEWS);
    setStaff(INITIAL_STAFF);
    setGuestRequests(INITIAL_GUEST_REQUESTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUser(CURRENT_DEMO_USER);
    setActivePortal('guest');
    showToast('Platform reset to pristine demo data');
  };

  return (
    <HotelContext.Provider
      value={{
        hotel,
        roomTypes,
        physicalRooms,
        bookings,
        offers,
        addOns,
        reviews,
        staff,
        guestRequests,
        notifications,
        currentUser,
        activePortal,
        setActivePortal,
        currentView,
        setCurrentView,
        currency,
        setCurrency,
        formatCurrency,
        stayDuration,
        setStayDuration,
        selectedRoomNumberForBooking,
        setSelectedRoomNumberForBooking,
        searchState,
        setSearchState,
        nightsCount,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isMyBookingsOpen,
        setIsMyBookingsOpen,
        isGalleryOpen,
        setIsGalleryOpen,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        selectedRoomForDetails,
        setSelectedRoomForDetails,
        selectedRoomForBooking,
        setSelectedRoomForBooking,
        latestConfirmedBooking,
        setLatestConfirmedBooking,
        createBooking,
        approveBooking,
        rejectBooking,
        expireBookingNow,
        searchBookingByCode,
        searchBookingAsync,
        registerExternalBooking,
        refreshBookingsFromBackend,
        cancelBooking,
        checkInGuest,
        checkOutGuest,
        updatePhysicalRoomStatus,
        updateBookingPaymentStatus,
        updateRoomType,
        updateRoomTypePricing,
        addRoomType,
        deleteRoomType,
        addOfferCoupon,
        addOffer: addOfferCoupon,
        toggleOfferStatus,
        deleteOffer,
        addReview,
        toggleReviewApproval,
        approveReview,
        respondToReview,
        replyToReview: respondToReview,
        voteHelpfulReview,
        addStaff,
        addStaffMember: addStaff,
        updateStaff,
        updateStaffStatus: (id: string, status: string) => updateStaff(id, { status } as any),
        deleteStaff,
        deleteStaffMember: deleteStaff,
        updateHotelInfo,
        updateHotelSettings: updateHotelInfo,
        createGuestRequest,
        updateGuestRequestStatus,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        login,
        logout,
        upgradeToWizard,
        resetToDemoData,
        resetToFactoryDefaults: resetToDemoData,
        toastMessage,
        showToast,
        isAutoUpdateEnabled,
        setIsAutoUpdateEnabled
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = (): HotelContextType => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};
