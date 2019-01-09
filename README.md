OpacitySlider ADDON
===================

This addon allows users to manage background layers (WMS/WMTS/XYZ) into mapfishapp.

A slider between 2 comboboxes of opaque layers allows the user to switch the
transparency between 2 base layers. It also restricts the use of the manageLayers
panel to behave like a fully integrated background layers panel.

author: @fgravin

The addon config should look like this:

```json
{
    "id": "opacityslider_0",
    "name": "OpacitySlider",
    "title": {
        "en": "Map opacity slider",
        "es": "Map opacity slider",
        "fr": "Opacité fonds de carte"
    },
    "description": {
        "en": "Opacity Slider between two lists of background layers",
        "es": "Opacity Slider between two lists of background layers",
        "fr": "Slider gérant un fondu transparent entre 2 couches de fonds choisies parmi des listes"
    },
    "options": {
        "backgroundColor": "rgba(0, 108, 167, 0.5)",
        "layers": [{
            "url": [
                "http://a.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy/${z}/${x}/${y}.png",
                "http://b.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy/${z}/${x}/${y}.png",
                "http://c.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy/${z}/${x}/${y}.png",
                "http://d.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy/${z}/${x}/${y}.png"
            ],
            "title": "Natural Earth",
            "attribution": "Tiles &copy; <a href='http://mapbox.com/'>MapBox</a>",
            "type": "XYZ"
        },{
            "url": "https://www.geograndest.fr/geoserver/gwc/service/wmts",
            "name": "region-grand-est:CRL_ORTHORVB_2015_54_TIFA_L93",
            "type": "WMTS",
            "title": "Ortho 2015"
        },{
            "url": "http://osm.geobretagne.fr/gwc01/service/wms",
            "type": "WMS",
            "name": "osm:google",
            "title": "OSM style Google"
        }]
    }
}
```

Note that layer title is not mandatory.
If not provided, it's obtained from the capabilities document.
