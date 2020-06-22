import React from 'react';

import Chart from "react-google-charts";

export default class Map extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            data: []
        }
    }

    componentDidMount() {
        fetch("https://api.covid19api.com/summary")
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        isLoaded: true,
                        data: result.Countries
                    });
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    this.setState({
                        isLoaded: true,
                        error
                    });
                }
            )
    }

    render() {
        const { error, isLoaded, data } = this.state;
        var Countries  = data.map(( item ) => ( item.CountryCode ));
        var TotalConfirmed = data.map((item) => ( item.TotalConfirmed ))
        var mapData = [['Country', 'Total Confirmed']]
        Countries.forEach(function(country) {
            const addingArray = [country, TotalConfirmed[Countries.indexOf(country)]]
            console.log(addingArray)
            mapData.push(addingArray)
        })

        console.log(mapData)


        if (error) {
            return <div>Error: {error.message}</div>;
        } else if (!isLoaded) {
            return <div>Loading...</div>;
        } else {
            return (
                <div>
                    <Chart
                        width={'80%'}
                        height={'auto'}
                        chartType="GeoChart"
                        data={mapData}
                        // Note: you will need to get a mapsApiKey for your project.
                        // See: https://developers.google.com/chart/interactive/docs/basic_load_libs#load-settings
                        options={{
                            colorAxis: { colors: ['red']},
                            backgroundColor: '#81d4fa',
                        }}
                        mapsApiKey="AIzaSyC-6XmXJFkRnXN4QMT74qR50pgyFAalnpE"
                        rootProps={{ 'data-testid': '1' }}
                    />
                </div>
            );
        }
    }

}