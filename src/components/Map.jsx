import * as d3 from "d3";
import * as _ from "lodash";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as topojson from "topojson";

import "./Map.styl";

import regionsTopo from "../../datafiles/regions.json";
import scotlandTopo from "../../datafiles/scotland.json";
import walesTopo from "../../datafiles/wales.json";
import constituenciesTopo from "../../datafiles/constituencies.json";
import conToReg from "../../datafiles/conToReg.json";
import idToName from "../../datafiles/idToName.json";

// Variables
// Colour palette, used for region colouration.
const cheekyPalette = [
  "rgb(148,166,253)",
  "rgb(3,98,160)",
  "rgb(72,182,234)",
  "rgb(94,67,147)",
  "rgb(164,119,251)",
  "rgb(46,33,208)",
  "rgb(46,236,230)",
  "rgb(141,25,147)",
  "rgb(247,94,240)"
];

// Define the viewbox width and height so we don't need to worry
// about real-pixel sizes. These are actually used later.
let vbWidth = 600;
let vbHeight = 1000;

// Load in the topological data.
let eeRegions = topojson.feature(regionsTopo, regionsTopo.objects.eer).features;
let wales = topojson.feature(walesTopo, walesTopo.objects.eer).features[0];
let scotland = topojson.feature(scotlandTopo, scotlandTopo.objects.eer)
  .features[0];
let constituencies_obj = topojson.feature(
  constituenciesTopo,
  constituenciesTopo.objects.wpc
);
let constituencies = constituencies_obj.features;

/*
Presentation Component
*/
class MapView extends Component {
  render() {
    // Map region IDs to the cheeky palette colour.
    let colours = d3.scaleOrdinal(cheekyPalette).domain(_.keys(idToName));

    // Set the map projection to be a good one for the UK.
    let projection = d3
      .geoAlbers()
      .parallels([50, 60]) // Conic parallels (latitudes) that sandwich GBR for minimal distortion.
      .rotate([-4, 0]); // Rotate to minimise distortion over the UK.

    // Use D3's path generator.
    let geoPath = d3.geoPath().projection(projection);

    // Set the extent for the projection, giving us a 20 pixel pad
    // from our viewbox width.
    let pad = 20;
    projection.fitExtent(
      [[pad, pad], [vbWidth - pad, vbHeight - pad]],
      constituencies_obj
    );

    // This object will store the bounds for each electoral region
    // for zooming purposes.
    this._bounds = {};
    // TODO: find a way to do this that doesn't keep the region
    // data hanging around. Currently
    eeRegions.forEach(region => {
      this._bounds[region.id] = geoPath.bounds(region);
    });

    // This map generates an SVG path JSX element for each constituency
    // we have shape data for.
    let conPaths = constituencies.map(con => {
      // Get the region id.
      let reg = conToReg[con.id].reg;
      // Is this region focused?
      let isFocused = this.props.focusedRegion === reg;
      // Here we set our css classes based on 2 nested ternary
      // statements. The outer one just determines whether we
      // need any CSS at all (if we're not zoomed then we don't).
      // If we are zoomed we definitely add 'zoomed'.
      // If we *are* zoomed, then the second inner statement checks
      // if this is the focused region, and adds the 'focused' class.
      let zoomClass = this.props.focusedRegion !== null
        ? isFocused ? "zoomed focused" : "zoomed"
        : "";

      // We return the 'path' element here.
      return (
        <path
          vectorEffect="non-scaling-stroke" // Stroke edges don't scale! Super handy.
          key={con.id} // When producing React components in lists, each one needs a unique key.
          className={`constituency ${con.id} ${zoomClass}`} // CSS class names
          d={geoPath(con)} // We use D3's path generator directly here.
          fill={colours(reg)} // We set the fill colour here too.
          onClick={event => {
            event.stopPropagation(); // Prevent the SVG click handler from also picking this up.
            this.props.selectRegion(reg);
          }}
        />
      );
    });

    return (
      <div className="mapview">
        <svg
          onClick={this.props.unselectRegion}
          viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        >
          <g className="tGroup" transform={this._calculateTransform()}>
            <path className="scotland" d={geoPath(scotland)} />
            <path className="wales" d={geoPath(wales)} />
            {conPaths}
          </g>
        </svg>

      </div>
    );
  }

  // This functoin contains the same zoom transform logic as before
  // but now we return a CSS transform string directly as we are
  // doing all transitions in CSS.
  _calculateTransform() {
    if (this.props.focusedRegion !== null) {
      let bounds = this._bounds[this.props.focusedRegion];
      let dx = bounds[1][0] - bounds[0][0];
      let dy = bounds[1][1] - bounds[0][1];
      let x = (bounds[0][0] + bounds[1][0]) / 2;
      let y = (bounds[0][1] + bounds[1][1]) / 2;
      let scale = 1 / Math.max(dx / vbWidth, dy / vbHeight);
      let translate = [vbWidth / 2 - scale * x, vbHeight / 2 - scale * y];
      return `translate(${translate[0]}, ${translate[1]})scale(${scale})`;
    }
    return "";
  }
}

// This is an optional but ESLINT enforced mapping of
// props to object types. It is good practice.
MapView.propTypes = {
  focusedRegion: PropTypes.string,
  selectRegion: PropTypes.func,
  unselectRegion: PropTypes.func,
  pad: PropTypes.number
};

/*
Containers and associated bits.
*/

// String constants to reduce opportunity for mistakes.
const REGION_SELECTED_TYPE = "REGION_SELECTED";
const REGION_UNSELECTED_TYPE = "REGION_UNSELECTED";

// This function, and the one below, produce redux actions.
const REGION_SELECTED = region_id => {
  return {
    type: REGION_SELECTED_TYPE,
    data: region_id
  };
};

const REGION_UNSELECTED = () => {
  return {
    type: REGION_UNSELECTED_TYPE
  };
};

// This is a reducer, imported in reducers.js, that is used
// to manage the redux state for selected regions.
const selected_region = (state = null, action) => {
  switch (action.type) {
  case REGION_SELECTED_TYPE:
    if (action.data === state) {
      return null;
    } else {
      return action.data;
    }
  case REGION_UNSELECTED_TYPE:
    return null;
  default:
    return state;
  }
};

// These two functions supply the needed mapping for
// data flowing in (statetoprops), and actions flowing out
// (dispatchtoprops)
const mapStateToProps = state => {
  return {
    focusedRegion: state.selected_region
  };
};
const mapDispatchToProps = dispatch => {
  return {
    selectRegion(region_id) {
      dispatch(REGION_SELECTED(region_id));
    },
    unselectRegion() {
      dispatch(REGION_UNSELECTED());
    }
  };
};

const UKMap = connect(mapStateToProps, mapDispatchToProps)(MapView);

export { UKMap, MapView, selected_region, REGION_SELECTED };
