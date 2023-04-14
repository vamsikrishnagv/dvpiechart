let checkinData;
//draw a pie chart with default values
document.addEventListener('DOMContentLoaded', function () {
    loadCheckInDataAndDrawChart();
});

//loads the checkin data from the csv file
function loadCheckInDataAndDrawChart() {
    // Load the CSV data
    d3.csv("checkinJournal_clustered.csv", function (d) {
        // Parse the timestamp string into a Date object
        d.timestamp = d3.timeParse("%Y-%m-%dT%H:%M:%SZ")(d.timestamp);
        // Convert the clusterId string to an integer
        d.clusterId = +d.clusterId;
        // Return the parsed object
        return d;
    }).then(function (data) {
        // Store the data in a variable
        checkinData = data;
        pieChart("2022-03-01", "2022-03-02");
    });
}

//pie chart is drawn
function pieChart(startDate, endDate) {
    // Select the SVG element containing the pie chart, if it exists
    const existingSvg = d3.select("#my_dataviz svg");
    // If the SVG element exists, remove it
    if (!existingSvg.empty()) {
        existingSvg.remove();
    }
    const data = generatePieData(startDate, endDate);
    // set the dimensions and margins of the graph
    const width = 450,
        height = 450,
        margin = 40;
    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    const radius = Math.min(width, height) / 2 - margin
    // append the svg object to the div called 'my_dataviz'
    const svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // set the color scale
    const color = d3.scaleOrdinal()
        .range(d3.schemeSet2);
    // Compute the position of each group on the pie:
    const pie = d3.pie()
        .value(function (d) {
            return d[1]
        })
    const data_ready = pie(Object.entries(data));
    // Now I know that group A goes from 0 degrees to x degrees and so on.
    // shape helper to build arcs:
    const arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Add a tooltip
    const tooltip = d3.select("#tooltip");
    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
        .selectAll('mySlices')
        .data(data_ready)
        .join('path')
        .attr('class', 'slice')
        .attr('d', arcGenerator)
        .attr('fill', function (d) {
            return (color(d.data[0]))
        })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on('mouseover', function (event, d) {
            const data = d3.select(this).datum();
            d3.select(this)
                .style("stroke-width", "4px")
                .style('opacity', 1);
            tooltip
                .style("opacity", 1)
                .html(`Area ${data.data[0]}: ${data.data[1]} check-ins`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on('mouseout', function (d) {
            d3.select(this)
                .style("stroke-width", "2px")
                .style('opacity', 0.7);
            tooltip
                .style("opacity", 0);
        });
    // Now add the annotation. Use the centroid method to get the best coordinates
    svg
        .selectAll('mySlices')
        .data(data_ready)
        .join('text')
        .text(function (d) {
            return "Area " + d.data[0]
        })
        .attr("transform", function (d) {
            return `translate(${arcGenerator.centroid(d)})`
        })
        .style("text-anchor", "middle")
        .style("font-size", 17);

    // Add a title to the chart
    svg.append("text")
        .attr("x", 0)
        .attr("y", -height / 2 + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .text("CheckIns by Area");
}

// Define a function to filter the data based on start and end dates
function generatePieData(startDate, endDate) {
    // Parse the start and end dates using d3.timeParse() function
    const parseTime = d3.timeParse("%Y-%m-%d");
    const start_date = parseTime(startDate);
    const end_date = parseTime(endDate);
    // Filter the data based on the timestamp column
    const filtered_data = checkinData.filter((d) => {
        const timestamp = d.timestamp;
        return timestamp >= start_date && timestamp <= end_date;
    });
    // Count the number of check-ins in each cluster
    const clusterCounts = d3.rollup(filtered_data, (v) => v.length, (d) => d.clusterId);
    // Convert the cluster counts to an object with cluster IDs as keys and counts as values
    const data = Object.fromEntries(clusterCounts);
    return data;
}

function update() {
    pieChart("2022-03-01", "2022-03-06");
}