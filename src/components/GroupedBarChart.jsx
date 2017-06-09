import * as d3 from "d3";
import React, { Component } from "react";
import { connect } from "react-redux";

import { REGION_SELECTED } from "./Map.jsx";

import idToName from "../../datafiles/idToName.json";

import "./GroupedBarChart.styl";

const name_to_id = {
  "North East": "E15000001",
  "North West": "E15000002",
  "Yorkshire & the Humber": "E15000003",
  "East Midlands": "E15000004",
  "West Midlands": "E15000005",
  Eastern: "E15000006",
  London: "E15000007",
  "South East": "E15000008",
  "South West": "E15000009"
};


const setFontSizeAndColour = (selection, size) => {
  // Sets a consistent font family for all the text
  selection.style("font-family", "Oswald").style("font-size", `${size}px`);
}

const getWidthOfText = (txt, fontname, fontsize) =>{
  // Create dummy span
  this.e = document.createElement('span');
  // Set font-size
  this.e.style.fontSize = fontsize;
  // Set font-face / font-family
  this.e.style.fontFamily = fontname;
  // Set text
  this.e.innerHTML = txt;
  document.body.appendChild(this.e);
  // Get width NOW, since the dummy span is about to be removed from the document
  var w = this.e.offsetWidth;
  // Cleanup
  document.body.removeChild(this.e);
  // All right, we're done
  return w;
}


const textWrap = (text, width, y, dy) => {
  // This needs work. I'm pretty sure it's just splitting each word into a aseparate line rather than grouping
  // the words into strings shorter than the length. EG Yorkshire /n & /n the /n Humber

  // Takes a string, target width, y value and dy value, then returns a list of textspan objects
  // with the string broken down into words, one in each textspan object and positione vertically
  // Adapted from Mike Bostock's version which works on the element rather than the raw string
  var words = text.split(/\s+/).reverse(), //reverse the list so when the words are popped from the end, they come out in the right order
    word,
    line=[],
    lineNumber = 0,
    lineHeight = 1.1,
    output = [];

  // Basically 'while True', but runs until words is empty
  while((word = words.pop())){
    line.push(word);
    let _text = line.join(" ");
    if (getWidthOfText(_text, 'Arial', 12) > width){ // if the resulting string is longer than allowed:
      line.pop(); // remove the element we just added
      _text = line.join(" "); // then re-create the text for the textspan off the shorter text
      line = [word];
      // put the tspan to the output
      output.push(<tspan x={0} y={y} dy={lineNumber * lineHeight + dy + "em"}>{word}</tspan>)
      lineNumber ++;
    }
    else{
      // otherwise if the word isn't longer then we stil output it
      output.push(<tspan x={0} y={y} dy={lineNumber * lineHeight + dy + "em"}>{word}</tspan>)
      lineNumber ++;
    }
  }
  return output;
}


class Legend extends Component {
  // Creates the legend items as a React Component. 
  // Takes a list of legend items and a D3 colorscale, returns a labelled legend
  render(){
    // map the legend range to the number of legend items, then create the scale
    let legendRangeMax = (this.props.legendItems.length * 20) + 10;
    let legendY = d3.scaleBand().domain(this.props.legendItems).range([10, legendRangeMax]);

    let legendColours = this.props.legendColours;
    // make a list of the legend boxes
    this.legendItems = this.props.legendItems.map(function(y){
      return (
        <rect width={12}
              height={12}
              key={y}
              className={`legend-box _${y}`}
              fill={legendColours(y)}
              transform={`translate(20, ${legendY(y)})`} />
      );
    });
    // make a list of the text to be positioned by each legend component
    this.legendText = this.props.legendItems.map(function(y){
      return (
        <text textAnchor={"left"}
              dy={"0.7em"}
              key={y}
              className={`legend-text _${y}`}
              transform={`translate(36, ${legendY(y)})`}>{y}</text>
      );
    })

    // render() function returns this top level object, filled with <rect>s and <text>s
    return (
      <g transform={`translate(${this.props.margin.l}, ${this.props.margin.t})`}
          className={"legend"}>
          {this.legendItems}
          {this.legendText}
      </g>
    );
  }
}


class _xAxis extends Component{
  // Creates the x-axis path, ticklabels and tickmarks as react components
  render(){
    let xScale = this.props.xScale,
      ticks;
    
    // create a list of the tick objects for a grouped scale
    if (this.props.scaleType === 'group'){
      ticks = this.props.xScale.domain().map(function(r){
        // calculate the textSpans for each region using the function defined above
        let textSpans = textWrap(r, xScale.bandwidth(), 9, 0.71);
        return (
          // for each of the xValues, we need to return a tick, composed of a tickline and a ticklabel (itself comprising multiple textspans)
          <g className={"tick"}
              opacity={1}
              transform={`translate(${xScale(r) + (xScale.bandwidth() / 2)}, 0)`}>
            <line stroke={"#000"}
                  y2={6}/>
            <text y={9}
                  dy={"0.71em"}
                  textAnchor={"middle"}>
                  {textSpans}
            </text>
          </g>
        )
      })
    }

    else if (this.props.scaleType === 'linear'){
      ticks = xScale.domain().map(function(t){ // we want ten ticks (or thereabouts, D3 will look after us)
        return (
          // Creates a gridline for the whole chart, then a small ticklabel and the accompanying text
          <g className={"tick"}
                opacity={1}
                transform={`translate(${xScale(t)}, 0)`}>
              <line stroke={"#000"}
                    y2={6}/>
              <text y={9}
                    dy={"0.71em"}
                    textAnchor={"middle"}>{t}
              </text>
            </g>
        )
      })
    }
    

    // Render function returns the axis object, with a path and ticks for each category value
    return (
    <g className={"axis x"}
        transform={`translate(${this.props.margin.l}, ${this.props.chartHeight + this.props.margin.t})`}> 
        <path className={"domain"}
              fill={'none'}
              stroke={'#000'}
              d={`M0.5,6V0.5H${this.props.chartWidth + 0.5}V6`} />
        {ticks}
    </g>);
  }
}


class _yAxis extends Component{
  // Creates the xAxis path, ticks and ticklabels
  render(){
    let yScale = this.props.yScale,
      chartWidth = this.props.chartWidth,
      f = d3.formatPrefix(".0", 1e6); //create the format which takes the million-zeroes and replaces them with an 'M'

    let ticks = yScale.ticks(10).map(function(t){ // we want ten ticks (or thereabouts, D3 will look after us)
      return (
        // Creates a gridline for the whole chart, then a small ticklabel and the accompanying text
        <g className={"tick"}
            opacity={1}
            transform={`translate(0, ${yScale(t) + 0.5})`}>
          <line stroke={"#000"}
                x2={chartWidth}></line>
          <line stroke={"#000"}
                className={"solid"}
                x2={-6}></line>
          <text x={-3} 
                transform={"translate(-10,0)"}
                dy={"0.32em"}
                textAnchor={"end"}>£{f(t)}</text> 
        </g>
      )
    })
    console.log(this.props.chartHeight);
    return (
      // Returns the axis path and ticks
    <g className={"axis y"}
        transform={`translate(${this.props.margin.l}, ${this.props.margin.t})`}> 
        <path className={"domain"}
              fill={'none'}
              stroke={'#000'}
              d={`M-6,${this.props.chartHeight + 0.5}H0.5V0.5H-6`} />
        {ticks}
    </g>);
  }
}




class GroupedBarChart extends Component {

  getData(data) {
    // Pre-summarised data should be passed in as a prop. This cleans it up a little as, gets the max, years and regions
    let ExpensesData = [], regions = [], years = [];

    Object.keys(data).forEach(function(k) {
      if (k !== "default") {
        ExpensesData.push(data[k]);
        regions.push(data[k].region);
        data[k].values.forEach(function(v) {
          if (!years.includes(v.year)) {
            years.push(v.year);
          }
        });
      }
    });
    // get the max and round it up to the next million
    this.yMax =
      Math.ceil(
        d3.max(ExpensesData, function(d) {
          return d3.max(d.values, function(v) {
            return v.paid;
          });
        }) / 1000000
      ) * 1000000;
    this.regions = regions;
    this.years = years.sort();
    this.chartData = ExpensesData;
  }


  

  setColours(current, comparison, positive, negative) {
    // Changes the colour of the bars based on hover
    let currentClassName = current.split(" ")[1];
    let returnVal = null;
    if (currentClassName === comparison) {
      return positive;
    } else {
      return negative;
    }
  }

  setInteractions() {
    // Sets up the hover interactions on the chart
    let colorScale = this.colors;
    let svg = this._svg;
    let setColours = this.setColours;

    this.years.forEach(function(e, i) {
      let className = e;
      svg
        .selectAll(`._${className}`)
        .on("mouseover", function() {
          //Only the bar and corresponding legend items are coloured in on hover
          let innerClass = this.className.baseVal.split(" ")[1];
          //All of the bars should be coloured in the corresponding Year colour or in grey if they are not selected
          svg
            .selectAll(".bar")
            .attr("fill", function() {
              return setColours(
                this.className.baseVal,
                innerClass,
                colorScale(innerClass),
                "#d3d3d3"
              );
            })
            // And the greyed out ones shouldn't have an outline
            .style("stroke", function() {
              return setColours(
                this.className.baseVal,
                innerClass,
                "#333",
                "none"
              );
            });
          // And the legend texts should also be greyed out as well
          svg.selectAll(`.legend-text`).style("fill", function() {
            return setColours(
              this.className.baseVal,
              innerClass,
              "black",
              "#d3d3d3"
            );
          });
          // And the legend boxes should be greyed out for those that aren't selected
          svg.selectAll(`.legend-box`).style("fill", function() {
            return setColours(
              this.className.baseVal,
              innerClass,
              colorScale(innerClass),
              "#d3d3d3"
            );
          });
        })
        // Change the colour to what it was before
        .on("mouseout", function() {
          svg
            .selectAll(".bar")
            .attr("fill", function() {
              // set the colour of the bars using the colourscale we previously created
              return colorScale(this.className.baseVal.split(" ")[1]);
            })
            .style("stroke", "#333");
          svg.selectAll(`.legend-text`).style("fill", "black");
          svg.selectAll(".legend-box").style("fill", function() {
            // Set the colour of the legend boxes as well
            return colorScale(this.className.baseVal.split(" ")[1]);
          });
        });
    });
  }

  setSize() {
    this._svg.style("width", this.props.width); 
    this._svg.style("height", this.props.height);

    this._chartLayer
      .attr("width", this.chartWidth)
      .attr("height", this.chartHeight)
      .attr("transform", `translate(${this.props.margin.l}, ${this.props.margin.t})`);
  }

  componentDidMount() {
    this.axisLayer = this._svg
      .append("g"), 
    this._chartLayer = this._svg
      .append("g");

    this.setSize();

    // rescope these variables for use in a function later on
    let colorScale = this.colors,
      xScale = this.xScale,
      xInScale = this.xInScale,
      yScale = this.yScale,
      chartHeight = this.chartHeight;

    // draws the bars
    let outer = this._chartLayer.selectAll(".outer").data(this.chartData);
    let inner = outer.enter().append("g").attr("class", "region");

    //position the bar groups based on the xScale
    outer.merge(inner).attr("transform", function(d) {
      return `translate(${xScale(d["region"])}, 0)`;
    });

    // bind the list of yearly expenses to each region goup
    let bar = inner.selectAll(".bar").data(function(d) {
      return d.values;
    });
    // Now create the bars for each year
    let newBar = bar.enter().append("rect").attr("class", "bar");
    bar
      .merge(newBar)
      .attr("width", xInScale.bandwidth())
      .attr("height", 0)
      .attr("fill", function(d) {
        return colorScale(`_${d["year"]}`); // Colour the bar
      })
      .attr("class", function(d) {
        return `bar _${d["year"]}`; // Set the class so it can be selected later
      })
      .attr("transform", function(d) {
        return `translate(${xInScale(d["year"])}, ${chartHeight})`; // move the bar using the inner scale
      });

    // Create the initial animation
    let t = d3.transition().duration(1000).ease(d3.easeLinear); 
    bar
      .merge(newBar)
      .transition(t)
      .attr("height", function(d) {
        return chartHeight - yScale(d.paid);
      })
      .attr("transform", function(d) {
        return `translate(${xInScale(d["year"])}, ${yScale(d.paid)})`;
      });

    this.setInteractions();
  }

  render() {
    // get the data into the right shape, getting the min and max
    this.getData(this.props.data);

    // Calculate the height and width using the margins
    this.chartHeight = this.props.height - this.props.margin.t - this.props.margin.b;
    this.chartWidth = this.props.width - this.props.margin.l - this.props.margin.r;
    let chartHeight = this.chartHeight, 
      chartWidth = this.chartWidth;

    // Set up the scales - colour scale, xScale, xInScale, yScale
    this.colors = d3
      .scaleOrdinal()
      .range([
        "rgb(242,51,135)",
        "rgb(108,73,75)",
        "rgb(237,127,97)",
        "rgb(215,5,13)",
        "rgb(144,45,84)",
        "rgb(164,62,3)"
      ])
      .domain(
        this.years.map(function(y) {
          return `_${y}`;
        })
      );
    this.xScale = d3
      .scaleBand()
      .domain(this.regions)
      .paddingInner(0.1)
      .paddingOuter(0.01)
      .range([0, chartWidth]);
    this.xInScale = d3
      .scaleBand()
      .domain(this.years)
      .range([0, this.xScale.bandwidth()]);
    this.yScale = d3
      .scaleLinear()
      .domain([0, this.yMax])
      .range([chartHeight, 0]);

    // Some of Drummond's clever stuff here
    if (this._svg) {
      let fr = idToName[this.props.focusedRegion] || null;
      this._svg.selectAll(".region").classed("faded", d => {
        return fr !== null && fr !== d.region;
      });
    }

    // This is the grouped bar chart, composed of the legend, x- and y-axes
    return (
      <div className="groupedbar" ref={c => this._container = d3.select(c)}>
        <svg ref={c => this._svg = d3.select(c)}>
          <Legend margin={this.props.margin}
                  legendItems={this.years}
                  legendColours={this.colors} />

          <_xAxis margin={this.props.margin}
                  xScale={this.xScale}
                  scaleType={"group"}
                  chartHeight={chartHeight}
                  chartWidth={chartWidth} />

          <_yAxis margin={this.props.margin}
                  yScale={this.yScale}
                  chartHeight={chartHeight}
                  chartWidth={chartWidth} />
          </svg>
      </div>
    );
  }
}

// Allows the map to interact with the barchart. More of Drummond's clever stuff here :-)
const mapStateToProps = state => {
  return {
    focusedRegion: state.selected_region
  };
};
const mapDispatchToProps = dispatch => {
  return {
    selectRegion(region_id) {
      dispatch(REGION_SELECTED(region_id));
    }
  };
};

const UKBarChart = connect(mapStateToProps, mapDispatchToProps)(
  GroupedBarChart
);





class LineChart extends Component{


  getData(data){
    // Pre-summarised data should be passed in as a prop. This cleans it up a little as, gets the max, years and regions
    let ExpensesData = [],
      regions = [],
      years = [];
        
    Object.keys(data).forEach(function(k){
      if (k !== 'default'){
        ExpensesData.push(data[k]);
        regions.push(data[k].region);
        data[k].values.forEach(function(v){
          if (! years.includes(v.year)){
            years.push(v.year);
          }   
        })
        data[k].values.sort(function(a, b){
          return a.year - b.year;
        })
      }
    })
     this.yMax = Math.ceil(d3.max(ExpensesData, function(d){ return d3.max(d.values, function(v){return v.paid});})/1000000) * 1000000;
     this.regions = regions;
     this.years = years.sort();
     this.chartData = ExpensesData;    
  }        

  setSize(){
    // Inital setup of graph svg here
    this._svg.style("width", "100%"); 
    this._svg.style("height", "100%");

    this._chartLayer
      .attr("width", this.chartWidth)
      .attr("height", this.chartHeight)
      .attr("transform", `translate(${this.props.margin.l}, ${this.props.margin.t})`);
  }


  componentDidMount(){

    this.axisLayer = this._svg.append("g");
    this._chartLayer = this._svg.append("g");

    this.setSize();
    //this.addAxes();

    this.axisLayer.append("text")
      .text(this.props.chartTitle)
      .attr("transform", `translate(${(this.chartWidth + this.props.margin.l + this.props.margin.r) / 2},${this.props.margin.t / 2})`)
      .style("text-anchor", "middle")
      .call(setFontSizeAndColour, 20);

    let xs = this.xScale, 
      ys = this.yScale

    this.line = d3.line()
      .x(function(d){return xs(d.year)})
      .y(function(d){return ys(d.paid)})

    let cl = this._chartLayer;
    let line = this.line
    let margin = this.props.margin;
    let colors = this.colors
    this.chartData.forEach(function(d){
      cl.append("path")
        .datum(d.values)
        .attr("fill", "none")
        .attr("stroke", colors(d.region))
        .attr("stroke-width", 3)
        .attr("d", line)
    });
  }
   
  render(){

      // get the data into the right shape, getting the min and max
    this.getData(this.props.data);

    // Calculate the height and width using the margins
    this.chartHeight = this.props.height - this.props.margin.t - this.props.margin.b;
    this.chartWidth = this.props.width - this.props.margin.l - this.props.margin.r;
    let chartHeight = this.chartHeight, 
      chartWidth = this.chartWidth;

    // Set up the scales - colour scale, xScale, xInScale, yScale
    this.xScale = d3.scalePoint().domain(this.years).range([0, this.chartWidth]);
    this.yScale = d3.scaleLinear().domain([0, this.yMax]).range([chartHeight, 0]);

    this.colors = d3.scaleOrdinal()
      .range(["rgb(242,51,135)", "rgb(108,73,75)", "rgb(237,127,97)",
        "rgb(215,5,13)", "rgb(144,45,84)", "rgb(164,62,3)"])
      .domain(this.regions);

    // Some of Drummond's clever stuff here
    if (this._svg) {
      let fr = idToName[this.props.focusedRegion] || null;
      this._svg.selectAll(".region").classed("faded", d => {
        return fr !== null && fr !== d.region;
      });
    }





    return (
        <div className="line" ref={c => this._container = d3.select(c)}>
    <svg ref={c => this._svg = d3.select(c)}>
      <Legend margin={this.props.margin}
              legendItems={this.regions}
              legendColours={this.colors} />

      <_xAxis margin={this.props.margin}
              xScale={this.xScale}
              scaleType={"linear"}
              chartHeight={chartHeight}
              chartWidth={chartWidth} />

      <_yAxis margin={this.props.margin}
              yScale={this.yScale}
              chartHeight={chartHeight}
              chartWidth={chartWidth} />
      </svg>
  </div>
    )
  }
}





const UKLineChart = connect(mapStateToProps, mapDispatchToProps)(
  LineChart
);




export default UKLineChart;// UKBarChart;
