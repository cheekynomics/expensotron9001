import * as d3 from "d3";
import React, { Component } from "react";
import { connect } from "react-redux";

import { REGION_SELECTED } from "./Map.jsx";

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

  setFontSizeAndColour(selection, size) {
    // Sets a consistent font family for all the text
    selection.style("font-family", "Oswald").style("font-size", `${size}px`);
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
    yTicks.nodes().forEach(function(t) {
      // prepend a '£' to the axis ticks
      t.innerHTML = `£${t.innerHTML}`;
    });
    yTicks
      .attr("transform", "translate(-5, 0)")
      .call(this.setFontSizeAndColour, 12);

    this.axisLayer
      .append("text")
      .text("Total value of expense claims")
      .attr("x", 0 - this.chartHeight / 2)
      .attr("y", margin.l / 2)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .call(this.setFontSizeAndColour, 20);
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
      .text("Region")
      .attr(
        "transform",
        `translate(${(this._width + margin.l) / 2}, ${this.chartHeight + margin.t + 50})`
      )
      .style("text-anchor", "middle")
      .call(this.setFontSizeAndColour, 20);

    d3
      .selectAll(".axis.x > .tick > text")
      .on("click", e => this.props.selectRegion(name_to_id[e]))
      .call(this.setFontSizeAndColour, 12);
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
    let { height, width } = this._container._groups[0][
      0
    ].getBoundingClientRect();
    // let cs = getComputedStyle(this._container._groups[0][0]);
    // let height = cs.getPropertyValue('height');
    // let width = cs.getPropertyValue('width');
    // console.log(cs.getPropertyValue('height'));
    // console.log(top, bottom);
    // console.log(height);
    // let height = bottom - top;
    // let width = right - left;
    this._svg.style("width", "100%"); //I can reference that which was rendered using the same name
    this._svg.style("height", height);

    this._width = width;
    this._height = height;

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
    this.getData(this.props.data);

    (this.axisLayer = this._svg
      .append("g")
      .classed("axisLayer", true)), (this._chartLayer = this._svg
      .append("g")
      .classed("chartLayer", true));

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
      .attr("opacity", 0.8)
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

    // Creates the legend
    let legendY = d3.scaleBand().domain(this.years).range([10, 130]);

    let legend = this._chartLayer
      .append("g")
      .style("transform", "translate(50, 30")
      .attr("class", "legend");

    legend
      .selectAll(".box")
      .data(this.years)
      .enter()
      .append("rect")
      .attr("width", 8)
      .attr("height", 8)
      .attr("class", function(d) {
        return `legend-box _${d}`;
      })
      .attr("fill", function(d) {
        return colorScale(d);
      })
      .attr("transform", function(d) {
        return `translate(20,${legendY(d)})`;
      });

    legend
      .selectAll("text")
      .data(this.years)
      .enter()
      .append("text")
      .attr("transform", function(d) {
        return `translate(32,${legendY(d)})`;
      })
      .text(function(d) {
        return d;
      })
      .attr("text-anchor", "left")
      .attr("dy", "0.7em")
      .attr("class", function(d) {
        return "legend-text";
      })
      .call(this.setFontSizeAndColour, 12);

    this.setInteractions();
    this.addAxes();
  }

  render() {
    if (this._svg) {
      let fr = this.props.focusedRegion;
      this._svg
        .selectAll(".region")
        .classed("faded", d => fr && fr !== d.region);
    }
    return (
      <div className="groupedbar" ref={c => this._container = d3.select(c)}>
        <svg ref={c => this._svg = d3.select(c)} />
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
