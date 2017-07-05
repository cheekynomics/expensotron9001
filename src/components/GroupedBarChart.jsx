import * as d3 from "d3";
import React, { Component } from "react";
import { connect } from "react-redux";

import { REGION_SELECTED } from "./Map.jsx";
import {name_to_id, setFontSizeAndColour, getWidthOfText, textWrap} from "./HelperFunctions.jsx";
import { Legend, _xAxis, _yAxis } from "./ChartComponents.jsx";

import idToName from "../../datafiles/idToName.json";

import "./GroupedBarChart.styl";

let vbWidth = 600,
  vbHeight = 900;


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
    this.chartHeight = vbHeight - this.props.margin.t - this.props.margin.b;
    this.chartWidth = vbWidth - this.props.margin.l - this.props.margin.r;
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
        <svg ref={c => this._svg = d3.select(c)}
              viewBox={`0 0 ${vbWidth} ${vbHeight}`}>
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




export default UKBarChart;
