import React, {Component} from 'react';
import './Correlationgraph.css';
import * as d3 from 'd3';

//データを管理するためのclass
class woundData{
  constructor(id, name, image, vec){
    this.id = id;
    this.name = name;
    this.image = image;
    this.vec = vec;
  }
}

//JSXやメゾットを定義する実質上の中身
class Test extends Component{

  //state = {context:"no_context", target_id:0};

  constructor(props){
    super(props);
    this.state = this.props.context;
    this.createLineChart = this.createLineChart.bind(this);
  }

  componentDidMount() {
    this.state = this.props.context;
    this.createLineChart(this.state);
  }
  componentDidUpdate() {
    this.state = this.props.context;
    this.createLineChart(this.state);
}


createLineChart(state) {
  var svg = d3.select("#Test");

  var w = 700;
  var h = 700;


  d3.select("div").append("p").text("svg width x height : " + w + " x " + h);

    // 入力データは[x座標、y座標、値(円の大きさ)]
    const dataset = [
        [1, 1, 50], [1, 2, 25], [1, 3, 10], [2, 1, 50], [2, 2, 25], [2, 3, 10], [3, 1, 50], [3, 2, 25], [3, 3, 10]
    ];

    // 入力ドメインと出力レンジをマッピングさせたスケール関数を定義
    // padding の分だけレンジを狭める
    const padding = d3.max(dataset, function (d) { return d[2]; });

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, function (d) { return d[0] + 1; })])
        .range([padding, w - padding]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, function (d) { return d[1] + 1; })])
        .range([padding, h - padding]);

    // 円を描画
    svg.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("fill", "black")
        .attr("cx", function (d) {
            return xScale(d[0]);
        })
        .attr("cy", function (d) {
            return yScale(d[1]);
        })
        .attr("r", function (d) {
            return d[2];
        });
}

render() {
  //this.setState(this.props);
  return <svg id="graph_section">
  </svg>
}
}

//外部のファイルがこのcompnentを利用できるようにするエクスポート
export default Test;
