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
            map : undefined,
            lng: 106.660172,
            lat: 10.762622,
            zoom: 2,
            dotSize: 100,
            covidData: [],
            geoData: [],
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

        map.on('load',  () => {
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

    flyToCountry(map, coordinates) {
        map.flyTo({
            center: coordinates,
            zoom: 5
        })
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
                            description: `<p><strong>Total Confirmed: </strong>${item.TotalConfirmed}</p><p><strong>Total Deaths: </strong>${item.TotalDeaths}</p>`
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
            this.setState({map: this.map})
            this.createMap(this.map)
    }


    render() {
        var map = this.state.map != undefined ? this.state.map : ''
    
        return (
            <div className="row">
                <div ref={this.mapRef} className="mapContainer pad2" />
                <div className="sidebar pad2">
                    <div className="heading">
                        <h1></h1>
                    </div>
                    <div id="listings" className="listings">
                        {map != "" ? 
                        <div>
                            {this.state.covidData.map((country, index) =>
                            <div className="item" key={index}>
                                <a onClick={() => this.flyToCountry(map, [country.longitude, country.latitude])} className="title" href="#">{country.Country}</a>
                                <div>{country.TotalConfirmed}</div>
                            </div>
                        )}
                
                            </div>
                        :    
                        ''
                    }
                        
                    
                        
                    </div>
                </div>
            </div>
        )
    }
}