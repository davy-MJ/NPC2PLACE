// main.js – Module npc2place (NPC to Place – Planètes & Lieux)
import { createPlaneteSheet } from "./planete.js";
import { createPlaceSheet } from "./place.js";

Hooks.once("init", () => {
  // 🔧 Helpers Handlebars
  Handlebars.registerHelper("split", (string, delimiter) => {
    if (typeof string !== "string") return [];
    return string.split(delimiter);
  });

  Handlebars.registerHelper("array", (...args) => args.slice(0, -1));
  Handlebars.registerHelper("includes", (collection, value) => {
    if (!collection) return false;
    return collection.includes?.(value) || collection.has?.(value);
  });

  Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });

  game.settings.register("npc2place", "styleActif", {
    name: game.i18n.localize("npc2place.settings.styleActif.name"),
    hint: game.i18n.localize("npc2place.settings.styleActif.hint"),
    scope: "world",
    config: true,
    type: String,
    choices: {
      "sci-fi": game.i18n.localize("npc2place.settings.styleActif.sci-fi"),
      "medieval": game.i18n.localize("npc2place.settings.styleActif.medieval")
    },
    default: "sci-fi",
    onChange: () => {
      ui.notifications.info(game.i18n.localize("npc2place.themeChanged"));
      location.reload();
    }
  });

  const registerSetting = (key, nameKey, hintKey, defaultKey) => {
    const defaultValue = game.i18n.has(defaultKey)
      ? game.i18n.localize(defaultKey)
      : defaultKey;
    game.settings.register("npc2place", key, {
      name: game.i18n.localize(nameKey),
      hint: game.i18n.localize(hintKey),
      scope: "world",
      config: true,
      type: String,
      default: defaultValue
    });
  };

  const settingsList = [
    ["listeTypesPlanete", "listeTypesPlanete"],
    ["listeHabitabilites", "listeHabitabilites"],
    ["listeEspeces", "listeEspeces"],
    ["listeAffiliations", "listeAffiliations"],
    ["listeTypesLieux", "listeTypesLieux"],
    ["listeTaillesLieux", "listeTaillesLieux"],
    ["listeGouvernances", "listeGouvernances"],
    ["listeSituationsGeo", "listeSituationsGeo"],
    ["listeActivites", "listeActivites"],
    ["listeInfrastructures", "listeInfrastructures"]
  ];

  for (let [key, base] of settingsList) {
    registerSetting(
      key,
      `npc2place.settings.${base}.name`,
      `npc2place.settings.${base}.hint`,
      `npc2place.settings.${base}.var`
    );
  }

  // 🔄 Réinitialisation des paramètres via un menu
  game.settings.registerMenu("npc2place", "resetDefaults", {
    name: game.i18n.localize("npc2place.settings.reset.name"),
    label: game.i18n.localize("npc2place.settings.reset.label"),
    hint: game.i18n.localize("npc2place.settings.reset.hint"),
    icon: "fas fa-rotate",
    type: class extends FormApplication {
      async render() {
        for (const [key, base] of settingsList) {
          const defKey = `npc2place.settings.${base}.var`;
          const value = game.i18n.localize(defKey);
          await game.settings.set("npc2place", key, value);
        }
        ui.notifications.info(game.i18n.localize("npc2place.settings.reset.confirm"));
        setTimeout(() => location.reload(), 500);
      }
    },
    restricted: true
  });
});

Hooks.once("ready", async () => {
  const SwadeNPCSheet = CONFIG.Actor.sheetClasses["npc"]["swade.SwadeNPCSheet"]?.cls;
  if (!SwadeNPCSheet) {
    console.warn(game.i18n.localize("npc2place.warnSwadeNotFound"));
    return;
  }

  const styleActif = game.settings.get("npc2place", "styleActif");
  const stylePath = styleActif === "medieval"
    ? "modules/npc2place/styles/styles-medieval.css"
    : "modules/npc2place/styles/styles-scifi.css";

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = stylePath;
  document.head.appendChild(link);

  const PlaneteActorSheet = createPlaneteSheet(SwadeNPCSheet);
  const PlaceActorSheet = createPlaceSheet(SwadeNPCSheet);

  Actors.registerSheet("npc", PlaneteActorSheet, {
    label: game.i18n.localize("npc2place.sheet.planete"),
    types: ["npc"],
    makeDefault: false,
    id: "npc2place-planete-sheet"
  });

  Actors.registerSheet("npc", PlaceActorSheet, {
    label: game.i18n.localize("npc2place.sheet.place"),
    types: ["npc"],
    makeDefault: false,
    id: "npc2place-place-sheet"
  });

  // 🛠 Initialisation automatique des settings vides
  for (const [key, base] of [
    ["listeTypesPlanete", "listeTypesPlanete"],
    ["listeHabitabilites", "listeHabitabilites"],
    ["listeEspeces", "listeEspeces"],
    ["listeAffiliations", "listeAffiliations"],
    ["listeTypesLieux", "listeTypesLieux"],
    ["listeTaillesLieux", "listeTaillesLieux"],
    ["listeGouvernances", "listeGouvernances"],
    ["listeSituationsGeo", "listeSituationsGeo"],
    ["listeActivites", "listeActivites"],
    ["listeInfrastructures", "listeInfrastructures"]
  ]) {
    const currentValue = game.settings.get("npc2place", key);
    if (!currentValue || currentValue.trim() === "") {
      const defKey = `npc2place.settings.${base}.var`;
      const value = game.i18n.localize(defKey);
      await game.settings.set("npc2place", key, value);
      console.log(`npc2place | Paramètre ${key} initialisé à la valeur par défaut.`);
    }
  }

  console.log(`${game.i18n.localize("npc2place.registerLog")} ${styleActif}`);
});
