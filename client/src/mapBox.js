import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';

require('dotenv').config()

mapboxgl.accessToken = process.env.REACT_APP_MAP_BOX_TOKEN;



export default class MapBox extends React.Component {
    mapRef = React.createRef();
    map;
    constructor(props) {
        super(props);
        this.state = {
            map: undefined,
            lng: 106.660172,
            lat: 10.762622,
            zoom: 2,
            dotSize: 100,
            covidData: [],
            geoData: [],
            summary: {},
            testdata: [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [1.601554, 42.546245]
                    },
                    "properties": {
                        "title": "Andorra",
                        "description": "<strong>Total Confirmed:</strong><p>855</p><strong>Total Deaths:</strong> <p>52</p>"
                    }
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [0, 1]
                    },
                    "properties": {
                        "title": "Andorra",
                        "description": "<strong>Total Confirmed:</strong><p>855</p><strong>Total Deaths:</strong> <p>52</p>"
                    }
                }

            ]
        }

    }

    fetchSummary() {
        fetch('https://api.covid19api.com/summary')
            .then(res => res.json())
            .then(result => {
                this.setState({ summary: result.Global })
            })
    }

    fetchCovid19API() {
        fetch('http://localhost:8080/')
            .then(res => res.json())
            .then(result => {
                result.forEach(item => {
                    var tempJson = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [item.longitude, item.latitude]
                        },
                        properties: {
                            title: item.Country,
                            description: `<p><strong>Total Confirmed: </strong>${item.TotalConfirmed}</p><p><strong>Total Deaths: </strong>${item.TotalDeaths}</p>`
                        }
                    }
                    var joined = this.state.geoData.concat(tempJson)
                    this.setState({ covidData: result, geoData: joined })
                })
                this.createMap(this.state.geoData)
            })

    }

    createMap(map) {

        const dotSize = this.state.dotSize
        const geoData = this.state.geoData

        map.on('load', () => {
            map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
            map.addSource('points', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': geoData
                }
            });


            map.addLayer({
                'id': 'points',
                'type': 'symbol',
                'source': 'points',
                'layout': {
                    'icon-image': 'pulsing-dot'
                }
            });

            map.on('click', 'points', function (e) {
                var coordinates = e.features[0].geometry.coordinates.slice();
                var description = e.features[0].properties.description;

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new mapboxgl.Popup({ className: "pop-up-map-box" })
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            });
            map.on('mouseenter', 'points', function () {
                map.getCanvas().style.cursor = 'pointer';
            });

            // Change it back to a pointer when it leaves.
            map.on('mouseleave', 'points', function () {
                map.getCanvas().style.cursor = '';
            });

        });

        const pulsingDot = {
            width: dotSize,
            height: dotSize,
            data: new Uint8Array(dotSize * dotSize * 4),
            onAdd: function () {
                var canvas = document.createElement('canvas');
                this.context = canvas.getContext('2d');
            },
            render: function () {
                var duration = 2000;
                var t = (performance.now() % duration) / duration;

                var radius = (dotSize / 2) * 0.3;
                var outerRadius = (dotSize / 2) * 0.7 * t + radius;
                var context = this.context;

                // draw outer circle
                context.clearRect(0, 0, this.width, this.height);
                context.beginPath();
                context.arc(
                    this.width / 2,
                    this.height / 2,
                    outerRadius,
                    0,
                    Math.PI * 2
                );
                context.fillStyle = 'rgba(255, 200, 200,' + (1 - t) + ')';
                context.fill();

                // draw inner circle
                context.beginPath();
                context.arc(
                    this.width / 2,
                    this.height / 2,
                    radius,
                    0,
                    Math.PI * 2
                );
                context.fillStyle = 'rgba(255, 100, 100, 1)';
                context.strokeStyle = 'white';
                context.lineWidth = 2 + 4 * (1 - t);
                context.fill();
                context.stroke();

                // update this image's data with data from the canvas
                this.data = context.getImageData(
                    0,
                    0,
                    this.width,
                    this.height
                ).data;

                // continuously repaint the map, resulting in the smooth animation of the dot
                map.triggerRepaint()
                // return `true` to let the map know that the image was updated
                return true;
            }
        }



    }

    flyToCountry(map, coordinates, description) {
        map.flyTo({
            center: coordinates,
            zoom: 5
        })

        new mapboxgl.Popup({ className: "pop-up-from-list" })
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);

    }


    async componentDidMount() {
        await fetch('http://localhost:8080/')
            .then(res => res.json())
            .then(result => {
                result.forEach(item => {
                    var tempJson = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [item.longitude, item.latitude]
                        },
                        properties: {
                            title: item.Country,
                            description: `<h5>${item.Country}</h5><p><strong>Total Confirmed: </strong>${item.TotalConfirmed}</p><p><strong>Total Deaths: </strong>${item.TotalDeaths}</p>`
                        }
                    }
                    var joined = this.state.geoData.concat(tempJson)
                    this.setState({ covidData: result, geoData: joined })
                })
            })
        this.map = new mapboxgl.Map({
            container: this.mapRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [this.state.lng, this.state.lat],
            zoom: this.state.zoom
        });
        this.setState({ map: this.map })
        this.createMap(this.map)
        this.fetchSummary()
    }


    render() {
        var map = this.state.map != undefined ? this.state.map : ''
        var popUpDescription = function (country, totalConfirmed, totalDeaths) {
            return `<h5>${country}</h5><p><strong>Total Confirmed: </strong>${totalConfirmed}</p><p><strong>Total Deaths: </strong>${totalDeaths}</p>`
        }


        return (
            <div className="row">
                <div ref={this.mapRef} className="mapContainer pad2" />
                <div className="sidebar pad">
                    {this.state.summary != "" ?
                        <div  className="heading pad2">
                            <h3>COVID-19 TRACK MAP</h3>
                            <h4 style={{color: 'red'}}>World</h4>
                            <div style={{padding: '10px'}} class="statistic">
                                <div>
                                    <i className="fas fa-briefcase-medical stat-icon"></i><p>Total Cases: {this.state.summary.TotalConfirmed}</p>

                                </div>
                                <div>
                                    <i className="fas fa-skull stat-icon"></i><p>Total Deaths: {this.state.summary.TotalDeaths}</p>

                                </div>

                                <div>
                                    <i className="fas fa-plus-square stat-icon"></i><p>Total Recovered: {this.state.summary.TotalRecovered}</p>

                                </div>

                            </div>
                        </div>
                        :
                        ''
                    }
                    <div id="listings" className="listings pad2">
                        {map != "" ?
                            <div>
                                {this.state.covidData.map((country, index) =>
                                    <div className="item" key={index}>
                                        <a onClick={() => this.flyToCountry(map, [country.longitude, country.latitude], popUpDescription(country.Country, country.TotalConfirmed, country.TotalDeaths))} className="title" href="#">{country.Country}</a>
                                        <div class="statistic">
                                            <div>
                                                <i className="fas fa-briefcase-medical stat-icon"></i><p>Cases: {country.TotalConfirmed}</p>

                                            </div>
                                            <div>
                                                <i className="fas fa-skull stat-icon"></i><p>Deaths: {country.TotalDeaths}</p>

                                            </div>

                                            <div>
                                                <i className="fas fa-plus-square stat-icon"></i><p>Recovered: {country.TotalRecovered}</p>

                                            </div>

                                        </div>

                                    </div>
                                )}

                            </div>
                            :
                            ''
                        }



                    </div>
                    <div id="author-info">
                        <a target="_blank" href="https://github.com/hungthezorba?tab=repositories">
                            <div id="github-icon-holder" className="column">
                                <i className="fab fa-github info-icon fa-2x"></i>
                            </div>
                        </a>
                        <a target="_blank" href="https://github.com/hungthezorba?tab=repositories">
                            <div id="facebook-icon-holder" className="column">
                                <i id="facebook-icon" className="fab fa-facebook-f info-icon fa-2x"></i>
                            </div>
                        </a>
                        <a target="_blank" href="https://github.com/hungthezorba?tab=repositories">
                            <div id="twitter-icon-holder" className="column">
                                <i id="twitter-icon" className="fab fa-twitter info-icon fa-2x"></i>

                            </div>
                        </a>
                    </div>
                </div>
            </div>
        )
    }
}