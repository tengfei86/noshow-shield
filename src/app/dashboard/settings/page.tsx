"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { updateMerchant } from "@/app/actions/merchant";
import type { Merchant } from "@/types/database";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function SettingsPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [cancellationHours, setCancellationHours] = useState(24);
  const [noShowPenalty, setNoShowPenalty] = useState(0);
  const [bufferMinutes, setBufferMinutes] = useState(15);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("merchants")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (!data) return;
      setMerchant(data);
      setBusinessName(data.business_name);
      setSlug(data.slug);
      setTimezone(data.timezone);
      setCurrency(data.currency);
      setCancellationHours(data.cancellation_policy_hours);
      setNoShowPenalty(data.no_show_penalty_amount);
      setBufferMinutes(data.booking_buffer_minutes);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateMerchant({
      business_name: businessName,
      slug,
      timezone,
      currency,
      cancellation_policy_hours: cancellationHours,
      no_show_penalty_amount: noShowPenalty,
      booking_buffer_minutes: bufferMinutes,
    });
    setSaving(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Business Name</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
            <div>
              <Label>URL Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Cancellation Policy (hours before)</Label>
              <Input
                type="number"
                value={cancellationHours}
                onChange={(e) => setCancellationHours(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-gray-400">
                Customers can cancel for free up to this many hours before
              </p>
            </div>
            <div>
              <Label>No-Show Penalty ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={noShowPenalty}
                onChange={(e) => setNoShowPenalty(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label>Booking Buffer (minutes)</Label>
            <Input
              type="number"
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(Number(e.target.value))}
              className="max-w-xs"
            />
            <p className="mt-1 text-xs text-gray-400">
              Minimum time between bookings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Booking Link */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `/${slug}`}
              className="flex-1"
            />
            <Button variant="outline" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
