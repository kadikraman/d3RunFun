(function(){

    // set the size of the graph
    var w = 1000,
        h = 400,
        pad = 20,
        left_pad = 100,
        data_path = 'kroutedataall.json';

    // define the scatterplot area
    var svg = d3.select("#punchcard")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

    // set the scales. x-scale between 0 and 23 (hours in a day); y scale between 0 and 7 (days in a week)
    var x = d3.scale.linear().domain([0, 23]).range([left_pad, w-pad]);
    var y = d3.scale.linear().domain([0, 6]).range([pad, h-pad*2]);

    // define the axis
    var xAxis = d3.svg.axis().scale(x).orient("bottom")
            .ticks(24)
            .tickFormat(function (d, i) { // time for x-axis
                return d+':00';
            }),
        yAxis = d3.svg.axis().scale(y).orient("left")
            .ticks(7)
            .tickFormat(function (d, i) { // days for y-axis
                return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][d];
            });

    // define the tooltip (displayed on-hover later)
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .text("a simple tooltip");

    // draw the x axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, "+(h-pad)+")")
        .call(xAxis);

    // draw the y-axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate("+(left_pad-pad)+", 0)")
        .call(yAxis);

    // display a loading screen when loading the data. good practice for when loading data asyncly
    svg.append("text")
        .attr("class", "loading")
        .text("Loading ...")
        .attr("x", function () { return w/2; })
        .attr("y", function () { return h/2-5; });

    // load and display the data
    d3.json(data_path, function (punchcard_data) {

        // scale for the ratius of the circles
        var r = d3.scale.linear()
                .domain([0, d3.max(punchcard_data, function (d) { return d["distance"]; })])
                .range([0, 22]);
        
        // remove the loading text
        svg.selectAll(".loading").remove();
        
        // add circles to page
        svg.selectAll("circle")
            .data(punchcard_data)
            .enter()
            .append("circle")
            .attr("class", "circle")
            .attr("cx", function (d) { return x( getHourFromDateString(d["started"])) })
            .attr("cy", function (d) { return y( getDayFromDateString(d["started"])) })
            .on("mouseover", function(d){
                d3.select(this).attr({"class": "circle-mouseover"});
                return tooltip.style("visibility", "visible").text(generateTooltipText(d));
            })
            .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
            .on("mouseout", function(d){
                d3.select(this).attr({"class": "circle"});
                return tooltip.style("visibility", "hidden");
            })
            .transition()
            .duration(800)
            .attr("r", function (d) { return r(d["distance"]); });
    });


    // helper: get day of the week from date string in the form YYYY-MM-DD HH:MM:SS
    // returns 0 for Monday, 1 for Tuesday etc
    function getDayFromDateString(dateString){
        var date = new Date(dateString);

        // fixing the off-by-one due to american conventions of starting week with Sunday
        if(date.getDay()==0)
            return 6;
        else
            return date.getDay() - 1;
    }

    // returns hour + (minutes map to [0;99])/100 (e.g. for 12:30 would return 12.5)
    function getHourFromDateString(dateString){
        var date = new Date(dateString);
        return date.getHours() + min(date.getMinutes())/100;
    }

    // there's definitely an easier way to do this. Using a d3 scale to map min to [0;99]
    var min = d3.scale.linear().domain([0, 60]).range([0, 99]);

    // generates the tooltip text from the run data of individual run
    function generateTooltipText(run){
        var text = '';
        var date = new Date(run["started"]);
        return date.toDateString() + ' ' + 
        date.getHours() + ':' + (date.getMinutes() < 9 ? '0' + date.getMinutes() : date.getMinutes()) + ' ' + 
        (run["distance"] / 1000).toFixed(2) + 'km';
    }
})();