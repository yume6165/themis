import React, {Component} from 'react';
import './Correlationgraph.css';
import * as d3 from 'd3';

//ただの相関グラフのデータ

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
class Correlationgraph extends Component{

  state = {context:"no_context", target_id:"0"};

  constructor(){
    super()
    this.createLineChart = this.createLineChart.bind(this)
  }

  componentDidMount() {
    this.createLineChart(this.state);
  }
  componentDidUpdate() {
    this.createLineChart(this.state);
}


createLineChart(state) {
  const _self = this;
  const node = this.node

  //全体の設定
  var width = 700,
      height = 700,
      margin = 50,
      x = d3.scaleLinear()
          .domain([0, 10])
          .range([margin, width - margin]),
      y = d3.scaleLinear()
          .domain([0, 10])
          .range([height - margin, margin]);

      d3.range(10).map(function(i){
          return {x: i, y: Math.sin(i) + 5};
      })

    //csvファイルの読み込み
    var files = ["http://localhost:3000/results/anken_dist/0_no_context.csv",
                 "http://localhost:3000/results/anken_dist/1_incision_context.csv",
                 "http://localhost:3000/results/anken_dist/2_contusion_context.csv"]
    var promises = [];
    var contexts = [];
    var context_numbers = {'no_context':0, 'incision_context':1, 'contusion_context':2};//文脈データとそのidを管理する配列
    var wounds = [];

    files.forEach(function(url){
      promises.push(d3.text(url))
    });

    Promise.all(promises).then(function(values){
      //console.log(values);
        contexts.push(values);
        contexts = contexts[0];
        //console.log(contexts);

        //各文脈のデータを整える
        for(var i=0; i < contexts.length; i++){
            contexts[i] = contexts[i].split("\n");
            contexts[i].pop();
            //console.log(contexts[i]);
          for(var j=0; j < contexts[i].length; j++){
              contexts[i][j] = contexts[i][j].split(",");
              contexts[i][j] = contexts[i][j].map(Number);
              //console.log(contexts[i][j]);
          }
        }
        console.log(contexts);//csvが思った形に整頓された

        //創傷の登録をする
        for(var i=0; i < contexts[0].length; i++){
            var name = "Wound" + String(i);
            const wound = new woundData(i, name, "", "");
            wounds.push(wound);
        }
        //console.log(wounds);

        //創傷の表示位置を決定
        var context_number = context_numbers[state.context];



        //  ここからグラフの描画
        var nodes =[];
          for(var i=0; i < wounds.length; i++){
            for(var j=0; j < contexts.length; j++){
              if(i == Number(state.target_id)) continue;
              var id = String(wounds[i].id) + "_c"+String(j);
              var n = {"id" :id, "label":wounds[i].name, "group":j, "wound_no":i};
              nodes.push(n);
            }
          }
          console.log(nodes);

        var links =[];
          for(var i=0; i < contexts.length; i++){//iは文脈番号
            for(var j=0; j < contexts[0].length; j++){//jはメインの創傷番号
              for(var k=j; k < contexts[0].length; k++){//kは比べられる創傷簿番号
                if(j == k) continue;
                if(j == Number(state.target_id) || k == Number(state.target_id)) continue;
                var s = String(wounds[j].id) + "_c" + String(i);
                var t = String(wounds[k].id) + "_c" + String(i);
                var l =　{"source":s, "target":t, "value":contexts[i][j][k], "group":i};
                links.push(l);
              }
            }
          }



          //svgの構成
          var svg = d3.select(node);

          svg.attr("height", height)
              .attr("width", width);

       //svg.append("text")
       //.attr("x", 10)  // x座標
       //.attr("y", 30) // y座標
       //.attr("dx", "10,10,10,10,10,10,10,10,10,10,10,10,10")  // dx座標
       //.attr("dy", "0,4,8,12,16,20,24,28,32,36,40,44,48,52") // dy座標
       //.attr("rotate", -30)　// テキストの回転角度
       //.text("svgにテキストを追加します")  // プレーンテキスト

       var zoom = d3.zoom()
         .scaleExtent([1/4,4])
         .on('zoom', SVGzoomed);

       svg.call(zoom);

       //"svg"上に"g"をappendしてdragイベントを設定
       var g = svg.append("g")
         .call(d3.drag()
         .on('drag',SVGdragged))

          //nodesの描画（今回はsvgの円描画機能を利用）
          console.log(links);

          //forceLayoutの設定
          var force = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links).id(d => d.id))
          .force("charge", d3.forceManyBody())
          .force("center", d3.forceCenter(width / 2, height / 2));

          force
            .nodes(nodes)
            .on("tick", ticked);


          var pict_link = g.append("g")
              .attr("class", "links")
              .selectAll("line")
              .data(links)
              .enter()
              .append("line")
              .attr("stroke", "#999")
              .attr("opacity", function(d){
                      var opacity = 1.0;
                      if(d.group != context_number) opacity = 0.1;
                      return opacity;})
              .attr("stroke-width", function(d){ return d.value * 5;})
              .call(d3.drag()　              //無いとエラーになる。。
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

          var pict_node = g.append("g")
              .attr("class", "nodes")
              .selectAll("circle")
              .data(nodes)
              .enter()
              .append("circle")
              .attr("cx", 1)
              .attr("r",function(){return 10;})
              .attr("fill",function(){return "yellow";})
              .attr("opacity", function(d){
                      var opacity = 1.0;
                      if(d.group != context_number) opacity = 0.3;
                      return opacity;})
              .attr("stroke-width",3)
              .attr("stroke",function(){return "orange";})
              .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));





      function SVGzoomed() {
        g.attr("transform", d3.event.transform);
      }

      function SVGdragged(d) {
        d3.select(this).attr('cx', d.x = d3.event.x).attr('cy', d.y = d3.event.y);
          };

        function ticked() {
          pict_link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
          pict_node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
       }


       function dragstarted(d) {
         if(!d3.event.active) force.alphaTarget(0.3).restart();
           d.fx = d.x;
           d.fy = d.y;
         }

       function dragged(d) {
         d.fx = d3.event.x;
         d.fy = d3.event.y;
       }

       function dragended(d) {
         if(!d3.event.active) force.alphaTarget(0);
         d.fx = null;
         d.fy = null;
       }

        renderAxes(svg);
      });




  function renderAxes(svg){
      var xAxis = d3.axisBottom()
              .scale(x.range([0, quadrantWidth()]))
              .scale(x);

      var yAxis = d3.axisLeft()
              .scale(y.range([quadrantHeight(), 0]))
              .scale(y);

      svg.append("g")
          .attr("class", "axis")
          .attr("transform", function(){
              return "translate(" + xStart()
                  + "," + yStart() + ")";
          })
          .call(xAxis);

      svg.append("g")
          .attr("class", "axis")
          .attr("transform", function(){
              return "translate(" + xStart()
                  + "," + yEnd() + ")";
          })
          .call(yAxis);
  }

  function xStart(){ return margin;}
  function yStart(){ return height - margin;}
  function xEnd(){ return width - margin;}
  function yEnd(){ return margin;}
  function quadrantWidth(){ return width - 2 * margin;}
  function quadrantHeight(){ return height - 2 * margin;}
}

render() {
  return <svg ref={node => this.node = node}>
  </svg>
}
}

//外部のファイルがこのcompnentを利用できるようにするエクスポート
export default Correlationgraph;
