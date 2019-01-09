/*
 * Copyright (C) Camptocamp
 *
 * This file is part of geOrchestra
 *
 * geOrchestra is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with geOrchestra.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * @include GEOR_ows.js
 * @include GEOR_util.js
 * @include GEOR_waiter.js
 * @include OpenLayers/Projection.js
 * @include GeoExt/data/LayerRecord.js
 * @include GeoExt/data/LayerStore.js
 * @include GeoExt/data/WMSCapabilitiesReader.js
 */
Ext.namespace("GEOR");

GEOR.LayersInit = Ext.extend(Ext.util.Observable, {

    /**
     * Property: layerStore
     * {GeoExt.data.LayerStore}
     */
    layerStore: null,

    /**
     * Property: layersCfg
     * {Array}
     */
    layersCfg: null,

    /**
     * Property: tr
     * {Function} an alias to OpenLayers.i18n
     */
    tr: null,

    /**
     * Method: getUniqueWmsServers
     * Convenience method for getting unique WMS server URLs
     *
     * Parameters:
     * layersCfg - {Array}
     *
     * Returns:
     * {Object} a hash with keys "WMSLayer" and "WMS" indexing arrays of
     *          unique WMS server URLs
     */
    getUniqueWmsServers: function(layersCfg) {
        var t = {
            "WMSLayer": []
        };
        Ext.each(layersCfg, function(item) {
            if (item.url && t["WMSLayer"].indexOf(item.url)< 0) {
                t["WMSLayer"].push(item.url);
            }
        });
        return t;
    },

    /**
     * Method: updateStoreFromWMSLayer
     * Handles addition of WMS layers to map
     *
     * Parameters:
     * stores - {Object} Hash containing stores keyed by server url
     */
    updateStoreFromWMSLayer: function(stores) {
        // extract from stores layers which were initially requested
        var records = [], record;
        var count = 0;
        Ext.each(this.layersCfg, function(item) {
            record = stores[item.url].queryBy(function(r) {
                return (r.get('name') == item.name);
            }).first();
            if (record) {
                record.getLayer().params.FORMAT = 'image/jpeg';
                record.getLayer().gutter = 0;

                if(item.title) {
                    record.set('title', item.title);
                    record.getLayer().name = item.title;
                }
                if(item.url.indexOf('gwc') > 0) {
                    record.set('type', 'GWC');
                }

                // set metadataURLs in record, data comes from GeoNetwork
                if (item.metadataURLs) {
                    record.set("metadataURLs", item.metadataURLs);
                }
                records.push(record);
            }
        });

        Ext.each(records, function(record) {
            count += 1;
            this.layerStore.add(record);
        }, this);
        GEOR.waiter.hide();
        this.fireEvent('load', this.layerStore);
    },

    /**
     * Method: createStores
     * Method responsible for creating WMSCapabilities or
     * WMTSCapabilitiesstores (if url contains 'wmts')
     * When all done, executes a given callback
     *
     * Parameters:
     * wmsServers - {Array} Array of WMS server urls
     * callback - {Function} The callback
     *            (which takes a *stores* object as argument)
     */
    createStores: function(wmsServers, callback, scope) {
        var count = wmsServers.length;
        var stores = {};
        var capabilitiesCallback = function() {
            count -= 1;
            if (count === 0) {
                this.updateStoreFromWMSLayer(stores);
            }
        };
        Ext.each(wmsServers, function(wmsServerUrl) {
            GEOR.waiter.show();
            var u = GEOR.util.splitURL(wmsServerUrl);
            var serviceURL = u.serviceURL.replace(':443', '');
            var options = {
                    storeOptions: {
                        url: serviceURL
                    },
                    baseParams: u.params,
                    success: capabilitiesCallback,
                    failure: capabilitiesCallback,
                    scope: this
                };
            if(wmsServerUrl.indexOf('wmts')>0) {
                stores[wmsServerUrl] = new GEOR.ows.WMTSCapabilities(options);
            } else {
                stores[wmsServerUrl] = new GEOR.ows.WMSCapabilities(options);
            }
        }, this);
    },

    /**
     * Method: loadLayers
     * Load WMS layers.
     *
     * Parameters:
     * initState - {Array} GEOR.initstate array
     */
    loadLayers: function() {
        var wmsServers = this.getUniqueWmsServers(this.layersCfg);
        this.createStores(wmsServers['WMSLayer'], this.updateStoreFromWMSLayer);
    },

    constructor: function(config) {
        Ext.apply(this, config);
        this.tr = OpenLayers.i18n;
        this.layerStore = new GeoExt.data.LayerStore();

        this.addEvents('load');

        GEOR.LayersInit.superclass.constructor.apply(this, arguments);
    }
});
