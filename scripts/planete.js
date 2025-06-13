export function createPlaneteSheet(SuperSheet) {
  return class PlaneteActorSheet extends SuperSheet {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["spatiopolis", "sheet", "actor", "planete-sheet"],
        width: 800,
        height: 600,
        resizable: true
      });
    }

    get template() {
      return "modules/npc2place/templates/planete-sheet.hbs";
    }

    async getData(options) {
      const context = await super.getData(options);
      context.isPlanete = true;

      const parseSettingList = (settingKey, localizationPrefix = null) => {
        const raw = game.settings.get("npc2place", settingKey);
        return raw
          .split(";")
          .map(entry => entry.trim())
          .filter(entry => entry.length > 0)
          .map(key => ({
            key,
            label: localizationPrefix ? game.i18n.localize(`${localizationPrefix}.${key}`) : key
          }));
      };

      context.secondarySpeciesList = game.settings.get("npc2place", "listeEspeces")?.split(";") || [];
      context.planetTypes = parseSettingList("listeTypesPlanete");
      context.habitabilites = parseSettingList("listeHabitabilites");
      context.affiliations = parseSettingList("listeAffiliations");
      context.variationsTemperature = parseSettingList("listeVariationsTemperature", "npc2place.variationTemperature");
      context.respirabilites = parseSettingList("listeRespirabilites", "npc2place.respirabilite");

      context.variationTemperature = await this.actor.getFlag("npc2place", "variationTemperature") ?? "";
      context.respirabilite = await this.actor.getFlag("npc2place", "respirabilite") ?? "";

      const selected = this.actor.system.details.biography?.value?.split(";") ?? [];
      context.selectedSecondarySpecies = new Set(selected);

      context.ancestries = this.actor.items.filter(i => i.type === "ancestry");
      context.notes = await this.actor.getFlag("npc2place", "notes") ?? "";

      const lieux = await this.actor.getFlag("npc2place", "villes") ?? [];
      context.lieuxLiees = [];
      for (let uuid of lieux) {
        const actor = await fromUuid(uuid);
        if (actor) context.lieuxLiees.push({ name: actor.name, uuid, img: actor.img });
      }

      const ressources = await this.actor.getFlag("npc2place", "ressources") ?? [];
      context.ressources = [];
      for (let uuid of ressources) {
        const item = await fromUuid(uuid);
        if (item) context.ressources.push({ name: item.name, uuid, img: item.img });
      }

      return context;
    }

    async _updateObject(event, formData) {
      const form = this.element[0];
      await new Promise(resolve => setTimeout(resolve, 0));

      const selectedCheckboxes = Array.from(form.querySelectorAll(".species-secondary:checked"));
      const selectedValues = selectedCheckboxes.map(el => el.value);
      formData["system.details.biography.value"] = selectedValues.join(";");

      const tempVar = form.querySelector("[name='flags.npc2place.variationTemperature']")?.value || "";
      const respir = form.querySelector("[name='flags.npc2place.respirabilite']")?.value || "";

      await this.actor.setFlag("npc2place", "variationTemperature", tempVar);
      await this.actor.setFlag("npc2place", "respirabilite", respir);

      return await this.actor.update(formData);
    }

    async _render(force, options) {
      const currentTab = this.element?.find(".sheet-tabs .item.active").data("tab") || "infos";
      this._activeTab = currentTab;
      await super._render(force, options);

      const tabToShow = this._activeTab || "infos";
      const html = this.element;
      html.find(".sheet-tabs .item").removeClass("active");
      html.find(`.sheet-tabs .item[data-tab="${tabToShow}"]`).addClass("active");
      html.find(".sheet-body .tab").removeClass("active");
      html.find(`.sheet-body .tab[data-tab="${tabToShow}"]`).addClass("active");
    }

    activateListeners(html) {
      super.activateListeners(html);

      html.find(".sheet-tabs").on("click", ".item", event => {
        const tab = $(event.currentTarget).data("tab");
        this._activeTab = tab;
        html.find(".sheet-tabs .item").removeClass("active");
        $(event.currentTarget).addClass("active");
        html.find(".sheet-body .tab").removeClass("active");
        html.find(`.sheet-body .tab[data-tab='${tab}']`).addClass("active");
      });

      html.find(".item-edit").click(ev => {
        const li = ev.currentTarget.closest("[data-item-id]");
        const item = this.actor.items.get(li?.dataset?.itemId);
        if (item) item.sheet.render(true);
      });

      html.find(".item-delete").click(ev => {
        const li = ev.currentTarget.closest("[data-item-id]");
        const item = this.actor.items.get(li?.dataset?.itemId);
        if (item) item.delete();
      });

      html.find("[data-drop-target='species']").on("drop", async (event) => {
        event.preventDefault();
        const data = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
        if (data.type !== "Actor" || !data.uuid) return;

        const droppedActor = await fromUuid(data.uuid);
        if (!droppedActor || droppedActor.type !== "npc") return;

        const ancestryData = {
          name: `[Espèce] ${droppedActor.name}`,
          type: "ancestry",
          img: droppedActor.img,
          system: {}
        };

        await this.actor.createEmbeddedDocuments("Item", [ancestryData]);
      });

      html.find(".open-linked-ville").click(async ev => {
        const uuid = ev.currentTarget.dataset.uuid;
        const actor = await fromUuid(uuid);
        if (actor) actor.sheet.render(true);
      });

      html.find(".remove-linked-ville").click(async ev => {
        const uuid = ev.currentTarget.dataset.uuid;
        let lieux = await this.actor.getFlag("npc2place", "villes") ?? [];
        lieux = lieux.filter(u => u !== uuid);
        await this.actor.setFlag("npc2place", "villes", lieux);
        this.render();
      });

      html.find(".open-ressource").click(async ev => {
        const uuid = ev.currentTarget.closest(".item").dataset.uuid;
        const item = await fromUuid(uuid);
        if (item) item.sheet.render(true);
      });

      html.find(".remove-ressource").click(async ev => {
        const uuid = ev.currentTarget.closest(".item").dataset.uuid;
        let ressources = await this.actor.getFlag("npc2place", "ressources") ?? [];
        ressources = ressources.filter(u => u !== uuid);
        await this.actor.setFlag("npc2place", "ressources", ressources);
        this.render();
      });

      const dropRess = html.find(".drop-ressources");
      dropRess.on("dragover", ev => ev.preventDefault());
      dropRess.on("dragenter", () => dropRess.addClass("dragover"));
      dropRess.on("dragleave", () => dropRess.removeClass("dragover"));
      dropRess.on("drop", async ev => {
        dropRess.removeClass("dragover");
        ev.preventDefault();

        const data = JSON.parse(ev.originalEvent.dataTransfer.getData("text/plain"));
        if (!data?.uuid) return;

        const item = await fromUuid(data.uuid);
        if (!item || !["consumable", "loot"].includes(item.type)) return;

        let ressources = await this.actor.getFlag("npc2place", "ressources") ?? [];
        if (!ressources.includes(data.uuid)) {
          await this.actor.setFlag("npc2place", "ressources", [...ressources, data.uuid]);
          this.render();
        }
      });

      const dropVilles = html.find(".drop-villes");
      dropVilles.on("dragover", ev => ev.preventDefault());
      dropVilles.on("dragenter", () => dropVilles.addClass("dragover"));
      dropVilles.on("dragleave", () => dropVilles.removeClass("dragover"));
      dropVilles.on("drop", async ev => {
        dropVilles.removeClass("dragover");
        ev.preventDefault();

        const data = JSON.parse(ev.originalEvent.dataTransfer.getData("text/plain"));
        if (!data?.uuid) return;

        const actor = await fromUuid(data.uuid);
        if (!actor || actor.type !== "npc") return;

        let lieux = await this.actor.getFlag("npc2place", "villes") ?? [];
        if (!lieux.includes(data.uuid)) {
          await this.actor.setFlag("npc2place", "villes", [...lieux, data.uuid]);
          this.render();
        }
      });
    }
  };
}
