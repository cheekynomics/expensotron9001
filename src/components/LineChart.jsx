import * as d3 from "d3";
import React, { Component } from "react";
import { connect } from "react-redux";

import { REGION_SELECTED } from "./Map.jsx";

import {name_to_id, setFontSizeAndColour, getWidthOfText, textWrap} from "./HelperFunctions.jsx";
import { Legend, _xAxis, _yAxis } from "./ChartComponents.jsx";

import idToName from "../../datafiles/idToName.json";

import "./GroupedBarChart.styl";





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







export default LineChart;
