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
let vbWidth = 600;
let vbHeight = 1000;

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
    this._bounds = {};
    let colours = d3.scaleOrdinal(cheekyPalette).domain(_.keys(idToName));
    let projection = d3
      .geoAlbers()
      .parallels([50, 60]) // Conic parallels (latitudes) that sandwich GBR for minimal distortion.
      .rotate([-4, 0]); // Rotate to minimise distortion over the UK.
    let geoPath = d3.geoPath().projection(projection);
    // Set the bounds for the projection
    let pad = 20;
    projection.fitExtent(
      [[pad, pad], [vbWidth - pad, vbHeight - pad]],
      constituencies_obj
    );
    eeRegions.forEach(region => {
      this._bounds[region.id] = geoPath.bounds(region);
    });

    let conPaths = constituencies.map(con => {
      let reg = conToReg[con.id].reg;
      let isFocused = this.props.focusedRegion === reg;
      let zoomClass = this.props.focusedRegion !== null
        ? isFocused ? "zoomed focused" : "zoomed"
        : "";

      return (
        <path
          vectorEffect="non-scaling-stroke"
          key={con.id}
          className={`constituency ${con.id} ${zoomClass}`}
          d={geoPath(con)}
          fill={colours(reg)}
          onClick={event => {
            event.stopPropagation();
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

MapView.propTypes = {
  focusedRegion: PropTypes.string,
  selectRegion: PropTypes.func,
  unselectRegion: PropTypes.func,
  pad: PropTypes.number
};

/*
Containers and associated bits.
*/

const REGION_SELECTED_TYPE = "REGION_SELECTED";
const REGION_UNSELECTED_TYPE = "REGION_UNSELECTED";

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
