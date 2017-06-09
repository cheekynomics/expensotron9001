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


const wrap = (text, width) => {
    // used to wrap long svg text - works on the text element itself, therefore doesn't work for the React class
    text.each(function() {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");
        
      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        //console.log(tspan);
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(word);
        }
      }
    });
}

const textWrap = (text, width, y, dy) => {
  // Takes a string, target width, y value and dy value, then returns a list of textspan objects
  // with the string broken down into words, one in each textspan object and positione vertically
  // Adapted from Mike Bostock's version (above) which works on the element rather than the raw string
  var words = text.split(/\s+/).reverse(),
    word,
    line=[],
    lineNumber = 0,
    lineHeight = 1.1,
    output = [];

  while((word = words.pop())){
    line.push(word);
    let _text = line.join(" ");
    if (getWidthOfText(_text, 'Arial', 12) > width){
      line.pop();
      _text = line.join(" ");
      line = [word];
      output.push(<tspan x={0}
                            y={y}
                            dy={lineNumber * lineHeight + dy + "em"}>{word}</tspan>)
      lineNumber ++;
    }
    else{
      output.push(<tspan x={0}
                            y={y}
                            dy={lineNumber * lineHeight + dy + "em"}>{word}</tspan>)
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
  render(){
    let xScale = this.props.xScale,
      regions = this.props.xScale.domain();
    
    // create a list of the tick objects. 
    // Each will contain a line and a text object (which may in turn contain textspans)
    let ticks = regions.map(function(r){
      // calculate the textSpans
      let textSpans = textWrap(r, xScale.bandwidth(), 9, 0.71);
      return (
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
  render(){
    let yScale = this.props.yScale,
      chartWidth = this.props.chartWidth,
      f = d3.formatPrefix(".0", 1e6);//d3.format(".2s");

    let tickNumbers = yScale.ticks(10);

    let ticks = tickNumbers.map(function(t){
      return (
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

    return (
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
            .style("stroke", function() {
              return setColours(
                this.className.baseVal,
                innerClass,
                "#333",
                "none"
              );
            });

          svg.selectAll(`.legend-text`).style("fill", function() {
            return setColours(
              this.className.baseVal,
              innerClass,
              "black",
              "#d3d3d3"
            );
          });

          svg.selectAll(`.legend-box`).style("fill", function() {
            return setColours(
              this.className.baseVal,
              innerClass,
              colorScale(innerClass),
              "#d3d3d3"
            );
          });
        })
        .on("mouseout", function() {
          // Change the colour to what it was before
          svg
            .selectAll(".bar")
            .attr("fill", function() {
              return colorScale(this.className.baseVal.split(" ")[1]);
            })
            .style("stroke", "#333");

          svg.selectAll(`.legend-text`).style("fill", "black");

          svg.selectAll(".legend-box").style("fill", function() {
            return colorScale(this.className.baseVal.split(" ")[1]);
          });
        });
    });
  }

  setSize() {
    // Inital setup of graph svg here
    //let { height, width } = this._container._groups[0][0].getBoundingClientRect();
    // let cs = getComputedStyle(this._container._groups[0][0]);
    // let height = cs.getPropertyValue('height');
    // let width = cs.getPropertyValue('width');
    // console.log(cs.getPropertyValue('height'));
    // console.log(top, bottom);
    // console.log(height);
    // let height = bottom - top;
    // let width = right - left;



    this._svg.style("width", this.props.width); 
    this._svg.style("height", this.props.height);

    this._width = this.props.width;
    this._height = this.props.height;

    let margin = this.props.margin;
    this.chartWidth = this._width - margin.l - margin.r;
    this.chartHeight = this._height - margin.t - margin.b;

    this._chartLayer
      .attr("width", this.chartWidth)
      .attr("height", this.chartHeight)
      .attr("transform", `translate(${margin.l}, ${margin.t})`);
  }

  componentDidMount() {
    // Sets up the different components of the chart
    

    this.axisLayer = this._svg
      .append("g")
      .classed("axisLayer", true), 
    this._chartLayer = this._svg
      .append("g")
      .classed("chartLayer", true);


    this.setSize();

    let colorScale = this.colors,
      xScale = this.xScale,
      xInScale = this.xInScale,
      yScale = this.yScale,
      chartHeight = this.chartHeight;


    // draws the bars
    let t = d3.transition().duration(1000).ease(d3.easeLinear);

    let outer = this._chartLayer.selectAll(".outer").data(this.chartData);

    let inner = outer.enter().append("g").attr("class", "region");

    outer.merge(inner).attr("transform", function(d) {
      return "translate(" + [xScale(d["region"]), 0] + ")";
    });

    let bar = inner.selectAll(".bar").data(function(d) {
      return d.values;
    });

    let newBar = bar.enter().append("rect").attr("class", "bar");
    bar
      .merge(newBar)
      .attr("width", this.xInScale.bandwidth())
      .attr("height", 0)
      .attr("fill", function(d) {
        return colorScale(`_${d["year"]}`);
      })
      // .attr("opacity", 0.8)
      .attr("class", function(d) {
        return `bar _${d["year"]}`;
      })
      .attr("transform", function(d) {
        return "translate(" + [xInScale(d["year"]), chartHeight] + ")";
      });

    bar
      .merge(newBar)
      .transition(t)
      .attr("height", function(d) {
        return chartHeight - yScale(d.paid);
      })
      .attr("transform", function(d) {
        return "translate(" + [xInScale(d["year"]), yScale(d.paid)] + ")";
      });

    this.setInteractions();
  }

  render() {

    this.getData(this.props.data);

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

    let chartHeight = this.props.height - this.props.margin.t - this.props.margin.b;
    let chartWidth = this.props.width - this.props.margin.l - this.props.margin.r;

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


    if (this._svg) {
      let fr = idToName[this.props.focusedRegion] || null;
      this._svg.selectAll(".region").classed("faded", d => {
        return fr !== null && fr !== d.region;
      });
    }

    return (
      <div className="groupedbar" ref={c => this._container = d3.select(c)}>
        <svg ref={c => this._svg = d3.select(c)}>
          <Legend margin={this.props.margin}
                  legendItems={this.years}
                  legendColours={this.colors} />

          <_xAxis margin={this.props.margin}
                  xScale={this.xScale}
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

export default UKBarChart;
