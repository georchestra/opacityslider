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
     * Method: getUniqueOGCServers
     * Convenience method for getting unique server URLs
     *
     * Parameters:
     * layersCfg - {Array}
     *
     * Returns:
     * {Object} a hash with keys "WMS" and "WMTS" indexing arrays of
     *          unique OGC server URLs
     */
    getUniqueOGCServers: function(layersCfg) {
        var t = {
            "WMS": [],
            "WMTS": []
        };
        Ext.each(layersCfg, function(item) {
            if (item.url && t[item.type] && t[item.type].indexOf(item.url)< 0) {
                t[item.type].push(item.url);
            }
        });
        return t;
    },

    /**
     * Method: updateLayerStore
     * Handles addition of records to LayersInit's main layerStore
     *
     * Parameters:
     * stores - {Object} Hash containing stores keyed by server url
     */
    updateLayerStore: function(stores) {
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
                // Not sure this is really useful:
                if(item.url.indexOf('gwc') > 0) {
                    record.set('type', 'GWC');
                }
                // set metadataURLs in record, data comes from GeoNetwork
                // FIXME: could probably be obtained from capabilities document
                if (item.metadataURLs) {
                    record.set("metadataURLs", item.metadataURLs);
                }
                records.push(record);
            } else if (item.type == "XYZ") {
                // TODO
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
    createStores: function(servers) {
        var count = servers["WMS"].length + servers["WMTS"].length;
        var stores = {};
        var capabilitiesCallback = function() {
            count -= 1;
            if (count === 0) {
                this.updateLayerStore(stores);
            }
        };
        Ext.each(servers["WMS"], function(url) {
            GEOR.waiter.show();
            var u = GEOR.util.splitURL(url);
            stores[url] = new GEOR.ows.WMSCapabilities({
                storeOptions: {
                    url: u.serviceURL.replace(':443', '')
                },
                baseParams: u.params,
                success: capabilitiesCallback,
                failure: capabilitiesCallback,
                scope: this
            });
        }, this);
        Ext.each(servers["WMTS"], function(url) {
            GEOR.waiter.show();
            var u = GEOR.util.splitURL(url);
            stores[url] = new GEOR.ows.WMTSCapabilities({
                storeOptions: {
                    url: u.serviceURL.replace(':443', '')
                },
                baseParams: u.params,
                success: capabilitiesCallback,
                failure: capabilitiesCallback,
                scope: this
            });
        }, this);
    },

    /**
     * Method: loadLayers
     * Load layers from capabilities documents
     */
    loadLayers: function() {
        var servers = this.getUniqueOGCServers(this.layersCfg);
        this.createStores(servers);
    },

    constructor: function(config) {
        Ext.apply(this, config);
        this.layerStore = new GeoExt.data.LayerStore();

        this.addEvents('load');

        GEOR.LayersInit.superclass.constructor.apply(this, arguments);
    }
});
