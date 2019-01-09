/*global
 Ext, GeoExt, OpenLayers, GEOR
 */
Ext.namespace("GEOR.Addons");

GEOR.Addons.OpacitySlider = Ext.extend(GEOR.Addons.Base, {

    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
        this.item = new Ext.menu.CheckItem({
            text: this.getText(record),
            qtip: this.getQtip(record),
            checked: true,
            canActivate: false,
            listeners: {
                "checkchange": this.onCheckchange,
                scope: this
            }
        });
        this.create();
    },

    /**
     * Method: onCheckchange
     * Callback on checkbox state changed
     */
    onCheckchange: function(item, checked) {
        if (checked) {
            this.create();
        } else {
            this.remove();
        }
    },

    /**
     * Method: create
     *
     */
    create: function() {
        this.toolbar = new GEOR.MapOpacitySlider({
            closeAction: this.remove.createDelegate(this),
            map: this.map,
            cls: 'opacityToolbar',
            layersCfg: this.options.layers
        });
        this.container = Ext.DomHelper.append(this.mapPanel.bwrap, {
            tag: 'div',
            cls: 'baseLayersOpacitySlider'
        }, true );
        this.toolbar.render(this.container);
        this.toolbar.doLayout();
        var totalWidth = 0;
        this.toolbar.items.each(function(item) {
            totalWidth += item.getWidth() + 8;
        });
        this.container.setWidth(totalWidth);
        this.container.setStyle({
            'marginLeft': (-totalWidth / 2) + 'px',
            'background-color': this.options.backgroundColor || "rgba(255,255,255,0.5)"
        });
    },

    /**
     * Method: remove
     *
     */
    remove: function() {
        this.item.setChecked(false);
        this.toolbar.cleanAddon();
        this.toolbar.destroy();
        this.container.remove();
    },

    /**
     * Method: destroy
     *
     */
    destroy: function() {
        this.remove();
        this.control = null;
        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});
