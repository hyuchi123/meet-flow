"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Plus, Users, Calendar, User, CalendarCheck } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeSlot = string; // "day-hour", e.g. "0-9" = Monday 9am

type Priority = "urgent" | "normal" | "low";

type Member = {
  id: string;
  name: string;
  color: string;
  availability: TimeSlot[];
};

type Meeting = {
  id: string;
  title: string;
  slot: TimeSlot;
  priority: Priority;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["週一", "週二", "週三", "週四", "週五"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const COLORS = [
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-cyan-500",
];

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; cellClass: string; badgeClass: string; dotClass: string; btnClass: string }
> = {
  urgent: {
    label: "緊急",
    cellClass: "bg-red-400 border-red-400",
    badgeClass:
      "bg-red-100 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    dotClass: "bg-red-500",
    btnClass:
      "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  },
  normal: {
    label: "一般",
    cellClass: "bg-blue-400 border-blue-400",
    badgeClass:
      "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
    btnClass:
      "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  low: {
    label: "低優先",
    cellClass: "bg-slate-400 border-slate-400",
    badgeClass:
      "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
    dotClass: "bg-slate-400",
    btnClass:
      "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

const slot = (day: number, hour: number): TimeSlot => `${day}-${hour}`;

// ─── Fake initial data ────────────────────────────────────────────────────────

// 假資料：三人皆有「週三 9–11」共同空閒，方便展示
const INITIAL_MEMBERS: Member[] = [
  {
    id: "me",
    name: "我",
    color: "bg-blue-500",
    availability: [
      slot(0, 9), slot(0, 10), slot(0, 11),          // Mon 9–12
      slot(0, 14), slot(0, 15), slot(0, 16),         // Mon 14–17
      slot(2, 9),  slot(2, 10), slot(2, 11),         // Wed 9–12（共同）
      slot(3, 14), slot(3, 15), slot(3, 16),         // Thu 14–17
      slot(4, 9),  slot(4, 10),                      // Fri 9–11
    ],
  },
  {
    id: "xiao-liang",
    name: "小梁",
    color: "bg-green-500",
    availability: [
      slot(0, 9),  slot(0, 10), slot(0, 11),         // Mon 9–12
      slot(2, 9),  slot(2, 10), slot(2, 11),         // Wed 9–12（共同）
      slot(2, 14), slot(2, 15), slot(2, 16),         // Wed 14–17
      slot(4, 9),  slot(4, 10),                      // Fri 9–11
    ],
  },
  {
    id: "lu-lu",
    name: "盧盧",
    color: "bg-purple-500",
    availability: [
      slot(1, 10), slot(1, 11), slot(1, 12),         // Tue 10–13
      slot(2, 9),  slot(2, 10), slot(2, 11),         // Wed 9–12（共同）
      slot(3, 14), slot(3, 15),                      // Thu 14–16
    ],
  },
];

// ─── Schedule Grid Component ──────────────────────────────────────────────────

function ScheduleGrid({
  availability,
  onToggle,
  emerald = false,
  slotColors,
}: {
  availability: TimeSlot[];
  onToggle?: (day: number, hour: number) => void;
  emerald?: boolean;
  slotColors?: Record<TimeSlot, string>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-14" />
            {DAYS.map((d) => (
              <th key={d} className="p-2 text-center font-medium text-sm">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((h) => (
            <tr key={h}>
              <td className="text-right pr-3 text-muted-foreground text-xs py-0.5 whitespace-nowrap">
                {h}:00
              </td>
              {DAYS.map((_, d) => {
                const s = slot(d, h);
                const active = availability.includes(s);
                const priorityClass = slotColors?.[s];
                const cellClass = priorityClass
                  ? priorityClass
                  : active
                  ? emerald
                    ? "bg-emerald-400 border-emerald-400"
                    : "bg-primary border-primary"
                  : "bg-muted border-border hover:bg-muted/60";
                return (
                  <td key={d} className="p-0.5">
                    <div
                      className={`h-8 rounded border transition-colors ${cellClass} ${onToggle ? "cursor-pointer" : "cursor-default"}`}
                      onClick={() => onToggle?.(d, h)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 mb-5 text-xs text-muted-foreground">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded ${item.color}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function MeetFlow() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);
  const [viewId, setViewId] = useState("xiao-liang");

  // Meeting state
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [newMeetingSlot, setNewMeetingSlot] = useState<TimeSlot | null>(null);
  const [newMeetingPriority, setNewMeetingPriority] = useState<Priority>("normal");

  const me = members.find((m) => m.id === "me")!;
  const others = members.filter((m) => m.id !== "me");
  const viewing = members.find((m) => m.id === viewId) ?? others[0];

  const commonSlots = DAYS.flatMap((_, d) =>
    HOURS.filter((h) =>
      members.every((m) => m.availability.includes(slot(d, h)))
    ).map((h) => slot(d, h))
  );

  // Map from slot → priority cell class for scheduled meetings
  const meetingSlotColors: Record<TimeSlot, string> = {};
  for (const meeting of meetings) {
    meetingSlotColors[meeting.slot] = PRIORITY_CONFIG[meeting.priority].cellClass;
  }

  function toggleMySlot(day: number, hour: number) {
    const s = slot(day, hour);
    setMembers((prev) =>
      prev.map((m) =>
        m.id !== "me"
          ? m
          : {
              ...m,
              availability: m.availability.includes(s)
                ? m.availability.filter((x) => x !== s)
                : [...m.availability, s],
            }
      )
    );
  }

  function addMember() {
    const name = newName.trim();
    if (!name) return;
    const color = COLORS[members.length % COLORS.length];
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name,
      color,
      availability: [],
    };
    setMembers((prev) => [...prev, newMember]);
    setNewName("");
    setOpen(false);
  }

  function addMeeting() {
    const title = newMeetingTitle.trim();
    if (!title || !newMeetingSlot) return;
    const meeting: Meeting = {
      id: `meeting-${Date.now()}`,
      title,
      slot: newMeetingSlot,
      priority: newMeetingPriority,
    };
    setMeetings((prev) => [...prev, meeting]);
    setNewMeetingTitle("");
    setNewMeetingSlot(null);
    setNewMeetingPriority("normal");
    setMeetingOpen(false);
  }

  function slotLabel(s: TimeSlot) {
    const [d, h] = s.split("-").map(Number);
    return `${DAYS[d]} ${h}:00–${h + 1}:00`;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <CalendarCheck className="w-5 h-5" />
          <h1 className="text-lg font-semibold tracking-tight">MeetFlow</h1>
          <Badge variant="secondary" className="text-xs font-normal">
            Beta
          </Badge>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="members">
          <TabsList className="mb-8 h-10">
            <TabsTrigger value="members" className="gap-1.5 text-sm">
              <Users className="w-3.5 h-3.5" />
              成員
            </TabsTrigger>
            <TabsTrigger value="my-schedule" className="gap-1.5 text-sm">
              <User className="w-3.5 h-3.5" />
              我的時間表
            </TabsTrigger>
            <TabsTrigger value="view-member" className="gap-1.5 text-sm">
              <Calendar className="w-3.5 h-3.5" />
              查看成員
            </TabsTrigger>
            <TabsTrigger value="common" className="gap-1.5 text-sm">
              <CalendarCheck className="w-3.5 h-3.5" />
              共同空閒
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Members ── */}
          <TabsContent value="members">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold">成員列表</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  共 {members.length} 位成員
                </p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    加入成員
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>加入新成員</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-2">
                    <Input
                      placeholder="輸入成員名稱"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addMember()}
                      autoFocus
                    />
                    <Button onClick={addMember} disabled={!newName.trim()}>
                      確認加入
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback
                        className={`${m.color} text-white text-sm font-semibold`}
                      >
                        {m.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.availability.length} 個空閒時段
                      </p>
                    </div>
                    {m.id === "me" && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        你
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Tab 2: My Schedule ── */}
          <TabsContent value="my-schedule">
            <div className="mb-5">
              <h2 className="text-base font-semibold">我的時間表</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                點擊格子來切換你的空閒時段
              </p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <Legend
                  items={[
                    { color: "bg-primary", label: "空閒" },
                    { color: "bg-muted border border-border", label: "忙碌" },
                  ]}
                />
                <ScheduleGrid
                  availability={me.availability}
                  onToggle={toggleMySlot}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab 3: View Member ── */}
          <TabsContent value="view-member">
            <div className="mb-5">
              <h2 className="text-base font-semibold">查看成員時間表</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                選擇成員來查看他們的空閒時段
              </p>
            </div>

            {others.length === 0 ? (
              <p className="text-muted-foreground text-sm py-12 text-center">
                尚無其他成員，請先在「成員」頁加入
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-5">
                  {others.map((m) => (
                    <Button
                      key={m.id}
                      variant={viewing?.id === m.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewId(m.id)}
                    >
                      {m.name}
                    </Button>
                  ))}
                </div>

                {viewing && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback
                            className={`${viewing.color} text-white text-xs font-semibold`}
                          >
                            {viewing.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {viewing.name} 的時間表
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Legend
                        items={[
                          { color: "bg-primary", label: "空閒" },
                          {
                            color: "bg-muted border border-border",
                            label: "忙碌",
                          },
                        ]}
                      />
                      <ScheduleGrid availability={viewing.availability} />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Tab 4: Common Availability ── */}
          <TabsContent value="common">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold">共同空閒時間</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  所有 {members.length} 位成員都空閒的時段
                </p>
              </div>

              {/* ── Add Meeting Dialog ── */}
              <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={commonSlots.length === 0}
                  >
                    <Plus className="w-4 h-4" />
                    建立會議
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>建立會議</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 mt-2">
                    {/* Title */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">會議名稱</label>
                      <Input
                        placeholder="輸入會議名稱"
                        value={newMeetingTitle}
                        onChange={(e) => setNewMeetingTitle(e.target.value)}
                        autoFocus
                      />
                    </div>

                    {/* Priority */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">優先級</label>
                      <div className="flex gap-2">
                        {(["urgent", "normal", "low"] as Priority[]).map((p) => {
                          const cfg = PRIORITY_CONFIG[p];
                          const selected = newMeetingPriority === p;
                          return (
                            <button
                              key={p}
                              onClick={() => setNewMeetingPriority(p)}
                              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                                selected
                                  ? cfg.btnClass + " ring-2 ring-offset-1 " + (p === "urgent" ? "ring-red-400" : p === "normal" ? "ring-blue-400" : "ring-slate-400")
                                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slot */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium">選擇時段</label>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {commonSlots.map((s) => (
                          <button
                            key={s}
                            onClick={() =>
                              setNewMeetingSlot(newMeetingSlot === s ? null : s)
                            }
                            className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                              newMeetingSlot === s
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border bg-background text-foreground hover:bg-muted"
                            }`}
                          >
                            {slotLabel(s)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={addMeeting}
                      disabled={!newMeetingTitle.trim() || !newMeetingSlot}
                    >
                      確認建立
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Legend
                  items={[
                    { color: "bg-red-400", label: "緊急會議" },
                    { color: "bg-blue-400", label: "一般會議" },
                    { color: "bg-slate-400", label: "低優先會議" },
                    { color: "bg-emerald-400", label: "共同空閒" },
                    { color: "bg-muted border border-border", label: "非共同" },
                  ]}
                />
                {commonSlots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10 text-sm">
                    目前沒有共同空閒時段
                  </p>
                ) : (
                  <ScheduleGrid
                    availability={commonSlots}
                    emerald
                    slotColors={meetingSlotColors}
                  />
                )}
              </CardContent>
            </Card>

            {/* ── Scheduled Meetings ── */}
            {meetings.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">已排定會議</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {meetings.map((meeting) => {
                    const cfg = PRIORITY_CONFIG[meeting.priority];
                    return (
                      <Card
                        key={meeting.id}
                        className={`border-l-4 ${
                          meeting.priority === "urgent"
                            ? "border-l-red-400"
                            : meeting.priority === "normal"
                            ? "border-l-blue-400"
                            : "border-l-slate-400"
                        }`}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dotClass}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {meeting.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {slotLabel(meeting.slot)}
                            </p>
                          </div>
                          <PriorityBadge priority={meeting.priority} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Common slot chips (shown when no meetings yet or always) */}
            {commonSlots.length > 0 && meetings.length === 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {commonSlots.map((s) => {
                  const [d, h] = s.split("-").map(Number);
                  return (
                    <div
                      key={s}
                      className="text-sm px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
                    >
                      {DAYS[d]} {h}:00–{h + 1}:00
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
