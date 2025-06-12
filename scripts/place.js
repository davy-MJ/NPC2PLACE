export function createPlaceSheet(SuperSheet) {
  return class PlaceActorSheet extends SuperSheet {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["spatiopolis", "sheet", "actor", "place-sheet"],
        width: 800,
        height: 600,
        resizable: true
      });
    }

    get template() {
      return "modules/npc2place/templates/place-sheet.hbs";
    }

    async getData(options) {
      const context = await super.getData(options);
      context.isPlace = true;

      // Listes dynamiques
      context.secondarySpeciesList = game.settings.get("npc2place", "listeEspeces")?.split(";") || [];
      context.typesLieu = game.settings.get("npc2place", "listeTypesLieux")?.split(";") || [];
      context.tailles = game.settings.get("npc2place", "listeTaillesLieux")?.split(";") || [];
      context.gouvernances = game.settings.get("npc2place", "listeGouvernances")?.split(";") || [];
      context.situationsGeo = game.settings.get("npc2place", "listeSituationsGeo")?.split(";") || [];
      context.affiliations = game.settings.get("npc2place", "listeAffiliations")?.split(";") || [];
      context.activites = game.settings.get("npc2place", "listeActivites")?.split(";") || [];
      context.infrastructuresList = game.settings.get("npc2place", "listeInfrastructures")?.split(";") || [];

      // Données de l'acteur
      context.notes = await this.actor.getFlag("npc2place", "notes") ?? "";
      context.population = await this.actor.getFlag("npc2place", "population") ?? "";
      context.taille = await this.actor.getFlag("npc2place", "taille") ?? "";
      context.gouvernance = await this.actor.getFlag("npc2place", "gouvernance") ?? "";
      context.gestion = await this.actor.getFlag("npc2place", "gestion") ?? "";
      context.affiliation = await this.actor.getFlag("npc2place", "affiliation") ?? "";
      context.activite = await this.actor.getFlag("npc2place", "activite") ?? "";
      context.infrastructures = await this.actor.getFlag("npc2place", "infrastructures") ?? [];

      // Espèces secondaires
      const selected = this.actor.system.details.biography?.value?.split(";") ?? [];
      context.selectedSecondarySpecies = new Set(selected);

      context.ancestries = this.actor.items.filter(i => i.type === "ancestry");

      return context;
    }

    async _updateObject(event, formData) {
      const form = this.element[0];

      // Espèces secondaires
      const selectedCheckboxes = Array.from(form.querySelectorAll(".species-secondary:checked"));
      const selectedValues = selectedCheckboxes.map(el => el.value);
      formData["system.details.biography.value"] = selectedValues.join(";");

      // Champs personnalisés
      const fields = ["population", "taille", "gouvernance", "gestion", "affiliation", "activite"];
      for (const field of fields) {
        const value = form.querySelector(`[name='flags.npc2place.${field}']`)?.value || "";
        await this.actor.setFlag("npc2place", field, value);
      }

      // Description
      const editor = form.querySelector('[name="flags.npc2place.notes"]');
      if (editor) await this.actor.setFlag("npc2place", "notes", editor.value);

      // Infrastructures ajoutées
      const infraElements = form.querySelectorAll(".infrastructure-list .item");
      const infraValues = Array.from(infraElements).map(el => el.dataset.name);
      await this.actor.setFlag("npc2place", "infrastructures", infraValues);

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

      html.find(".sheet-tabs .item").first().addClass("active");
      html.find(".sheet-body .tab").first().addClass("active");

      // Gestion des infrastructures
      html.find(".add-infrastructure").on("click", () => {
        const select = html.find("#infrastructure-select");
        const selected = select.val();
        const list = html.find(".infrastructure-list");

        if (list.find(`[data-name="${selected}"]`).length === 0) {
          const item = $(`
            <div class="item" data-name="${selected}">
              <span class="item-name">${selected}</span>
              <a class="item-control remove-infrastructure" title="${game.i18n.localize("npc2place.remove")}"><i class="fas fa-trash"></i></a>
            </div>
          `);
          list.append(item);
        }
      });

      html.on("click", ".remove-infrastructure", (event) => {
        $(event.currentTarget).closest(".item").remove();
      });
    }
  };
}
