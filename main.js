mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v10",
    center: [4.5, 45.5],
    zoom: 7,
});
let activeDeptId = null;

map.on("load", async () => {
    const csvData = await fetch("/data/air_data_aurat_2016_2018.csv").then(
        (response) => response.text()
    );
    let pollutionByDept = {},
        lineFields,
        csvLines = csvData.split("\n").slice(1);
    for (const line of csvLines) {
        lineFields = line.split(";");
        pollutionByDept[lineFields[0]] = parseFloat(lineFields[1]);
    }

    fetch("https://france-geojson.gregoiredavid.fr/repo/departements.geojson")
        .then((response) => response.json())
        .then((geojsonData) => {
            for (const f of geojsonData.features) {
                f.properties.pollution = pollutionByDept[f.properties.nom];
            }
            map.addSource("departements", {
                type: "geojson",
                data: geojsonData,
                generateId: true,
            });

            map.addLayer({
                id: "departements-fills",
                type: "fill",
                source: "departements",
                layout: {},
                paint: {
                    "fill-color": [
                        "case",
                        [">", ["get", "pollution"], 11],
                        "#bc4749",
                        [">", ["get", "pollution"], 10],
                        "#c86769",
                        [">", ["get", "pollution"], 9],
                        "#f2e8cf",
                        [">", ["get", "pollution"], 8],
                        "#a7c957",
                        ["<", ["get", "pollution"], 8],
                        "#386641",
                        "#077",
                    ],
                    "fill-opacity": [
                        "case",
                        ["boolean", ["feature-state", "hover"], false],
                        0.6,
                        0.4,
                    ],
                },
            });

            map.addLayer({
                id: "departements-borders",
                type: "line",
                source: "departements",
                layout: {},
                paint: {
                    "line-color": "#888",
                    "line-width": 2,
                },
            });

            map.on("mousemove", "departements-fills", (e) => {
                if (e.features.length > 0) {
                    if (activeDeptId !== null) {
                        map.setFeatureState({
                            source: "departements",
                            id: activeDeptId
                        }, {
                            hover: false
                        });
                    }
                    activeDeptId = e.features[0].id;
                    map.setFeatureState({
                        source: "departements",
                        id: activeDeptId
                    }, {
                        hover: true
                    });
                }
            });

            map.on("mouseleave", "departements-fills", () => {
                if (activeDeptId !== null) {
                    map.setFeatureState({
                        source: "departements",
                        id: activeDeptId
                    }, {
                        hover: false
                    });
                }
                activeDeptId = null;
            });
        });
});