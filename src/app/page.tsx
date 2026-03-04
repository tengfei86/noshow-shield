import Link from "next/link";
import { Shield, Bell, Ban, Calendar, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-violet-500" />
            <span className="text-lg font-bold">NoShow Shield</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-zinc-950 to-zinc-950" />
        <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <Zap className="h-4 w-4" />
            Smart Booking Protection
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Stop Losing Money to{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              No-Shows
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-zinc-400">
            Protect your revenue with smart deposits, automated reminders, and
            no-show tracking. Built for service businesses that value their time.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 sm:w-auto"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full border-zinc-700 sm:w-auto">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
            Everything You Need to{" "}
            <span className="text-violet-400">Fight No-Shows</span>
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-zinc-400">
            A complete toolkit to protect your business from missed appointments.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                  <Shield className="h-6 w-6 text-violet-400" />
                </div>
                <CardTitle>Deposit Protection</CardTitle>
                <CardDescription className="text-zinc-400">
                  Require deposits at booking time. If they don&apos;t show, you keep it.
                  Fair for everyone.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Bell className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle>Automated Reminders</CardTitle>
                <CardDescription className="text-zinc-400">
                  Send email reminders 24h and 1h before appointments. Reduce
                  no-shows by up to 40%.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
                  <Ban className="h-6 w-6 text-rose-400" />
                </div>
                <CardTitle>No-Show Tracking</CardTitle>
                <CardDescription className="text-zinc-400">
                  Track repeat offenders automatically. Block chronic no-shows from
                  future bookings.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-16 text-center text-3xl font-bold sm:text-4xl">
            How It Works
          </h2>
          <div className="space-y-12">
            {[
              {
                step: "01",
                title: "Set Up Your Services",
                desc: "Add your services, set prices, and configure deposit requirements in minutes.",
              },
              {
                step: "02",
                title: "Share Your Booking Page",
                desc: "Customers book through your personalized page. Deposits are collected automatically.",
              },
              {
                step: "03",
                title: "Relax & Get Paid",
                desc: "Automated reminders go out. No-shows are tracked. Your revenue is protected.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                  <p className="text-zinc-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-gradient-to-br from-violet-900/20 to-blue-900/20 p-8 text-center sm:p-12">
          <Calendar className="mx-auto mb-6 h-12 w-12 text-violet-400" />
          <h2 className="mb-4 text-3xl font-bold">Ready to Protect Your Revenue?</h2>
          <p className="mb-8 text-zinc-400">
            Join thousands of service businesses that stopped losing money to no-shows.
          </p>
          <Link href="/auth">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            NoShow Shield
          </div>
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
