"use client";

import { useEffect, useState } from "react";
import { Search, ShieldBan, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toggleBlacklist } from "@/app/actions/customers";
import type { Customer } from "@/types/database";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [merchantId, setMerchantId] = useState("");

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!m) return;
    setMerchantId(m.id);
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("merchant_id", m.id)
      .order("created_at", { ascending: false });
    setCustomers(data || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  const handleToggle = async (c: Customer) => {
    await toggleBlacklist(c.id, !c.is_blocked);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customers</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-gray-400">No customers found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between pt-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{c.name}</h3>
                    {c.is_blocked && (
                      <Badge variant="destructive" className="text-xs">Blocked</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{c.email}</p>
                  {c.phone && <p className="text-sm text-gray-400">{c.phone}</p>}
                  <div className="mt-1 flex gap-3 text-xs text-gray-400">
                    <span>{c.total_bookings} bookings</span>
                    <span className={c.no_show_count > 0 ? "text-red-500 font-medium" : ""}>
                      {c.no_show_count} no-shows
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={c.is_blocked ? "outline" : "destructive"}
                  onClick={() => handleToggle(c)}
                >
                  {c.is_blocked ? (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Unblock
                    </>
                  ) : (
                    <>
                      <ShieldBan className="mr-2 h-4 w-4" />
                      Block
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
