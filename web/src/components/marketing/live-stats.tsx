"use client";

import { useEffect, useState } from "react";

type Stats = {
  registeredUsers: number;
  linkedDevices: number;
  onlineDevices: number;
  runningServersNow: number;
};

export function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats/public")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const items = [
    { label: "Аккаунтов", value: stats?.registeredUsers ?? "—" },
    { label: "Привязано ПК", value: stats?.linkedDevices ?? "—" },
    { label: "Онлайн сейчас", value: stats?.onlineDevices ?? "—" },
    { label: "Серверов запущено", value: stats?.runningServersNow ?? "—" },
  ];

  return (
    <div className="stats-strip">
      {items.map((item) => (
        <div key={item.label} className="stats-strip__item">
          <div className="stats-strip__value">{item.value}</div>
          <div className="stats-strip__label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
