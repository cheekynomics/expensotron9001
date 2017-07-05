import * as d3 from "d3";
import React, { Component } from "react";

import idToName from "../../datafiles/idToName.json";

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

export { name_to_id, setFontSizeAndColour, getWidthOfText, textWrap }
