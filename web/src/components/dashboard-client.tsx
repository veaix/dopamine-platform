"use client";



import dynamic from "next/dynamic";

import { useSearchParams } from "next/navigation";

import { Suspense, useCallback, useEffect, useState } from "react";

import { WelcomePromoBanner } from "@/components/welcome-promo-banner";
import { useAuth } from "@/components/providers/auth-provider";

import { ProfileHeader } from "@/components/dashboard/profile-header";

import type { FriendsData } from "@/server/friends/bundle";

import type { OwnedGiftKey } from "@/server/keys/inventory";

import type { DashboardUser } from "@/server/dashboard/profile";



const EconomyPanel = dynamic(

  () => import("@/components/dashboard/economy-panel").then((m) => ({ default: m.EconomyPanel })),

  { loading: () => <p className="muted">Загрузка…</p> },

);

const FriendsPanel = dynamic(

  () => import("@/components/dashboard/friends-panel").then((m) => ({ default: m.FriendsPanel })),

  { loading: () => <p className="muted">Загрузка…</p> },

);

const ProfileEditPanel = dynamic(

  () => import("@/components/dashboard/profile-edit-panel").then((m) => ({ default: m.ProfileEditPanel })),

  { loading: () => <p className="muted">Загрузка…</p> },

);

const SecurityPanel = dynamic(

  () => import("@/components/dashboard/security-panel").then((m) => ({ default: m.SecurityPanel })),

  { loading: () => <p className="muted">Загрузка…</p> },

);

const MediaReferralPanel = dynamic(

  () => import("@/components/dashboard/media-referral-panel").then((m) => ({ default: m.MediaReferralPanel })),

  { loading: () => <p className="muted">Загрузка…</p> },

);



type Tab = "economy" | "friends" | "profile" | "security" | "media";



const BASE_TABS: { id: Tab; label: string }[] = [

  { id: "economy", label: "Монеты и ключи" },

  { id: "friends", label: "Друзья" },

  { id: "profile", label: "Редактировать профиль" },

  { id: "security", label: "Безопасность" },

];



function tabsForRole(role: string): { id: Tab; label: string }[] {
  if (role === "mediagigant") {
    return [{ id: "media", label: "Рефералка" }, ...BASE_TABS];
  }
  return BASE_TABS;
}



type Props = {

  initialMe: DashboardUser;

  initialFriends: FriendsData;

  initialOwnedKeys: OwnedGiftKey[];

};



function DashboardInner({ initialMe, initialFriends, initialOwnedKeys }: Props) {

  const searchParams = useSearchParams();
  const { refresh: refreshAuth } = useAuth();

  const tabParam = searchParams.get("tab") as Tab | null;
  const refPromo = searchParams.get("ref")?.trim().toUpperCase() ?? "";

  const [tab, setTab] = useState<Tab>("economy");

  const [me, setMe] = useState(initialMe);

  const [friends, setFriends] = useState(initialFriends);

  const [ownedKeys, setOwnedKeys] = useState(initialOwnedKeys);

  const [showWelcome, setShowWelcome] = useState(false);

  const [dashError, setDashError] = useState("");



  const refreshAll = useCallback(async () => {
    try {
      const [meRes, keysRes, friendsRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/economy/buy-gift-key"),
        fetch("/api/friends/list"),
      ]);

      const meData = await meRes.json();
      if (!meRes.ok || !meData.user) {
        window.location.href = "/login?next=/dashboard";
        return;
      }
      setMe(meData.user);

      const keysData = await keysRes.json();
      if (keysRes.ok) setOwnedKeys(keysData.keys ?? []);

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(friendsData);
      }

      await refreshAuth();
    } catch {
      /* ignore transient network errors */
    }
  }, [refreshAuth]);

  const reloadMe = useCallback(() => {
    void refreshAll();
  }, [refreshAll]);

  const reloadOwnedKeys = useCallback(() => {
    void fetch("/api/economy/buy-gift-key")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        setOwnedKeys(d.keys ?? []);
      })
      .catch(() => {});
  }, []);

  const refreshEconomy = useCallback(async () => {
    try {
      const [meRes, keysRes] = await Promise.all([fetch("/api/me"), fetch("/api/economy/buy-gift-key")]);
      const meData = await meRes.json();
      if (meRes.ok && meData.user) setMe(meData.user);
      const keysData = await keysRes.json();
      if (keysRes.ok) setOwnedKeys(keysData.keys ?? []);
      await refreshAuth();
    } catch {
      /* ignore */
    }
  }, [refreshAuth]);



  const tabs = tabsForRole(me.role);

  useEffect(() => {

    const t = searchParams.get("tab") as Tab | null;

    const next = t && tabs.some((x) => x.id === t) ? t : tabs[0]?.id ?? "economy";

    setTab(next);

  }, [searchParams, me.role]);

  useEffect(() => {

    function onPopState() {

      const params = new URLSearchParams(window.location.search);

      const t = params.get("tab") as Tab | null;

      const next = t && tabs.some((x) => x.id === t) ? t : tabs[0]?.id ?? "economy";

      setTab(next);

    }

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);

  }, [me.role]);



  useEffect(() => {

    const welcomeQuery = searchParams.get("welcome") === "1";

    const alreadyShown = sessionStorage.getItem("dopamine_welcome_shown") === "1";

    if (welcomeQuery && !alreadyShown) setShowWelcome(true);

  }, [searchParams]);



  useEffect(() => {
    if (!showWelcome || me.canRedeemWelcomePromo) return;
    sessionStorage.setItem("dopamine_welcome_shown", "1");
    setShowWelcome(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [showWelcome, me.canRedeemWelcomePromo]);



  function replaceUrl(next: Tab) {

    const url = new URL(window.location.href);

    const defaultTab = tabsForRole(me.role)[0]?.id ?? "economy";

    if (next === defaultTab) url.searchParams.delete("tab");

    else url.searchParams.set("tab", next);

    window.history.replaceState(null, "", url.pathname + url.search);

  }



  function dismissWelcome() {

    sessionStorage.setItem("dopamine_welcome_shown", "1");

    setShowWelcome(false);

    const url = new URL(window.location.href);

    url.searchParams.delete("welcome");

    window.history.replaceState(null, "", url.pathname + url.search);

  }



  function setTabAndUrl(next: Tab) {

    setTab(next);

    replaceUrl(next);

  }



  const showWelcomeBanner = showWelcome && me.canRedeemWelcomePromo;



  return (

    <div className="stack dash">

      <ProfileHeader me={me} />

      {dashError ? <p className="form-error">{dashError}</p> : null}



      {showWelcomeBanner ? (

        <WelcomePromoBanner

          onRedeemed={() => {

            dismissWelcome();

            reloadMe();

          }}

        />

      ) : null}



      <div className="tabs dash-tabs" role="tablist">

        {tabs.map(({ id, label }) => (

          <button

            key={id}

            type="button"

            role="tab"

            aria-selected={tab === id}

            className={`tab ${tab === id ? "active" : ""}`}

            onClick={() => setTabAndUrl(id)}

          >

            {label}

          </button>

        ))}

      </div>



      {tab === "economy" ? (

        <div role="tabpanel">

          <EconomyPanel

            coinsBalance={me.coinsBalance}

            serverSlots={me.availableServerSlots}

            trial={me.trial}

            initialOwnedKeys={ownedKeys}

            initialPromoCode={refPromo}

            onUpdated={() => {

              reloadMe();

              reloadOwnedKeys();

            }}

          />

        </div>

      ) : null}



      {tab === "media" ? (

        <div role="tabpanel">

          <MediaReferralPanel onError={setDashError} />

        </div>

      ) : null}



      {tab === "friends" ? (

        <div role="tabpanel">

          <FriendsPanel

            initial={friends}

            ownedKeys={ownedKeys}

            onEconomyRefresh={() => void refreshEconomy()}

          />

        </div>

      ) : null}



      {tab === "profile" ? (

        <div role="tabpanel">

          <ProfileEditPanel me={me} onUpdated={reloadMe} />

        </div>

      ) : null}



      {tab === "security" ? (

        <div role="tabpanel">

          <SecurityPanel email={me.email} totpEnabled={me.totpEnabled} onUpdated={reloadMe} />

        </div>

      ) : null}

    </div>

  );

}



export function DashboardClient(props: Props) {

  return (

    <Suspense fallback={<p className="muted">Загрузка…</p>}>

      <DashboardInner {...props} />

    </Suspense>

  );

}


