import * as d3 from "d3";
import React, { Component } from "react";
import { connect } from "react-redux";

import { REGION_SELECTED } from "./Map.jsx";

import { name_to_id, getWidthOfText, textWrap } from "./HelperFunctions.jsx";


import idToName from "../../datafiles/idToName.json";

import "./GroupedBarChart.styl";



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
      ticks = this.props.xScale.domain().map(function(r, i){
        // calculate the textSpans for each region using the function defined above
        let textSpans = textWrap(r, xScale.bandwidth(), 9, 0.71);
        return (
          // for each of the xValues, we need to return a tick, composed of a tickline and a ticklabel (itself comprising multiple textspans)
          <g className={"tick"}
              opacity={1}
              key={r}
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
                key={`X_${t}`}
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
            key={`Y_${t}`}
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


export { Legend, _xAxis, _yAxis };
