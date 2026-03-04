"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, DollarSign, CalendarDays, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { createClient } from "@/lib/supabase/client";
import type { Merchant, Service, Schedule, BlockedDate } from "@/types/database";

type Step = "service" | "date" | "time" | "info" | "confirm" | "done";

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("service");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingId, setBookingId] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: m } = await supabase
        .from("merchants")
        .select("*")
        .eq("slug", slug)
        .single();
      if (!m) { setLoading(false); return; }
      setMerchant(m);

      const { data: svcs } = await supabase
        .from("services")
        .select("*")
        .eq("merchant_id", m.id)
        .eq("is_active", true)
        .order("created_at");
      setServices(svcs || []);

      const { data: scheds } = await supabase
        .from("schedules")
        .select("*")
        .eq("merchant_id", m.id);
      setSchedules(scheds || []);

      const { data: bd } = await supabase
        .from("blocked_dates")
        .select("date")
        .eq("merchant_id", m.id);
      setBlockedDates((bd || []).map((b) => b.date));
      setLoading(false);
    };
    load();
  }, [slug]);

  // Generate available time slots
  const getTimeSlots = () => {
    if (!selectedDate || !selectedService) return [];
    const dayOfWeek = selectedDate.getDay();
    const schedule = schedules.find((s) => s.day_of_week === dayOfWeek && s.is_active);
    if (!schedule) return [];

    const slots: string[] = [];
    const [sh, sm] = schedule.start_time.split(":").map(Number);
    const [eh, em] = schedule.end_time.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const dur = selectedService.duration_minutes;

    for (let m = startMin; m + dur <= endMin; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
    }
    return slots;
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (blockedDates.includes(dateStr)) return true;
    const dow = date.getDay();
    const sched = schedules.find((s) => s.day_of_week === dow && s.is_active);
    return !sched;
  };

  const handleSubmit = async () => {
    if (!merchant || !selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    const supabase = createClient();

    // Find or create customer
    let customerId = "";
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("merchant_id", merchant.id)
      .eq("email", email)
      .single();

    if (existing) {
      customerId = existing.id;
    } else {
      const { data: newC } = await supabase
        .from("customers")
        .insert({
          merchant_id: merchant.id,
          name,
          email,
          phone: phone || null,
        })
        .select()
        .single();
      customerId = newC?.id || "";
    }

    // Calculate end time
    const [h, m] = selectedTime.split(":").map(Number);
    const endMin = h * 60 + m + selectedService.duration_minutes;
    const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;

    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        merchant_id: merchant.id,
        service_id: selectedService.id,
        customer_id: customerId,
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTime,
        end_time: endTime,
        status: "pending",
        notes: notes || null,
      })
      .select()
      .single();

    setBookingId(booking?.id || "");
    setStep("done");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-12">
            <h2 className="text-lg font-semibold text-gray-900">Not Found</h2>
            <p className="mt-2 text-sm text-gray-500">This booking page doesn&apos;t exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeSlots = getTimeSlots();

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white p-4">
      <div className="mx-auto max-w-lg space-y-6 py-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{merchant.business_name}</h1>
          <p className="text-sm text-gray-500">Book an appointment</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2">
          {(["service", "date", "time", "info", "confirm"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full ${
                (["service", "date", "time", "info", "confirm"] as Step[]).indexOf(step) >= i
                  ? "bg-violet-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step: Service */}
        {step === "service" && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Choose a Service</h2>
            {services.map((s) => (
              <Card
                key={s.id}
                className={`cursor-pointer transition hover:border-violet-300 ${
                  selectedService?.id === s.id ? "border-violet-500 ring-2 ring-violet-200" : ""
                }`}
                onClick={() => setSelectedService(s)}
              >
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <h3 className="font-medium">{s.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{s.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${s.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {selectedService?.id === s.id && (
                    <Check className="h-5 w-5 text-violet-600" />
                  )}
                </CardContent>
              </Card>
            ))}
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700"
              disabled={!selectedService}
              onClick={() => setStep("date")}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step: Date */}
        {step === "date" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pick a Date</h2>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || isDateDisabled(date)}
                className="rounded-md border"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("service")} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={!selectedDate}
                onClick={() => setStep("time")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === "time" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Select a Time – {selectedDate && format(selectedDate, "MMM d")}
            </h2>
            {timeSlots.length === 0 ? (
              <p className="text-center text-sm text-gray-400">No available slots</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((t) => (
                  <Button
                    key={t}
                    variant={selectedTime === t ? "default" : "outline"}
                    className={selectedTime === t ? "bg-violet-600" : ""}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("date")} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={!selectedTime}
                onClick={() => setStep("info")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Info */}
        {step === "info" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Information</h2>
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(optional)" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requests?" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("time")} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={!name || !email}
                onClick={() => setStep("confirm")}
              >
                Review
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Confirm Booking</h2>
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Service</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="font-medium">{selectedService?.duration_minutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Price</span>
                  <span className="font-bold text-violet-600">${selectedService?.price.toFixed(2)}</span>
                </div>
                {selectedService && selectedService.deposit_amount > 0 && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-800">
                      Deposit required: ${selectedService.deposit_amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Please pay the deposit to confirm your booking. Details will be sent to your email.
                    </p>
                  </div>
                )}
                {merchant.cancellation_policy_hours > 0 && (
                  <p className="text-xs text-gray-400">
                    Free cancellation up to {merchant.cancellation_policy_hours}h before your appointment.
                  </p>
                )}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <Card>
            <CardContent className="space-y-4 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Booking Confirmed!</h2>
              <p className="text-sm text-gray-500">
                Your appointment for {selectedService?.name} on{" "}
                {selectedDate && format(selectedDate, "MMM d, yyyy")} at {selectedTime} has been booked.
              </p>
              {bookingId && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/booking/${bookingId}/manage`}
                >
                  Manage Booking
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
