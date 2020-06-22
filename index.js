const express = require('express')
const fs = require('fs')
const fetch = require('node-fetch')
const cors = require('cors')
const bodyParser = require('body-parser')

let rawdata = fs.readFileSync('countries.json')
let countries = JSON.parse(rawdata)
let geojson = {}

const app = express()
const port = process.env.PORT || 8080

app.use(cors())
app.use(bodyParser.json());



app.get('/', function (req, res) {

    fetch('https://api.covid19api.com/summary')
        .then(res => res.json())
        .then(result => {
            var data = []
            const dataCountriesCovid = result.Countries
            countries.forEach(country => {
                resultCheck = dataCountriesCovid.find(item => item.CountryCode == country.country)
                if (resultCheck) {
                    var dataTemp = {...resultCheck, ...country}
                    var featuresTemp = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [country.longitude, country.latitude]
                        },
                        properties: {
                            title: resultCheck.Country,
                            description: `<p><strong>Total Confirmed:</strong>${resultCheck.TotalConfirmed}</p><p><strong>Total Deaths:</strong> ${resultCheck.TotalDeaths}</p>`
                        }
                    }
                    data.push(dataTemp)

                }

            });
            res.send(data)
        })
})

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`)
})