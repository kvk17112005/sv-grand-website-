export type RoomCategory =
  | 'classic'
  | 'deluxe'
  | 'suite'
  | 'executive'
  | 'single_ac'
  | 'single_non_ac'
  | 'double_ac'
  | 'double_non_ac'
  | 'single'
  | 'double'
  | 'ac'
  | 'non_ac'
  | string;

export type StayDuration = '12h' | '24h';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'pending_approval';

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type PaymentStatus = 'paid' | 'pending' | 'partially_paid' | 'refunded';

export type PaymentMethod = 'pay_at_hotel' | 'upi' | 'credit_card' | 'debit_card' | 'net_banking' | 'oyo_wallet';

export interface RoomType {
  id: string;
  category: RoomCategory;
  name: string;
  tagline: string;
  description: string;
  sizeSqFt: number;
  bedType: string;
  maxGuests: number;
  basePrice: number; // 24-hour price: 1500 for AC Single/Double, 1000 for Non-AC Single, 1500 for Non-AC Double
  extraPersonPrice?: number;
  isAC?: boolean;
  bedroomType?: 'single' | 'double';
  discountPercentage: number;
  images: string[];
  amenities: string[];
  totalRooms: number;
  availableRoomsCount?: number;
  featured?: boolean;
}

/**
 * Returns the exact 24-hour price as required:
 * - AC Single Room: ₹1,500
 * - AC Double Room: ₹1,500
 * - Non-AC Single Room: ₹1,000
 * - Non-AC Double Room: ₹1,500
 */
export function getRoom24HourPrice(room: RoomType): number {
  const isAC =
    room.isAC !== undefined
      ? room.isAC
      : room.name.toLowerCase().includes('ac') && !room.name.toLowerCase().includes('non-ac');
  const isSingle =
    room.bedroomType === 'single' ||
    room.name.toLowerCase().includes('single');

  if (isAC) {
    // Both AC Single and AC Double are ₹1,500 for 24 hours
    return 1500;
  } else {
    // Non-AC Single is ₹1,000; Non-AC Double is ₹1,500
    return isSingle ? 1000 : 1500;
  }
}

/**
 * Calculates pricing for 12-hour or 24-hour stays:
 * - 24-Hour Price: Standard base rate
 * - 12-Hour Booking: Applies a 30% discount to the 24-hour price
 */
export function calculateStayPricing(
  room: RoomType,
  duration: StayDuration = '24h',
  nightsCount: number = 1,
  roomsCount: number = 1
) {
  const twentyFourHourBase = getRoom24HourPrice(room);
  const is12Hour = duration === '12h';
  const durationDiscountPercentage = is12Hour ? 30 : 0;
  const durationDiscountAmount = is12Hour ? Math.round(twentyFourHourBase * 0.3) : 0;
  const effectiveStayRate = twentyFourHourBase - durationDiscountAmount;

  // For multi-night stays in 24h mode:
  const multiplier = is12Hour ? 1 : Math.max(1, nightsCount);
  const totalBaseRoomCost = effectiveStayRate * multiplier * Math.max(1, roomsCount);

  return {
    duration,
    twentyFourHourBase,
    durationDiscountPercentage,
    durationDiscountAmount,
    effectiveStayRate,
    totalBaseRoomCost,
    isAC: room.isAC ?? (room.name.toLowerCase().includes('ac') && !room.name.toLowerCase().includes('non-ac')),
    bedroomType: room.bedroomType ?? (room.name.toLowerCase().includes('single') ? 'single' : 'double')
  };
}

/**
 * Backward compatibility wrapper
 */
export function calculateRoomPricing(
  room: RoomType,
  _adultsCount: number = 1,
  nightsCount: number = 1,
  roomsCount: number = 1,
  duration: StayDuration = '24h'
) {
  const stay = calculateStayPricing(room, duration, nightsCount, roomsCount);
  return {
    isAC: stay.isAC,
    baseRatePerPerson: stay.twentyFourHourBase,
    extraPersonRate: 0,
    guestsInRoom: room.maxGuests,
    extraGuests: 0,
    extraGuestChargePerNight: 0,
    nightlyRatePerRoom: stay.effectiveStayRate,
    totalBaseRoomCost: stay.totalBaseRoomCost,
    durationDiscountAmount: stay.durationDiscountAmount,
    twentyFourHourBase: stay.twentyFourHourBase,
    duration: stay.duration
  };
}

export interface PhysicalRoom {
  roomNumber: string;
  floor: number;
  roomTypeId: string;
  status: RoomStatus;
  currentBookingId?: string;
  currentBookingCode?: string;
  currentGuestName?: string;
  currentStayDuration?: StayDuration;
  bookedUntil?: string; // ISO date string for auto-expiry
  approvalStatus?: ApprovalStatus;
  assignedHousekeeper?: string;
  notes?: string;
  lastCleaned?: string;
}

export interface AddOnService {
  id: string;
  name: string;
  description: string;
  price: number; // per night or per stay
  perNight: boolean;
  icon: string;
}

export interface Booking {
  id: string; // e.g. SVG-91024
  bookingCode: string; // Unique confirmation code (e.g. SVG-84920)
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomTypeId: string;
  roomTypeName: string;
  assignedRoomNumber?: string;
  stayDuration: StayDuration; // '12h' | '24h'
  startTime: string; // ISO timestamp
  expiresAt: string; // ISO timestamp when stay duration expires
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  nights: number;
  roomsCount: number;
  guestsCount: {
    adults: number;
    children: number;
  };
  twentyFourHourRate: number;
  durationDiscountAmount: number; // 30% discount if 12h
  baseAmount: number;
  discountAmount: number;
  couponCode?: string;
  addOns: {
    id: string;
    name: string;
    price: number;
  }[];
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  approvalStatus: ApprovalStatus; // 'pending' | 'approved' | 'rejected'
  bookingStatus: BookingStatus;
  transactionId?: string;
  specialRequests?: string;
  createdAt: string;
  refundAmount?: number;
  refundStatus?: 'none' | 'requested' | 'processed';
}

export interface Review {
  id: string;
  guestName: string;
  avatar?: string;
  rating: number; // 1-5
  date: string;
  roomType: string;
  title: string;
  comment: string;
  stayType: 'Business' | 'Couples' | 'Family' | 'Solo' | 'Friends';
  verified: boolean;
  ratingsBreakdown: {
    cleanliness: number;
    staff: number;
    location: number;
    amenities: number;
    value: number;
  };
  managerResponse?: {
    text: string;
    date: string;
    responderName: string;
  };
  approved: boolean;
  helpfulVotes: number;
}

export interface OfferCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscount?: number;
  minBookingAmount: number;
  validUntil: string;
  terms?: string;
  usageCount: number;
  active: boolean;
  badge?: string;
}

export type Offer = OfferCoupon;

export interface HotelInfo {
  id: string;
  name: string;
  oyoCode: string;
  tagline: string;
  type: string; // e.g. "Townhouse"
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  rating: number;
  totalReviewsCount: number;
  taxPercentage: number;
  gstNumber?: string;
  wizardDiscountPercentage?: number;
  cancellationPolicy: string;
  houseRules: string[];
  images: {
    exterior: string[];
    lobby: string[];
    dining: string[];
    facilities: string[];
  };
  surroundingPlaces: {
    name: string;
    distance: string;
    type: 'metro' | 'airport' | 'railway' | 'shopping' | 'hospital' | 'attraction';
  }[];
}

export interface GuestRequest {
  id: string;
  bookingId: string;
  roomNumber: string;
  guestName: string;
  type: 'room_cleaning' | 'extra_towels' | 'food_order' | 'late_checkout' | 'maintenance' | 'other';
  title: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  shift: 'Morning' | 'Evening' | 'Night' | 'General' | string;
  status: 'active' | 'on_leave' | 'inactive' | string;
  joinedDate: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'offer' | 'checkin' | 'system';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  isWizardMember: boolean;
  wizardTier?: 'Silver' | 'Gold' | 'Platinum';
  walletBalance: number;
  role: 'guest' | 'hotel_admin' | 'super_admin';
}
