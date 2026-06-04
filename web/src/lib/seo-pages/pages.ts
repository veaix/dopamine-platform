import type { SeoPageConfig } from "@/lib/seo-pages/types";
import { SEO_PAGES_EXTRA } from "@/lib/seo-pages/pages-extra";

const RELATED_LAUNCHER = ["minecraft-launcher", "dopamine-launcher", "skachat-launcher-minecraft", "launcher-s-modami"];
const RELATED_DOPAMINE = ["dopamine", "dopamine-launcher", "launcher-minecraft", "minecraft-launcher"];
const RELATED_SERVER = ["minecraft-server", "minecraft-servers", "launcher-minecraft", "dopamine-launcher"];

export const SEO_PAGES: SeoPageConfig[] = [
  {
    slug: "launcher-minecraft",
    title: "Лаунчер Minecraft — скачать бесплатно для Windows | dopamine",
    description:
      "Лаунчер майнкрафт dopamine: Modrinth, Fabric, Forge, NeoForge, локальные серверы для друзей. Скачайте бесплатный Minecraft launcher для Windows 10/11.",
    keywords: [
      "лаунчер майнкрафт",
      "майнкрафт лаунчер",
      "лаунчер minecraft",
      "minecraft лаунчер",
      "скачать лаунчер майнкрафт",
      "лаунчер майнкрафт бесплатно",
      "лучший лаунчер майнкрафт",
    ],
    h1: "Лаунчер Minecraft — dopamine",
    subtitle: "Бесплатный лаунчер майнкрафт для Windows: моды, серверы для друзей и единый аккаунт",
    tag: "лаунчер майнкрафт",
    sections: [
      {
        h2: "Что такое лаунчер майнкрафт",
        paragraphs: [
          "Лаунчер Minecraft — программа, которая скачивает игру, Java, моды и запускает нужную версию в один клик. Если вы ищете современный лаунчер майнкрафт без рекламы и лишних шагов, dopamine собирает профили, Modrinth, Fabric, Forge и NeoForge в одном окне.",
          "dopamine — русскоязычный Minecraft launcher с английским интерфейсом. Подходит и для ванильной игры, и для тяжёлых modpack-сборок на Windows 10 и 11.",
        ],
      },
      {
        h2: "Почему dopamine — удобный лаунчер Minecraft",
        list: [
          "Modrinth: поиск, установка и обновление модов без ручного копирования jar",
          "Несколько установок Minecraft в одном списке — vanilla, Fabric, Forge, NeoForge",
          "Локальные серверы для друзей: RAM, слоты, туннель без Hamachi",
          "Единый аккаунт на www.dopamine.cfd и в лаунчере",
          "Автообновление лаунчера и Temurin Java",
          "Тёмная тема, настройка внешнего вида и бесплатное использование",
        ],
        paragraphs: [],
      },
      {
        h2: "Как скачать лаунчер майнкрафт",
        ordered: true,
        paragraphs: [],
        list: [
          "Нажмите «Скачать» на этой странице или перейдите на /download",
          "Запустите dopamine-Setup и завершите установку",
          "Создайте профиль, выберите версию Minecraft и нажмите «Играть»",
        ],
      },
      {
        h2: "Лаунчер майнкрафт vs официальный клиент",
        paragraphs: [
          "Официальный лаунчер Mojang закрывает базовый запуск, но слабее работает с modpack'ами и локальными серверами. dopamine ориентирован на игроков, которым нужен полноценный лаунчер minecraft с Modrinth и быстрым поднятием сервера для друзей — без сторонних панелей.",
        ],
      },
    ],
    faq: [
      {
        q: "Лаунчер майнкрафт dopamine бесплатный?",
        a: "Да, dopamine полностью бесплатен для Windows. Скачивание установщика доступно на официальном сайте www.dopamine.cfd.",
      },
      {
        q: "Поддерживает ли лаунчер Fabric и Forge?",
        a: "Да. dopamine поддерживает Fabric, Forge, NeoForge и vanilla-версии Minecraft.",
      },
      {
        q: "Можно ли играть с друзьями через этот лаунчер?",
        a: "Да. Встроены локальные серверы с туннелем — друзья подключаются по ссылке из любой сети.",
      },
    ],
    relatedSlugs: RELATED_LAUNCHER,
  },
  {
    slug: "minecraft-launcher",
    title: "Minecraft Launcher for Windows — Free Download | dopamine",
    description:
      "Download dopamine — free Minecraft launcher for Windows 10/11. Modrinth mods, Fabric, Forge, NeoForge, local servers for friends. Official site www.dopamine.cfd.",
    keywords: [
      "minecraft launcher",
      "minecraft launcher download",
      "free minecraft launcher",
      "best minecraft launcher",
      "minecraft launcher windows",
      "minecraft launcher with mods",
      "dopamine minecraft launcher",
    ],
    h1: "Minecraft Launcher — dopamine",
    subtitle: "Free Minecraft launcher for Windows: Modrinth, modpacks, local multiplayer servers",
    tag: "minecraft launcher",
    sections: [
      {
        h2: "What is a Minecraft launcher",
        paragraphs: [
          "A Minecraft launcher downloads the game, manages Java, installs mods and starts the right version in one click. dopamine is a modern Minecraft launcher built for players who want Modrinth integration, Fabric/Forge support and local servers for friends — without ads or bloatware.",
          "If you search for minecraft launcher windows, dopamine runs on Windows 10 and 11 (64-bit) and ships with auto-updates from the official website.",
        ],
      },
      {
        h2: "Why choose dopamine Minecraft launcher",
        list: [
          "Modrinth search and one-click mod installation",
          "Fabric, Forge, NeoForge and vanilla profiles",
          "Local Minecraft servers for friends with tunnel — no Hamachi",
          "Single account on dopamine.cfd and in the launcher",
          "Auto-updates for the launcher and Temurin Java",
          "Dark theme, RU/EN interface, free to use",
        ],
        paragraphs: [],
      },
      {
        h2: "How to download the Minecraft launcher",
        ordered: true,
        paragraphs: [],
        list: [
          "Click Download on this page or visit /download",
          "Run dopamine-Setup.exe and finish installation",
          "Create a profile, pick a Minecraft version and press Play",
        ],
      },
      {
        h2: "Minecraft launcher with mods",
        paragraphs: [
          "Unlike the default Mojang client, dopamine is a minecraft launcher with mods out of the box: browse Modrinth, install modpacks and switch between installations without reinstalling the whole game.",
        ],
      },
    ],
    faq: [
      {
        q: "Is dopamine a free Minecraft launcher?",
        a: "Yes. dopamine is free for Windows. Download the latest installer from www.dopamine.cfd/download.",
      },
      {
        q: "Does this Minecraft launcher support Fabric and Forge?",
        a: "Yes. Fabric, Forge, NeoForge and vanilla Minecraft versions are supported.",
      },
      {
        q: "Can I host a server for friends?",
        a: "Yes. dopamine includes local server hosting with a shareable tunnel link.",
      },
    ],
    relatedSlugs: ["minecraft-launcher-download", "free-minecraft-launcher", "dopamine-launcher", "launcher-minecraft"],
  },
  {
    slug: "dopamine",
    title: "dopamine — дофамин, Minecraft launcher и лаунчер майнкрафт",
    description:
      "dopamine (дофамин) — официальный сайт Minecraft launcher для Windows. Лаунчер майнкрафт с Modrinth, серверами для друзей, Fabric, Forge. Скачать бесплатно.",
    keywords: [
      "dopamine",
      "дофамин",
      "дофамин майнкрафт",
      "майнкрафт дофамин",
      "dopamine minecraft",
      "dopamine.cfd",
      "дофамин лаунчер",
    ],
    h1: "dopamine — официальный сайт",
    subtitle: "dopamine (дофамин) — Minecraft launcher и лаунчер майнкрафт для Windows",
    tag: "dopamine · дофамин",
    sections: [
      {
        h2: "Что такое dopamine (дофамин)",
        paragraphs: [
          "dopamine — бренд Minecraft launcher для Windows. Пользователи часто ищут «дофамин», «майнкрафт дофамин» или «dopamine minecraft» — это один и тот же проект на официальном домене www.dopamine.cfd.",
          "На сайте регистрируется аккаунт, покупаются ключи серверов и монеты; в лаунчере те же данные синхронизируются автоматически.",
        ],
      },
      {
        h2: "dopamine minecraft — возможности",
        list: [
          "Лаунчер майнкрафт с Modrinth и modpack'ами",
          "Локальные серверы для друзей без Hamachi",
          "Fabric, Forge, NeoForge, vanilla",
          "Профиль, друзья, 2FA, топы игроков",
          "Автообновления лаунчера",
        ],
        paragraphs: [],
      },
      {
        h2: "Где скачать dopamine / дофамин лаунчер",
        paragraphs: [
          "Скачивайте только с www.dopamine.cfd — так вы получите актуальную версию установщика и проверенные обновления. Страница загрузки: /download. Лаунчер dopamine (дофамин лаунчер) бесплатен для Windows.",
        ],
      },
    ],
    faq: [
      {
        q: "dopamine и дофамин — это одно и то же?",
        a: "Да. dopamine — название проекта; «дофамин» — как его часто называют по-русски в поиске.",
      },
      {
        q: "Официальный сайт dopamine minecraft?",
        a: "https://www.dopamine.cfd — официальный сайт dopamine Minecraft launcher и загрузки лаунчера.",
      },
    ],
    relatedSlugs: RELATED_DOPAMINE,
  },
  {
    slug: "dopamine-launcher",
    title: "dopamine launcher — дофамин лаунчер, скачать лаунчер дофамин",
    description:
      "dopamine launcher (дофамин лаунчер, лаунчер дофамин) — бесплатный Minecraft launcher для Windows. Modrinth, серверы, Fabric, Forge. Скачать с официального сайта.",
    keywords: [
      "dopamine launcher",
      "дофамин лаунчер",
      "лаунчер дофамин",
      "лаунчер dopamine",
      "dopamine launcher скачать",
      "dopamine minecraft launcher",
    ],
    h1: "dopamine launcher — дофамин лаунчер",
    subtitle: "Скачайте dopamine launcher: лаунчер дофамин для Minecraft на Windows",
    tag: "dopamine launcher",
    sections: [
      {
        h2: "dopamine launcher — что это",
        paragraphs: [
          "dopamine launcher — desktop-приложение для Windows, которое запускает Minecraft, управляет модами и поднимает локальные серверы. В поиске его находят как «дофамин лаунчер», «лаунчер дофамин» или «dopamine minecraft launcher».",
          "Лаунчер связан с аккаунтом на dopamine.cfd: один логин на сайте и в программе.",
        ],
      },
      {
        h2: "Функции dopamine launcher",
        list: [
          "Запуск vanilla, Fabric, Forge, NeoForge",
          "Modrinth — моды и modpack'и",
          "Локальный сервер для друзей в пару кликов",
          "Автообновление через www.dopamine.cfd",
          "Portable-сборка для USB",
        ],
        paragraphs: [],
      },
      {
        h2: "Как установить лаунчер дофамин",
        ordered: true,
        paragraphs: [],
        list: [
          "Скачайте dopamine-Setup с /download",
          "Установите и откройте dopamine launcher",
          "Войдите или создайте аккаунт dopamine",
        ],
      },
    ],
    faq: [
      {
        q: "Где скачать dopamine launcher?",
        a: "На https://www.dopamine.cfd/download — официальная страница загрузки.",
      },
      {
        q: "Лаунчер дофамин платный?",
        a: "Нет, базовый dopamine launcher бесплатен. Дополнительные слоты серверов можно активировать ключом.",
      },
    ],
    relatedSlugs: RELATED_DOPAMINE,
  },
  {
    slug: "minecraft-server",
    title: "Создать сервер Minecraft — локальный сервер для друзей | dopamine",
    description:
      "Как создать сервер майнкрафт для друзей: dopamine launcher поднимает локальный Minecraft server за пару кликов. RAM, слоты, туннель без Hamachi. Бесплатно на Windows.",
    keywords: [
      "создать сервер майнкрафт",
      "создать сервер minecraft",
      "как создать сервер майнкрафт",
      "minecraft server create",
      "локальный сервер майнкрафт",
      "сервер майнкрафт для друзей",
      "create minecraft server",
    ],
    h1: "Создать сервер Minecraft для друзей",
    subtitle: "dopamine помогает создать локальный сервер майнкрафт без сложной настройки",
    tag: "сервер майнкрафт",
    sections: [
      {
        h2: "Как создать сервер майнкрафт в dopamine",
        paragraphs: [
          "Чтобы создать сервер Minecraft для друзей, не обязательно арендовать VPS или возиться с Hamachi. В dopamine launcher выберите профиль, укажите RAM и слоты — локальный Minecraft server стартует из того же окна, где вы запускаете игру.",
          "Туннель генерирует ссылку: друзья подключаются из дома, мобильного интернета или другого города.",
        ],
      },
      {
        h2: "Что нужно чтобы создать сервер minecraft",
        list: [
          "Windows 10/11 и установленный dopamine launcher",
          "4–8 GB RAM на ПК (больше для modpack-серверов)",
          "Выбранная версия Minecraft или modpack",
          "Аккаунт dopamine (бесплатная регистрация)",
        ],
        paragraphs: [],
      },
      {
        h2: "Create Minecraft server — step by step",
        ordered: true,
        paragraphs: [],
        list: [
          "Open dopamine launcher and pick a Minecraft installation",
          "Go to local servers section and create a new slot",
          "Set RAM, player slots and start the server",
          "Share the tunnel link with friends",
        ],
      },
      {
        h2: "Локальный сервер vs аренда хостинга",
        paragraphs: [
          "Аренда подходит для 24/7 проектов с десятками игроков. Если цель — поиграть с друзьями вечером, создать сервер майнкрафт локально через dopamine быстрее и бесплатно: без SSH, без панелей и без проброса портов вручную.",
        ],
      },
    ],
    faq: [
      {
        q: "Можно ли создать сервер майнкрафт с модами?",
        a: "Да. Запускайте Fabric/Forge профиль и поднимайте сервер с тем же набором модов.",
      },
      {
        q: "Нужен ли Hamachi?",
        a: "Нет. dopamine использует встроенный туннель для подключения друзей.",
      },
    ],
    relatedSlugs: RELATED_SERVER,
  },
  {
    slug: "minecraft-servers",
    title: "Серверы Minecraft — локальные серверы для друзей | dopamine",
    description:
      "Майнкрафт серверы для друзей: поднимайте локальные Minecraft servers в dopamine launcher. Без Hamachi, с туннелем, modpack'ами и управлением RAM.",
    keywords: [
      "майнкрафт серверы",
      "серверы майнкрафт",
      "minecraft servers",
      "minecraft server for friends",
      "локальные серверы minecraft",
      "сервер minecraft для друзей",
    ],
    h1: "Серверы Minecraft для друзей",
    subtitle: "Майнкрафт серверы без хостинга — локально в dopamine launcher",
    tag: "minecraft servers",
    sections: [
      {
        h2: "Майнкрафт серверы без аренды хостинга",
        paragraphs: [
          "Большинству игроков не нужен круглосуточный datacenter — достаточно minecraft servers для вечера с друзьями. dopamine launcher объединяет лаунчер и панель локальных серверов: слоты, JVM-параметры, логи и туннель в одном приложении.",
        ],
      },
      {
        h2: "Возможности серверов в dopamine",
        list: [
          "Несколько слотов локальных серверов",
          "Настройка RAM и количества игроков",
          "Vanilla и модовые minecraft servers",
          "Ссылка-туннель для друзей",
          "Интеграция с аккаунтом dopamine.cfd",
        ],
        paragraphs: [],
      },
      {
        h2: "Minecraft servers for friends — why dopamine",
        paragraphs: [
          "If you search minecraft server for friends, dopamine removes Hamachi, port forwarding and separate server jars. Start the game and the server from one launcher — ideal for small groups and modded sessions.",
        ],
      },
    ],
    faq: [
      {
        q: "Сколько игроков выдерживает локальный сервер?",
        a: "Зависит от RAM ПК и modpack'а. Для 3–8 друзей на vanilla обычно хватает 4–6 GB выделенной памяти.",
      },
      {
        q: "Работают ли серверы майнкрафт с Modrinth modpack'ами?",
        a: "Да, можно поднять сервер на базе установки с модами из Modrinth.",
      },
    ],
    relatedSlugs: RELATED_SERVER,
  },
  {
    slug: "skachat-launcher-minecraft",
    title: "Скачать лаунчер Minecraft — бесплатно для Windows | dopamine",
    description:
      "Скачать лаунчер майнкрафт бесплатно: dopamine — официальный Minecraft launcher для Windows 10/11. Modrinth, Fabric, Forge, серверы для друзей.",
    keywords: [
      "скачать лаунчер майнкрафт",
      "скачать лаунчер minecraft",
      "лаунчер майнкрафт скачать бесплатно",
      "скачать minecraft launcher",
      "лаунчер minecraft windows скачать",
    ],
    h1: "Скачать лаунчер Minecraft",
    subtitle: "Официальная загрузка dopamine — лаунчер майнкрафт для Windows",
    tag: "скачать лаунчер",
    sections: [
      {
        h2: "Где скачать лаунчер майнкрафт безопасно",
        paragraphs: [
          "Скачивайте лаунчер minecraft только с www.dopamine.cfd. Так вы получите последнюю версию dopamine-Setup с цифровой подписью и автообновлениями. Сторонние «сборки» часто содержат рекламу или устаревшие билды.",
        ],
      },
      {
        h2: "Что входит в установку",
        list: [
          "dopamine launcher для Windows 10/11",
          "Modrinth, Fabric, Forge, NeoForge",
          "Локальные серверы и туннель",
          "Синхронизация с аккаунтом dopamine.cfd",
        ],
        paragraphs: [],
      },
      {
        h2: "Системные требования",
        paragraphs: [
          "64-bit Windows, от 4 GB RAM, интернет для первой загрузки Minecraft и модов. Лаунчер сам предложит Temurin Java нужной версии.",
        ],
      },
    ],
    faq: [
      {
        q: "Скачать лаунчер майнкрафт бесплатно можно?",
        a: "Да, dopamine бесплатен. Кнопка загрузки на этой странице ведёт на официальный установщик.",
      },
    ],
    relatedSlugs: ["launcher-minecraft", "minecraft-launcher-download", "dopamine-launcher"],
  },
  {
    slug: "minecraft-launcher-download",
    title: "Minecraft Launcher Download — Free for Windows | dopamine",
    description:
      "Minecraft launcher download for Windows 10/11. Get dopamine — free launcher with Modrinth, Fabric, Forge, local servers. Official minecraft launcher download from dopamine.cfd.",
    keywords: [
      "minecraft launcher download",
      "download minecraft launcher",
      "minecraft launcher download free",
      "minecraft launcher windows download",
      "dopamine download",
    ],
    h1: "Minecraft Launcher Download",
    subtitle: "Official dopamine download — free Minecraft launcher for Windows",
    tag: "download",
    sections: [
      {
        h2: "Official Minecraft launcher download",
        paragraphs: [
          "This page is the english-friendly entry for minecraft launcher download queries. dopamine ships as a signed Windows installer from www.dopamine.cfd with automatic updates — no third-party mirrors.",
        ],
      },
      {
        h2: "What's included",
        list: [
          "Windows installer and optional portable build",
          "Modrinth mod and modpack support",
          "Fabric, Forge, NeoForge, vanilla",
          "Local minecraft servers for friends",
          "Account sync with dopamine.cfd",
        ],
        paragraphs: [],
      },
    ],
    faq: [
      {
        q: "Is the minecraft launcher download free?",
        a: "Yes. dopamine is free. Use the Download button to get the latest installer.",
      },
    ],
    relatedSlugs: ["minecraft-launcher", "free-minecraft-launcher", "skachat-launcher-minecraft"],
  },
  {
    slug: "launcher-s-modami",
    title: "Лаунчер Minecraft с модами — Fabric, Forge, Modrinth | dopamine",
    description:
      "Лаунчер с модами для Minecraft: dopamine — Modrinth, Fabric, Forge, NeoForge, modpack'и. Скачать бесплатно для Windows.",
    keywords: [
      "лаунчер с модами",
      "лаунчер minecraft с модами",
      "лаунчер майнкрафт с модами",
      "minecraft launcher with mods",
      "fabric launcher",
      "forge launcher",
      "modrinth launcher",
    ],
    h1: "Лаунчер Minecraft с модами",
    subtitle: "Modrinth, Fabric, Forge и NeoForge в одном лаунчере майнкрафт",
    tag: "моды · modpack",
    sections: [
      {
        h2: "Лаунчер с модами без ручной возни",
        paragraphs: [
          "Искать «лаунчер с модами» обычно начинают после первой попытки собрать Fabric или Forge вручную. dopamine — лаунчер minecraft с модами через Modrinth: поиск, установка, обновление и несколько modpack-профилей в одном списке.",
        ],
      },
      {
        h2: "Поддерживаемые платформы модов",
        list: [
          "Fabric — лёгкие моды и performance-паки",
          "Forge — классическая модовая экосистема",
          "NeoForge — форки и новые сборки",
          "Modrinth modpack'и одной кнопкой",
        ],
        paragraphs: [],
      },
      {
        h2: "Minecraft launcher with mods",
        paragraphs: [
          "For english queries minecraft launcher with mods, dopamine combines Modrinth browsing, Java management and play buttons in one UI — no manual jar copying.",
        ],
      },
    ],
    faq: [
      {
        q: "Есть ли лаунчер с modpack'ами?",
        a: "Да. Modrinth modpack'и ставятся из dopamine без отдельных программ.",
      },
    ],
    relatedSlugs: ["launcher-minecraft", "minecraft-modpack-launcher", "minecraft-launcher"],
  },
  {
    slug: "minecraft-modpack-launcher",
    title: "Minecraft Modpack Launcher — Modrinth & Fabric | dopamine",
    description:
      "Minecraft modpack launcher for Windows: install Modrinth packs, Fabric, Forge via dopamine. Free modpack launcher with local servers for friends.",
    keywords: [
      "minecraft modpack launcher",
      "modpack launcher",
      "modrinth launcher",
      "best modpack launcher",
      "minecraft launcher modpack",
    ],
    h1: "Minecraft Modpack Launcher",
    subtitle: "Install and play Modrinth modpacks with dopamine on Windows",
    tag: "modpack launcher",
    sections: [
      {
        h2: "Modpack launcher built on Modrinth",
        paragraphs: [
          "dopamine is a minecraft modpack launcher that pulls packs from Modrinth, resolves dependencies and launches with the correct Fabric or Forge version. Switch between modpacks like regular Minecraft profiles.",
        ],
      },
      {
        h2: "Why use dopamine for modpacks",
        list: [
          "One-click Modrinth modpack install",
          "Separate RAM settings per profile",
          "Host a modded server for friends from the same launcher",
          "Auto Java download",
        ],
        paragraphs: [],
      },
    ],
    faq: [
      {
        q: "Does dopamine support CurseForge modpacks?",
        a: "Primary catalog is Modrinth. Most popular packs are available there; import flows focus on Modrinth modpacks.",
      },
    ],
    relatedSlugs: ["launcher-s-modami", "minecraft-launcher", "launcher-minecraft"],
  },
  {
    slug: "free-minecraft-launcher",
    title: "Free Minecraft Launcher for Windows — Download | dopamine",
    description:
      "Free minecraft launcher for Windows 10/11: dopamine with Modrinth, mods, local servers. No ads. Official free minecraft launcher download.",
    keywords: [
      "free minecraft launcher",
      "minecraft launcher free",
      "best free minecraft launcher",
      "free minecraft launcher download",
      "free launcher minecraft windows",
    ],
    h1: "Free Minecraft Launcher",
    subtitle: "dopamine — free minecraft launcher with mods and servers, no ads",
    tag: "free · windows",
    sections: [
      {
        h2: "Truly free Minecraft launcher",
        paragraphs: [
          "Many «free minecraft launcher» results bundle adware. dopamine is free without ads: Modrinth, servers for friends, Fabric/Forge and updates from the official site.",
        ],
      },
      {
        h2: "Free vs paid features",
        list: [
          "Free: launcher, mods, vanilla/modded play, basic local servers",
          "Optional: extra server slots via keys on dopamine.cfd",
          "No paywall for downloading or playing Minecraft profiles",
        ],
        paragraphs: [],
      },
    ],
    faq: [
      {
        q: "Is dopamine the best free minecraft launcher?",
        a: "It fits players who want Modrinth, RU/EN UI and built-in friend servers on Windows.",
      },
    ],
    relatedSlugs: ["minecraft-launcher", "minecraft-launcher-download", "launcher-minecraft"],
  },
  {
    slug: "minecraft-launcher-windows",
    title: "Minecraft Launcher Windows 10/11 — Download | dopamine",
    description:
      "Minecraft launcher for Windows 10 and Windows 11. Download dopamine — 64-bit minecraft launcher windows with Modrinth, auto Java and local servers.",
    keywords: [
      "minecraft launcher windows",
      "minecraft launcher windows 10",
      "minecraft launcher windows 11",
      "windows minecraft launcher",
      "лаунчер minecraft windows",
    ],
    h1: "Minecraft Launcher for Windows",
    subtitle: "dopamine — minecraft launcher windows 10/11, 64-bit, free download",
    tag: "windows 10 · 11",
    sections: [
      {
        h2: "Minecraft launcher Windows 10 and 11",
        paragraphs: [
          "dopamine targets 64-bit Windows 10 and Windows 11. The minecraft launcher windows build includes auto-updates, Temurin Java setup and native dark UI optimized for PC.",
        ],
      },
      {
        h2: "Why Windows players choose dopamine",
        list: [
          "Native Windows installer (.exe)",
          "Optional portable zip",
          "Low overhead vs Electron-heavy alternatives",
          "Integrated Modrinth and servers",
        ],
        paragraphs: [],
      },
    ],
    faq: [
      {
        q: "Does it work on Windows 11?",
        a: "Yes. Windows 10 and 11 64-bit are fully supported.",
      },
    ],
    relatedSlugs: ["minecraft-launcher", "minecraft-launcher-download", "free-minecraft-launcher"],
  },
  {
    slug: "minecraft",
    title: "Minecraft — лаунчер, моды и серверы для друзей | dopamine",
    description:
      "Minecraft на Windows через dopamine: лаунчер майнкрафт, Modrinth моды, Fabric, Forge, создать сервер для друзей. Скачать бесплатно.",
    keywords: [
      "майнкрафт",
      "minecraft",
      "майнкрафт скачать",
      "minecraft игра",
      "майнкрафт лаунчер",
      "minecraft mods",
      "minecraft играть",
    ],
    h1: "Minecraft — играй через dopamine",
    subtitle: "Майнкрафт на Windows: лаунчер, моды Modrinth и серверы для друзей",
    tag: "minecraft · майнкрафт",
    sections: [
      {
        h2: "Minecraft на PC — с чего начать",
        paragraphs: [
          "Если вы ищете «майнкрафт» или «minecraft», вам нужен надёжный способ установить игру, моды и поиграть с друзьями. dopamine — лаунчер майнкрафт, который закрывает весь цикл: версии, Java, Modrinth, локальный сервер.",
          "Это не замена покупки лицензии Mojang там, где она требуется, — dopamine помогает управлять установками и мультиплеером для друзей на Windows.",
        ],
      },
      {
        h2: "Что даёт dopamine для Minecraft",
        list: [
          "Быстрый запуск vanilla и модовых версий",
          "Modrinth — моды и modpack'и",
          "Создать сервер майнкрафт для друзей",
          "Профиль и статистика на dopamine.cfd",
        ],
        paragraphs: [],
      },
    ],
    faq: [
      {
        q: "dopamine — это сам Minecraft?",
        a: "Нет, это лаунчер для запуска Minecraft на Windows. Игра скачивается через профиль в лаунчере.",
      },
    ],
    relatedSlugs: ["launcher-minecraft", "minecraft-server", "launcher-s-modami", "dopamine"],
  },
  ...SEO_PAGES_EXTRA,
];

export const SEO_PAGE_MAP = new Map(SEO_PAGES.map((p) => [p.slug, p]));

export function getSeoPage(slug: string): SeoPageConfig | undefined {
  return SEO_PAGE_MAP.get(slug);
}

export function getAllSeoSlugs(): string[] {
  return SEO_PAGES.map((p) => p.slug);
}

export function getSeoPagePath(slug: string): string {
  return `/${slug}`;
}
