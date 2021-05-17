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
class Correlationgraph2 extends Component{

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
  //初期化
  var section = document.getElementById('graph_section2')
  section.innerHTML = '';

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
    var files = ["./results/output_file/anken_dist/0_no_context.csv",
                 "./results/output_file/anken_dist/1_incision_context.csv",
                 "./results/output_file/anken_dist/2_contusion_context.csv",
                 "./results/output_file/anken_dist/4_stab_context.csv"]
    var promises = [];
    var contexts = [];
    var context_numbers = {'no_context':0, 'incision_context':1, 'contusion_context':2, 'stab_context':3};//文脈データとそのidを管理する配列
    var color_list = ["red", "orange", "green"];
    var link_color_list = ["#ff0000", "#ffa500", "#008000"];
    var wounds = [];

    var wound_pos = [[0.041, -0.9195], [0.3, 0.6513], [-0.7946, -1.1624], [-0.3825, 1.4548],
                      [1.747, -0.4628], [-0.94, 0.1291], [-0.0405, -0.9002], [1.0226, 0.7454],
                      [0.0878, -0.9437], [-0.4690, 1.408]]

    console.log(wound_pos[0][0])

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
        //console.log(contexts);//csvが思った形に整頓された

        //創傷の登録をする
        for(var i=0; i < contexts[0].length; i++){
            var name = "Wound" + String(i);
            const wound = new woundData(i, name, "", "");
            wounds.push(wound);
        }
        //console.log(wounds);

        //創傷の表示位置を決定
        var context_number = parseInt(context_numbers[state.context]);
        //console.log("文脈番号は"+String(context_number));

        //プロットを出すためのデータ作成
        var dataset = [];
        for(var i=0; i < contexts.length; i++){//文脈の番号
          var tmp = []; //文脈ごとに分けるための箱
          for(var j=0; j < wounds.length; j++){
            if(parseInt(state.target_id) == j){
              continue;
            }
            //console.log(state.target_id);
            var data = contexts[i][parseInt(state.target_id)][j];
            tmp.push(data);
          }
          dataset.push(tmp);
        }
        //console.log(dataset);

        //座標を生成してパスをつなげるためのデータ作成
        var dataset2  = [];
        for(i=0; i < contexts.length; i++){
          var tmp = [];
          for(var j=0; j < wounds.length; j++){
            if(j ==  parseInt(state.target_id)){
              tmp.push([0, 0]);
              continue;
            }
            var tmp2 = contexts[i][ parseInt(state.target_id)][j];
            tmp.push([j, tmp2]);
          }
          dataset2.push(tmp);
        }
        //console.log(dataset2);

      //linkに順位を与えるためのデータセット
      //woundsの順番をdatasetに基づいて入れ替える???
      var dataset3 = {};
      for(var i=0; i < wounds.length; i++){
        if(i == parseInt(state.target_id)) continue;
        dataset3[wounds[i].name] = dataset2[context_number][i][1];
      }
      //console.log(dataset3);
      wounds = sortWounds(context_number, dataset[context_number], dataset3, wounds);
      console.log(wounds);

      //nodeの配置を計算する


        //  ここからグラフの描画
        var nodes =[];
          for(var i=0; i < wounds.length; i++){
            for(var j=0; j < contexts.length; j++){
              //if(i == parseInt(state.target_id)) continue;
              var id = String(wounds[i].id) + "_c"+String(j);
              var n = {"id" :id, "label":wounds[i].name, "group":j, "wound_no":wounds[i].id,
                        "pos_x":wound_pos[i][0], "pos_y":wound_pos[i][1]};
              nodes.push(n);
            }
          }
          //console.log(nodes);


        //余分なlinkを描画しないための前処理
        var links_sortable = [];
        for(var i=0; i < contexts.length; i++){//iは文脈番号
          var links_context = [];
          for(var j=0; j < contexts[0].length; j++){//jはメインの創傷番号
            for(var k=j; k < contexts[0].length; k++){//kは比べられる創傷簿番号
              if(j == k) continue;
              //if(j == parseInt(state.target_id) || k == parseInt(state.target_id)) continue;
              var l =　contexts[i][wounds[j].id][wounds[k].id];
              links_context.push(l);
            }
          }
          links_sortable.push(links_context);
        }

        var links =[];//描画するリンク
        for(var i=0; i < contexts.length; i++){//iは文脈番号
            //  表示するリンクの数を決める
          var link_fig = parseInt(contexts[0].length * (contexts[0].length - 1) / 2 * state.link_range / 100);
          var sorted_data =  links_sortable[i].sort(compareFunc);
          for(var j=0; j < contexts[0].length; j++){//jはメインの創傷番号
            for(var k=j; k < contexts[0].length; k++){//kは比べられる創傷簿番号
              if(j == k) continue;
              if(sorted_data[link_fig - 1] <= contexts[i][wounds[j].id][wounds[k].id]) continue;
              //if(j == parseInt(state.target_id) || k == parseInt(state.target_id)) continue;
              var s = String(wounds[j].id) + "_c" + String(i);
              var t = String(wounds[k].id) + "_c" + String(i);
              var value = contexts[i][wounds[j].id][wounds[k].id];

              var l =　{"source":s, "source_index":j, "target":t, "target_index":k, "value":value, "group":i};
              links.push(l);
            }
          }
        }
          //console.log(links);



          //svgの構成
          var svg = d3.select(node);
          var zoom = d3.zoom()
            .scaleExtent([1/4,4])
            .on('zoom', SVGzoomed);

          svg.call(zoom);

          //"svg"上に"g"をappendしてdragイベントを設定
          var g = svg.append("g")
            .call(d3.drag()
            .on('drag',SVGdragged))


          svg.attr("height", height)
              .attr("width", width);



              var margin = { "top": 30, "bottom": 60, "right": 30, "left": 60 };
              var padding = 105;


              // 3. 軸スケールの設定
              //var xScale = d3.scaleLinear()
              //  .domain([0, dataset[0].length])
              //  .range([margin.left, width - margin.right]);
              var xScale = d3.scaleBand()
                .rangeRound([padding, width - padding])
                .domain(nodes.map(function(d){return d.pos_x;}));

              var yScale = d3.scaleLinear()
                .domain([0, 2.5])
                .range([height - margin.bottom, margin.top]);

              // 4. 軸の表示
              //var axisx = d3.axisBottom(xScale).ticks(5)
              //var axisy = d3.axisLeft(yScale).ticks(5);

            //  g.append("g")
            //    .attr("transform", "translate(" + -45 + "," + (height - margin.bottom) + ")")
            //    .call(axisx)
            //    .append("text")
            //    .attr("fill", "black")
            //    .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
            //    .attr("y", 35)
            //    .attr("text-anchor", "middle")
            //    .attr("font-size", "12pt")
            //    .attr("font-weight", "bold")
            //    .text("Wound");

            //  g.append("g")
            //    .attr("transform", "translate(" + margin.left + "," + 0 + ")")
            //    .call(axisy)
            //    .append("text")
            //    .attr("fill", "black")
            //    .attr("x", -(height - margin.top - margin.bottom) / 2 - margin.top)
            //    .attr("y", -35)
            //    .attr("transform", "rotate(-90)")
            //    .attr("text-anchor", "middle")
            //    .attr("font-weight", "bold")
            //    .attr("font-size", "12pt")
            //    .text("Similarity");

            var simulation = d3.forceSimulation()
            .force("collide",d3.forceCollide().radius(function(d){return d.r;}).iterations(16) ) //衝突値の設定
            .force("link", d3.forceLink().strength(1.0).distance(function(d){
                if(d.id<=10){
                    return 200;
                }else{
                    return 20;
                };}))
            .force("charge", d3.forceManyBody())  //反発力の設定
            .force("center", d3.forceCenter(width / 2, height / 2))  //svg領域の中心を重力の中心とする設定
            .force("x", d3.forceX().x(width / 2).strength(0.1))  //x方向に戻る力
            .force("y", d3.forceY().y(height / 2).strength(0.1)); //y方向に戻る力

              // 5. プロットの表示

              //graph2固有の設定
              var pict_circle1 = g.append("g")
                  .selectAll("circle")
                  .data(nodes)
                  .enter()
                  .append("circle")
                  .attr("opacity", function(d){
                          var opacity = 0;
                          if(context_number == d.group && d.wound_no == state.target_id) opacity = 0.2;
                          return opacity;})
                  .attr("cx", function(d) { return xScale(d.pos_x); })
                  .attr("cy", function(d) { return yScale(d.pos_y); })
                  .attr("fill", function(d){return "#a22041";})
                  .attr("r", function(d){
                    if(d.group == context_number){
                        return 300;
                    }
                  })
                  .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', draggended));


              var pict_circle2 = g.append("g")
                  .selectAll("circle")
                  .data(nodes)
                  .enter()
                  .append("circle")
                  .attr("opacity", function(d){
                          var opacity = 0;
                          if(context_number == d.group && d.wound_no == state.target_id) opacity = 0.3;
                          return opacity;})
                  .attr("cx", function(d) { return xScale(d.pos_x); })
                  .attr("cy", function(d) { return yScale(d.pos_y); })
                  .attr("fill", function(d){return "#a22041";})
                  .attr("r", function(d){
                    if(d.group == context_number){
                        return 200;
                    }
                })
                .call(d3.drag()
                  .on('start', dragstarted)
                  .on('drag', dragged)
                  .on('end', draggended));

                var pict_circle3 = g.append("g")
                  .selectAll("circle")
                  .data(nodes)
                  .enter()
                  .append("circle")
                  .attr("opacity", function(d){
                          var opacity = 0;
                          if(context_number == d.group && d.wound_no == state.target_id) opacity = 0.4;
                          return opacity;})
                  .attr("cx", function(d) { return xScale(d.pos_x); })
                  .attr("cy", function(d) { return yScale(d.pos_y); })
                  .attr("fill", function(d){return "#a22041";})
                  .attr("r", function(d){
                    if(d.group == context_number){
                        return 100;
                    }
                  })
                  .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', draggended));

                 var pict_circle4 = g.append("g")
                    .selectAll("circle")
                    .data(nodes)
                    .enter()
                    .append("circle")
                    .attr("opacity", function(d){
                            var opacity = 0;
                            if(context_number == d.group && d.wound_no == state.target_id) opacity = 0.4;
                            return opacity;})
                    .attr("cx", function(d) { return xScale(d.pos_x); })
                    .attr("cy", function(d) { return yScale(d.pos_y); })
                    .attr("fill", function(d){return "#a22041";})
                    .attr("r", function(d){
                      if(d.group == context_number){
                          return 50;
                      }
                    })
                    .call(d3.drag()
                      .on('start', dragstarted)
                      .on('drag', dragged)
                      .on('end', draggended));


            //linkとノードの設定
             var pict_link =  g.append("g")
                  .attr("class", "links")
                  .selectAll("line")
                  .data(links)
                  .enter()
                  .append("line")
//                  .attr("x1", function(d){return xScale(wound_pos[d.source_index][0]);})
//                  .attr("y1", function(d){return yScale(wound_pos[d.source_index][1]);})
//                  .attr("x2", function(d){return xScale(wound_pos[d.target_index][0]);})
//                  .attr("y2", function(d){return yScale(wound_pos[d.target_index][1]);})
                  .attr("stroke", function(d){
                      var tmp = links_sortable[d.group].sort(compareFunc);
                      var tmp = (1 - d.value / tmp[parseInt(links.length / contexts.length - 1)]);
                      var color = define_color("#4b0082", "#ffd700", tmp);
                      //console.log(color);
                      return color;
                    })
                  //.attr("fill", "none")
                  .attr("opacity", function(d){
                          var opacity = 0;
                          //if(d.group != context_number) opacity = 0;
                          return opacity;})
                  .attr("stroke-width", function(d){
                    var tmp = links_sortable[d.group].sort(compareFunc);
                    return  (1 - d.value / tmp[parseInt(links.length / contexts.length - 1)]) * 8;})
                  .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', draggended));


                var pict_node = g.append("g")
                .selectAll("circle")
                .data(nodes)
                .enter()
                .append("circle")
                .attr("opacity", function(d){
                        var opacity = 1.0;
                        if(d.group != context_number) opacity = 0;
                        return opacity;})
                .attr("cx", function(d) { return xScale(d.pos_x); })
                .attr("cy", function(d) { return yScale(d.pos_y); })
                .attr("fill", function(d){
                      if(d.wound_no == state.target_id){
                        return "#ff0000";
                      }else{
                        return "#ffff00";
                      }

                      })
                .attr("r", function(d){
                  if(d.group == context_number){
                      return 8;
                  }else{
                      return 5;
                  }
                })
                .attr("stroke",function(){return "white";})
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", draggended));

            var pict_label = g.append("g")
                .selectAll("circle")
                .data(nodes)
                .enter()
                .append("text")
                .attr("x", function(d){ return xScale(d.pos_x);})
                .attr("y", function(d){ return yScale(d.pos_y);})
                .text(function(d){ return d.label;})
                .attr("dy", "-18px")
                .attr("opacity", function(d){
                    var opacity = 1.0;
                    if(d.group != context_number) opacity = 0;
                    return opacity;
                })
                .attr("fill", "black")
                .attr("stroke", "#555555")
                .attr("font-size", "22px")
                .attr("text-anchor", "middle");


            //凡例の作成
            //var hanrei_color = ["#4b0082", "#ffd700"];

            //var grad = g.append('defs')
            //    .append('linearGradient')
            //    .attr('id', 'grad2')
            //    .attr('x1', '0%')
            //    .attr('x2', '100%')
            //    .attr('y1', '0%')
            //    .attr('y2', '0%');

            //grad.selectAll('stop')
            //    .data(hanrei_color)
            //    .enter()
            //    .append('stop')
            //    .style('stop-color', function(d){ return d; })
            //    .attr('offset', function(d,i){
            //        return 100 * (i / (hanrei_color.length - 1)) + '%';
            //    })

            //var hanrei = svg.append("g")
            //    .append('rect')
            //    .attr("x", 10)
            //    .attr("y", 5)
            //    .attr("width", 300)
            //    .attr("height", 10)
            //    .attr("fill", "url(#grad2)");

            //var hanrei_text1 = svg.append("g")
            //    .append('text')
            //    .attr("x", 25)
            //    .attr("y", 30)
            //    .text("Low")
            //    .attr("font-size", "15px")
            //    .attr("text-anchor", "middle")
            //    .attr("fill", "#999999");

            //var hanrei_text1 = svg.append("g")
            //    .append('text')
            //    .attr("x", 290)
            //    .attr("y", 30)
            //    .text("Hight")
            //    .attr("font-size", "15px")
            //    .attr("text-anchor", "middle")
            //    .attr("fill", "#999999");


            simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.value*state.link_scale))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(width / 2, height / 2));

            simulation
              .nodes(nodes)
              .on("tick", ticked);

            function ticked(){
                pict_node
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})

                pict_circle1
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})

                pict_circle2
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})

                pict_circle3
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})

                pict_circle4
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})

                pict_link
                    //.attr("d", linkArc);
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                pict_label
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
            }

            //linkを曲線にするためのオプション
            function linkArc(d) {
                var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
                return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
            }



                // 線関数定義
//                var line = d3.line()
//                  .interpolate('basis')
//                  .x(function(d) {
                    //ターゲットに対して比べられてる創傷の番号を算出
//                    var wound = 0;
//                    if(state.target_id == d.source){
//                      wound = d.target
//                    }else if(state.target_id == d.target){
//                      wound = d.source;
//                    }
//                    return wound;})
//                  .y(function(d) {
//                    //ターゲットに対して比べられてる創傷の番号を算出
//                    var wound = 0;
//                    if(state.target_id == d.source){
//                      wound = d.target
//                    }else if(state.target_id == d.target){
//                      wound = d.source;
//                    }
  //                  return dataset[d.group][wound];});

        //ノードをマウスのドラッグで動かすための処理
        function dragstarted(d){
            if(!d3.event.active) simulation.alphaTarget(.03).restart();
            d.fx = d.x;
            d.fy = d.y;        }

        function dragged(d){
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function draggended(d){
            if(!d3.event.active) simulation.alphaTarget(.03);
            d.fx = null;
            d.fy = null;
        }


        function SVGzoomed() {
          g.attr("transform", d3.event.transform);
            }

        function SVGdragged(d) {
          d3.select(this).attr('cx', d.x = d3.event.x).attr('cy', d.y = d3.event.y);
            };


        //renderAxes(svg);
      });

  function define_color(color_a, color_b, value){//値が大きいほどB寄りになる
    var a_r = parseInt(color_a.slice(1,3), 16);
    var a_g = parseInt(color_a.slice(3,5), 16);
    var a_b = parseInt(color_a.slice(5,7), 16);
    var b_r = parseInt(color_b.slice(1,3), 16);
    var b_g = parseInt(color_b.slice(3,5), 16);
    var b_b = parseInt(color_b.slice(5,7), 16);

    var red = parseInt((1 - value) * a_r + value * b_r).toString(16);
    var green = parseInt((1 - value) * a_g + value * b_g).toString(16);
    var blue = parseInt((1 - value) * a_b + value * b_b).toString(16);

    if(red.length == 1) red = "0" + red;
    if(green.length == 1) green = "0" + green;
    if(blue.length == 1) blue = "0" + blue;

    var result = "#" + red + green + blue;
    return result;
  }

  function sortWounds(context_number, dataset,dataset3, wounds){
    //元データの値をコピーして利用する
    var sorted_data = dataset.slice(0, dataset.length);
    sorted_data =  sorted_data.sort(compareFunc);

    var result = [];

    //ソートした順にdataset3を並べ替える
    for(var i=0; i <= sorted_data.length; i++){
      for(var j=0; j <= sorted_data.length; j++){
        if(j == parseInt(state.target_id)){
          continue;
        }
        var name = "Wound" + String(j);
        //console.log(String(dataset3[name])+" : "+String(sorted_data[i]));
        if(dataset3[name] == sorted_data[i]){
          result.push(wounds[j]);
        }
      }

    }
    result.splice( parseInt(state.target_id), 0, wounds[ parseInt(state.target_id)]);
    return result;
  }

  function compareFunc(a, b) {
    return a - b;
  }


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
  //this.setState(this.props);
  return <svg id="graph_section2" className="graph_section" ref={node => this.node = node}>
  </svg>
}
}

//外部のファイルがこのcompnentを利用できるようにするエクスポート
export default Correlationgraph2;
