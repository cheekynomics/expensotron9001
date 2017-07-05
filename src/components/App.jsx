import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { UKMap } from "./Map.jsx";
//import GroupedBarChart from "./GroupedBarChart.jsx";

import LineChart from "./LineChart.jsx";
import GroupedBarChart from "./GroupedBarChart.jsx";

import * as expenses from "../../datafiles/SummariesByRegionAndYear.json";

import "font-awesome-webpack";
import "./App.styl";

/*
PRESENTATION COMPONENT
*/
class Expensotron extends React.Component {
  render() {
    return (
      <div className="wrapper">
        <UKMap />
        {<GroupedBarChart
          margin={{
            l: 100,
            t: 20,
            b: 70,
            r: 20
          }}
          height={800}
          width={600}
          data={expenses}
          yTitle = {"Total Value of Expense Claims"}
          xTitle = {"Region"}
        />}
        {<LineChart
          margin={{l : 100,
                  t : 50,
                  b : 70,
                  r : 20}}
          data = {expenses}
          xTitle = {"Year"}
          height={800}
          width={600}
          yTitle = {"Total value of expense claims"}
          chartTitle = {"Change in expense claims each year"}
        />}
      </div>
    );
  }
}

Expensotron.propTypes = {
  selectRegion: PropTypes.func
};

/*
ACTIONS AND REDUCERS
*/

/*
CONTAINER COMPONENT
*/

const mapStateToProps = state => {
  return {
    focusedRegion: state.selected_region
  };
};
const mapDispatchToProps = dispatch => {
  return {};
};

const App = connect(mapStateToProps, mapDispatchToProps)(Expensotron);

export { App, Expensotron };
