export type Merchant = {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  timezone: string;
  booking_buffer_minutes: number;
  cancellation_policy_hours: number;
  no_show_penalty_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  merchant_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Schedule = {
  id: string;
  merchant_id: string;
  day_of_week: number; // 0=Sun, 6=Sat
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  is_active: boolean;
  created_at: string;
};

export type BlockedDate = {
  id: string;
  merchant_id: string;
  date: string; // YYYY-MM-DD
  reason: string | null;
  created_at: string;
};

export type Customer = {
  id: string;
  merchant_id: string;
  email: string;
  name: string;
  phone: string | null;
  no_show_count: number;
  total_bookings: number;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
};

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "no_show"
  | "completed";

export type Booking = {
  id: string;
  merchant_id: string;
  service_id: string;
  customer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  deposit_paid: boolean;
  notes: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  service?: Service;
  customer?: Customer;
};
