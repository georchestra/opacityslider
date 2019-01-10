Ext.namespace("GEOR");

/** api: constructor
 *  .. class:: MapOpacitySlider(config)
 */
GEOR.MapOpacitySlider = Ext.extend(Ext.Toolbar, {

    layers: null,
    map: null,
    leftCombo: null,
    rightCombo: null,
    mapPanel: null,
    layerManager: null,
    slider: null,

    layersCfg: null,
    closeAction: null,

    leftLayersStore: null,
    rightLayersStore: null,

    stateEvents: ['opacitychange'],

    /**
     * private: method[initComponent]
     * Creates the map toolbar.
     *
     * Returns:
     * {Ext.Toolbar} The toolbar.
     */
    initComponent: function() {

        GEOR.MapOpacitySlider.superclass.initComponent.call(this);

        this.mapPanel = GeoExt.MapPanel.guess();
        this.layerManager = Ext.getCmp('geor-layerManager').root;
        this.leftLayersStore = new GeoExt.data.LayerStore();

        this.addEvents(
                /** private: event[opacitychange]
                 * Throws when the opacity change.
                 */
                'opacitychange'
            );

        this.rightLayersStore = new GeoExt.data.LayerStore();

        // Retrieve all informations from capability documents of all layers in configuration options
        var layersInitModule = new GEOR.LayersInit({
            layersCfg: this.layersCfg,
            listeners: {
                load: function(store) {
                    // load newly created store records into each combo store:
                    this.loadStores(store);
                    this.checkDisablement();
                },
                scope: this
            }
        });
        // triggers GetCapabilities requests:
        layersInitModule.loadLayers();

        this.initBaselayerCombo();
        this.add(this.createCloseButton(), this.leftCombo, this.createOpacitySlider(), this.rightCombo);

        this.on('afterrender', function() {
            this.items.first().el.on("click", this.closeAction, this);
        });
    },

    createCloseButton: function() {
        return '<div class="x-tool x-tool-close" ext:qtip="Désactiver">&#160;</div>';
    },

    /**
     * Method: loadStores
     *
     * Load right and left combo stores from a global layerStore retrieve from capability
     * documents for all layer in add-on configuration options.
     */
    loadStores: function(store) {

        // load both store with all "opaque" layer of the main layerStore
        this.leftLayersStore.add(store.getRange());
        this.rightLayersStore.add(store.getRange());
    },

    /**
     * Method: addLayers
     *
     * Add initial 2 layers (first one of each combo box) to the main map.
     */
    addLayers: function() {
        this.mapPanel.layers.add(this.rightLayersStore.getAt(0));
        this.mapPanel.layers.add(this.leftLayersStore.getAt(0));
    },

    /**
     * Method: initComboValues
     *
     * Set both combo values. Because the load of the capability store will be triggered
     * after combo initialization.
     */
    initComboValues: function() {
        if(this.leftCombo && ! this.leftCombo.getValue()) {
            this.leftCombo.setValue(this.leftLayersStore.getAt(0).get('title'));
            this.leftCombo.oldID = this.leftLayersStore.getAt(0).id;
        }
        if(this.rightCombo && ! this.rightCombo.getValue()) {
            this.rightCombo.setValue(this.rightLayersStore.getAt(0).get('title'));
            this.rightCombo.oldID = this.rightLayersStore.getAt(0).id;
        }
    },

    /**
     * Method: createOpacitySlider
     * Create the slider between 2 potential opaque layers
     *
     * Returns:
     * {Ext.BoxComponent} The opacity slider
     */
    createOpacitySlider: function() {

        this.slider = new GeoExt.LayerOpacitySlider({
            width: 100,
            inverse: true,
            disabled: true,
            aggressive: true,
            changeVisibility: false, // to prevent layer reloading
            maxvalue: 100,
            style: "margin-right: 10px;margin-left: 10px;"
        });

        this.slider.on('changecomplete', function() {
            this.fireEvent('opacitychange');
        }, this);

        return this.slider;
    },

    /**
     * Method : onComboChange
     *
     * Called when a layer is selected in one of the combo. The layer is removed from the other combo,
     * and the old value is added back to the other combo.
     * The select layer is added to the map while the old is removed.
     * Opacity is kept.
     */
    onComboChange: function(thisStore, otherStore, newRecord, oldID) {
        var opacity = 1;
        if(oldID) {
            otherStore.add(thisStore.getById(oldID));
            opacity = this.mapPanel.layers.getById(oldID).getLayer().opacity;
            this.mapPanel.layers.remove(this.mapPanel.layers.getById(oldID));
        }
        otherStore.remove(newRecord);
        if(!this.mapPanel.layers.getById(newRecord.id)) {
            newRecord.getLayer().opacity = opacity;
            this.mapPanel.layers.add(newRecord);
        }

        this.checkDisablement();
    },

    /**
     * Raise a layer to the bottom of the map index.
     * The right layer is dropped down cause it has to be under the left one.
     */
    raiseLayer: function(layer, pos) {
        this.map.raiseLayer(layer,-(this.map.getLayerIndex(layer)-pos));
    },

    /**
     * Reset slider on WMC load.
     * - Put back layers in the combo stores
     * - Reset values of both combos
     */
    onWMCRead: function(a,b,c,d) {
        if(this.leftCombo.oldID) {
            this.rightLayersStore.add(this.leftLayersStore.getById(this.leftCombo.oldID));
            this.leftCombo.oldID = undefined;
            this.leftCombo.setValue('');
        }
        if(this.rightCombo.oldID) {
            this.leftLayersStore.add(this.rightLayersStore.getById(this.rightCombo.oldID));
            this.rightCombo.oldID = undefined;
            this.rightCombo.setValue('');
        }
    },

    /**
     * Method: createBaselayerCombo
     * Create a combobox for the baselayer selection.
     *
     * Returns:
     * {Ext.form.ComboBox} The combobox.
     */
    initBaselayerCombo: function() {

        // both stores won't probably be loaded before combo creation
        // so value and oldID will be set to null at this point
        this.leftCombo = new Ext.form.ComboBox({
            editable: false,
            hideLabel: true,
            width: 140,
            disabled: true,
            store: this.leftLayersStore,
            displayField: 'title',
            valueField: 'title',
            triggerAction: 'all',
            mode: 'local',
            listWidth: Ext.isIE ? 200 : undefined,
            listeners: {
                'select': function(combo, record, index) {
                    combo.newID = record.id;
                    this.updateStyle(record.id, combo.oldID);
                    this.onComboChange(this.leftLayersStore, this.rightLayersStore, record, combo.oldID);
                    this.slider.setLayer(record.getLayer());
                    combo.oldID = record.id;
                    this.raiseLayer(record.getLayer(), this.rightCombo.getValue() ? 2 : 1);
                },
                scope: this
            }
        });

        this.rightCombo = new Ext.form.ComboBox({
            editable: false,
            disabled: true,
            hideLabel: true,
            width: 140,
            store: this.rightLayersStore,
            displayField: 'title',
            valueField: 'title',
            triggerAction: 'all',
            mode: 'local',
            listWidth: Ext.isIE ? 200 : undefined,
            listeners: {
                'select': function(combo, record, index) {
                    combo.newID = record.id;
                    this.updateStyle(record.id,combo.oldID);
                    this.onComboChange(this.rightLayersStore, this.leftLayersStore, record, combo.oldID);
                    combo.oldID = record.id;
                    this.raiseLayer(record.getLayer(), 1);
                },
                scope: this
            }
        });

        this.on('afterrender', this.checkDisablement, this);

        // To keep background-layers style on layer tree update
        this.layerManager.on('insert', this.restoreStyle, this);
        this.layerManager.on('append', this.restoreStyle, this);

        GEOR.wmc.events.on('beforecontextrestore', this.onWMCRead, this);
        GEOR.managelayers.events.on("beforecontextcleared", this.onWMCRead, this);
    },

    /**
     * Method : checkDisablement
     *
     * Check if the slider has to be enabled or not. At least 2 opaque layers must have been added to the
     * map to enable it.
     */
    checkDisablement : function() {
        this.setDisabled(!(this.leftLayersStore.getCount()>0 && this.rightLayersStore.getCount()>0));
        if(this.leftCombo.getValue() == '') {
            this.slider.setDisabled(true);
        }
    },

    /**
     * method : updateStyle
     *
     * Add the background class of the new background layer in the layer tree, and remove this class
     * from the layer that have been removed.
     */
    updateStyle: function(newLayerId, oldLayerId) {
        var findLayer = function(node) {
          return newLayerId == node.attributes.layer.id;
        };
        var oldLayerNode = this.layerManager.findChildBy(function(node) {
          return oldLayerId == node.attributes.layer.id;
        });

        var newLayerNode = this.layerManager.findChildBy(function(node) {
            return newLayerId == node.attributes.layer.id;
         });

        if(oldLayerNode) {
            oldLayerNode.getUI().removeClass('opacityslider-bglayers');
        }
        if(newLayerNode) {
            newLayerNode.getUI().addClass('opacityslider-bglayers');
        }
    },

    /**
     * method : restoreStyle
     *
     * Restore style of background-layers in the layer manager. Called on each event on main
     * map layerStore because the layer tree styles are reset.
     */
    restoreStyle: function(tree, root, node) {
        if(node.attributes.layer.id == this.leftCombo.newID || node.attributes.layer.id == this.rightCombo.newID) {
            node.attributes.cls = 'opacityslider-bglayers geor-tree-node';
        }
    },

    /**
     * Method : setDisabled
     *
     * Disable or enable all component of the tool bar.
     */
    setDisabled: function(disabled) {
        this.items.each(function(item) {
           item.setDisabled(disabled);
        });
    },

    /**
     * Method:
     *
     * Clean add-on tool bar component. Remove the backgrounds layers from the map
     */
    cleanAddon: function() {
        this.mapPanel.layers.remove(this.mapPanel.layers.getById(this.leftCombo.oldID));
        this.mapPanel.layers.remove(this.mapPanel.layers.getById(this.rightCombo.oldID));
    }
});
