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
    return (5);
  }
}




class GroupedBarChart extends Component {
  wrap(text, width) {
    // used to wrap 'Yorkshire and the Humber' over two lines - taken from MBostock code
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


  addAxes() {
    // Adds the x- and y-axes, axis ticks, axis labels and styles them all
    let margin = this.props.margin;

    let yAxis = d3
      .axisLeft(this.yScale)
      .tickSizeInner(-this.chartWidth)
      .tickFormat(d3.formatPrefix(".0", 1e6)); //'13M instead of 13000000

    this.axisLayer
      .append("g")
      .attr("transform", `translate(${margin.l}, ${margin.t})`)
      .attr("class", "axis y")
      .call(yAxis);

    var yTicks = d3.selectAll(".axis.y > .tick > text");

    // prepend a '£' to the axis ticks
    yTicks.nodes().forEach(function(t) {
      t.innerHTML = `£${t.innerHTML}`;
    });

    // move the ticks a little bit further away from the axis and then set the font size and colour
    yTicks
      .attr("transform", "translate(-5, 0)")
      .call(setFontSizeAndColour, 12);

    this.axisLayer
      .append("text")
      .text(this.props.xTitle)
      .attr("x", 0 - this.chartHeight / 2)
      .attr("y", margin.l / 2)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .call(setFontSizeAndColour, 20);

    let xAxis = d3.axisBottom(this.xScale);

    this.axisLayer
      .append("g")
      .attr("class", "axis x")
      .attr(
        "transform",
        `translate(${margin.l}, ${this.chartHeight + margin.t})`
      )
      .call(xAxis)
      .selectAll(".tick text")
      .call(this.wrap, this.xScale.bandwidth());

    this.axisLayer
      .append("text")
      .text(this.props.yTitle)
      .attr(
        "transform",
        `translate(${(this._width + margin.l) / 2}, ${this.chartHeight + margin.t + 50})`
      )
      .style("text-anchor", "middle")
      .call(setFontSizeAndColour, 20);

    d3
      .selectAll(".axis.x > .tick > text")
      .on("click", e => this.props.selectRegion(name_to_id[e]))
      .call(setFontSizeAndColour, 12);
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

    this.xScale.range([0, this.chartWidth]);
    this.xInScale.range([0, this.xScale.bandwidth()]);
    this.yScale.range([this.chartHeight, 0]);
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
    this.addAxes();
  }

  render() {

    this.getData(this.props.data);

    this.xScale = d3
      .scaleBand()
      .domain(this.regions)
      .paddingInner(0.1)
      .paddingOuter(0.01);
    this.xInScale = d3.scaleBand().domain(this.years);
    this.yScale = d3.scaleLinear().domain([0, this.yMax]);

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

    let xScale = this.xScale;
    let chartHeight = this.chartHeight;

    //console.log(xScale);

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
