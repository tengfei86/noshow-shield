"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMerchantOnboarding } from "@/app/actions/merchant";
import { createService } from "@/app/actions/services";
import { saveSchedule } from "@/app/actions/schedule";

const STEPS = ["Business Info", "Add a Service", "Working Hours", "Deposit Policy"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");

  // Step 2
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(0);
  const [deposit, setDeposit] = useState(0);

  // Step 3
  const [schedule, setSchedule] = useState(
    DAYS.map((_, i) => ({
      day_of_week: i,
      start_time: "09:00",
      end_time: "17:00",
      is_active: i >= 1 && i <= 5,
    }))
  );

  const progress = ((step + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    setLoading(true);
    try {
      if (step === 0) {
        await createMerchantOnboarding({ business_name: businessName, slug, timezone });
      } else if (step === 1) {
        if (serviceName) {
          await createService({
            name: serviceName,
            duration_minutes: duration,
            price,
            deposit_amount: deposit,
          });
        }
      } else if (step === 2) {
        await saveSchedule(schedule);
      } else if (step === 3) {
        router.push("/dashboard");
        return;
      }
      setStep((s) => s + 1);
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (idx: number, fields: Partial<(typeof schedule)[0]>) => {
    setSchedule((prev) => prev.map((d, i) => (i === idx ? { ...d, ...fields } : d)));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-violet-700">Welcome to NoShow Shield</h1>
          <p className="mt-1 text-sm text-gray-500">Let&apos;s set up your business</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            {STEPS.map((s, i) => (
              <span key={s} className={i <= step ? "text-violet-600 font-medium" : ""}>
                {i < step ? <Check className="inline h-3 w-3" /> : null} {s}
              </span>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div>
                  <Label>Business Name</Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="My Salon" />
                </div>
                <div>
                  <Label>URL Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="my-salon" />
                  <p className="mt-1 text-xs text-gray-400">yoursite.com/{slug || "my-salon"}</p>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <Label>Service Name</Label>
                  <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Haircut" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Duration (min)</Label>
                    <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Deposit ($)</Label>
                    <Input type="number" step="0.01" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
                  </div>
                </div>
                <p className="text-xs text-gray-400">You can add more services later.</p>
              </>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {schedule.map((day, idx) => (
                  <div key={day.day_of_week} className="flex items-center gap-3">
                    <Switch checked={day.is_active} onCheckedChange={(v) => updateDay(idx, { is_active: v })} />
                    <span className="w-24 text-sm">{DAYS[day.day_of_week]}</span>
                    {day.is_active ? (
                      <div className="flex items-center gap-1">
                        <Input type="time" value={day.start_time} onChange={(e) => updateDay(idx, { start_time: e.target.value })} className="w-28" />
                        <span className="text-gray-400 text-xs">to</span>
                        <Input type="time" value={day.end_time} onChange={(e) => updateDay(idx, { end_time: e.target.value })} className="w-28" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 text-center py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">You&apos;re all set!</h3>
                <p className="text-sm text-gray-500">
                  Your booking page is ready. You can customize deposit policies and more in Settings.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          {step > 0 && step < 3 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>
          ) : (
            <div />
          )}
          <Button
            onClick={handleNext}
            disabled={loading || (step === 0 && (!businessName || !slug))}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {loading ? "Saving..." : step === 3 ? "Go to Dashboard" : step === 1 && !serviceName ? "Skip" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
