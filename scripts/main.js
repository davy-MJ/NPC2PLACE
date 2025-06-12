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

  registerSetting("listeTypesPlanete", "npc2place.settings.listeTypesPlanete.name", "npc2place.settings.listeTypesPlanete.hint", "npc2place.listeTypesPlaneteDefault");
  registerSetting("listeHabitabilites", "npc2place.settings.listeHabitabilites.name", "npc2place.settings.listeHabitabilites.hint", "npc2place.listeHabitabilitesDefault");
  registerSetting("listeEspeces", "npc2place.settings.listeEspeces.name", "npc2place.settings.listeEspeces.hint", "npc2place.listeEspecesDefault");
  registerSetting("listeAffiliations", "npc2place.settings.listeAffiliations.name", "npc2place.settings.listeAffiliations.hint", "npc2place.listeAffiliationsDefault");


  registerSetting("listeTypesLieux", "npc2place.settings.listeTypesLieux.name", "npc2place.settings.listeTypesLieux.hint", "npc2place.listeTypesLieuxDefault");
  registerSetting("listeTaillesLieux", "npc2place.settings.listeTaillesLieux.name", "npc2place.settings.listeTaillesLieux.hint", "npc2place.listeTaillesLieuxDefault");
  registerSetting("listeGouvernances", "npc2place.settings.listeGouvernances.name", "npc2place.settings.listeGouvernances.hint", "npc2place.listeGouvernancesDefault");
  registerSetting("listeSituationsGeo", "npc2place.settings.listeSituationsGeo.name", "npc2place.settings.listeSituationsGeo.hint", "npc2place.listeSituationsGeoDefault");
  registerSetting("listeActivites", "npc2place.settings.listeActivites.name", "npc2place.settings.listeActivites.hint", "npc2place.listeActivitesDefault");
  registerSetting("listeInfrastructures", "npc2place.settings.listeInfrastructures.name", "npc2place.settings.listeInfrastructures.hint", "npc2place.listeInfrastructuresDefault");

  // 🔄 Réinitialisation des paramètres via un menu
  game.settings.registerMenu("npc2place", "resetDefaults", {
    name: game.i18n.localize("npc2place.settings.reset.name"),
    label: game.i18n.localize("npc2place.settings.reset.label"),
    hint: game.i18n.localize("npc2place.settings.reset.hint"),
    icon: "fas fa-rotate",
    type: class extends FormApplication {
      async render() {
        const keys = [
          "listeTypesPlanete", "listeHabitabilites", "listeEspeces", "listeAffiliations",
          "listeTypesLieux", "listeTaillesLieux", "listeGouvernances", "listeSituationsGeo",
          "listeActivites", "listeInfrastructures"
        ];
        for (const key of keys) {
          const defKey = `npc2place.${key}Default`;
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

Hooks.once("ready", () => {
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

  console.log(`${game.i18n.localize("npc2place.registerLog")} ${styleActif}`);
});
