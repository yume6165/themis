import React, {Component} from 'react';
import './Correlationgraph.css';
import * as d3 from 'd3';
//import '../../../node_modules/d3-labeler/labeler.js';

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
class Mdsanalyst extends Component{

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
  var section = document.getElementById('graph_section4')
  section.innerHTML = '';

  const _self = this;
  const node = this.node

  //全体の設定
  var width = 1400,
      height = 800,
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


    var files = ["./results/output_file/anken_mds/0_no_context.csv",
                 "./results/output_file/anken_mds/1_incision_context.csv",
                 "./results/output_file/anken_mds/2_contusion_context.csv",
                 "./results/output_file/anken_mds/3_stab_context.csv"]


    var promises = [];
    var contexts = [];
    var context_numbers = {'no_context':0, 'incision_context':1, 'contusion_context':2, 'stab_context':3};//文脈データとそのidを管理する配列
    var context_info = [{"context":"no context", "number":0}, {"context":"incision", "number":1},
                        {"context":"contusion", "number":2}, {"context":"stab", "number":3}];
    var color_list = ["red", "orange", "green"];
    var link_color_list = ["#ff0000", "#ffa500", "#008000"];
    var color_pallete = ["#F0A58D","#F0CC97","#CE7FF0","#67F0CC","#5CAFF0","#A2F095","#aaaaaa"]
    var wounds = [];





    files.forEach(function(url){
      promises.push(d3.text(url))
    });

    Promise.all(promises).then(function(values){
      //console.log(values);
        contexts.push(values);
        contexts = contexts[0];
        //console.log(contexts);



        //創傷の表示位置を決定
        var context_number = parseInt(context_numbers[state.context]);
        //console.log("文脈番号は"+String(context_number));

        //プロットを出すためのデータ作成
        var dataset_mds = [];
        for(var i=0; i < contexts.length; i++){//文脈の番号
          var tmp = []; //文脈ごとに分けるための箱
          var data = contexts[i];
          data = data.split('\n');

          for(var j=0; j < data[0].length; j++){
              if(data[j] == "") break;
              tmp.push(String(data[j]).split(','));
            }
          dataset_mds.push(tmp);
          }

        console.log(dataset_mds);

        //創傷の登録をする
        for(var i=0; i < dataset_mds[0].length; i++){
            var name = "Wound" + String(i);
            const wound = new woundData(i, name, "", "");
            wounds.push(wound);
        }

        //ノードデータの作成
        var nodes =[];
          for(var i=0; i < wounds.length; i++){
            for(var j=0; j < 1; j++){
              //if(i == parseInt(state.target_id)) continue;
              var id = String(wounds[i].id) + "_c"+String(j);
              var label = "W" + String(wounds[i].id);
              var n = {"id" :id, "label":label, "number":i, "wound_no":wounds[i].id,
                        "pos_x":dataset_mds[j][i][0], "pos_y":dataset_mds[j][i][1]};
              nodes.push(n);
            }
          }


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
        var xScale = d3.scaleLinear()
          .domain([-10.0, 10.0])
          .range([margin.left, width - margin.right]);

        var yScale = d3.scaleLinear()
            .domain([-10.0, 10.0])
            .range([height - margin.bottom, margin.top]);

        var grid_x_size = 20;
        var grid_y_size = 20;

        // 4. 軸の表示
        var axisx = d3.axisBottom(xScale).ticks(grid_x_size)
        var axisy = d3.axisLeft(yScale).ticks(grid_y_size);

    //    var grid_x = svg.append("g")
    //        .attr("transform", "translate(" + -45 + "," + (height - margin.bottom) + ")")
    //        .call(d3.axisBottom(xScale)
    //        .ticks(grid_x_size)
    //        .tickSize(-height))
    //        .append("text")
    //        .attr("fill", "black")
    //        .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
    //        .attr("y", 35)
    //        .attr("text-anchor", "middle")
    //        .attr("font-size", "12pt")
    //        .attr("font-weight", "bold")
    //        .attr("stroke","#aaaaaa");

    //    var grid_y = svg.append("g")
    //        .attr("transform", "translate(" + "," + 0 + ")")
    //        .call( d3.axisLeft(yScale)
    //            .ticks(grid_y_size)
    //            .tickSize(-width + margin.left + margin.right))
    //        .append("text")
    //        .attr("fill", "black")
    //        .attr("x", -(height - margin.top - margin.bottom) / 2 - margin.top)
    //        .attr("y", -35)
    //        .attr("transform", "rotate(-90)")
    //        .attr("text-anchor", "middle")
    //        .attr("font-weight", "bold")
    //        .attr("font-size", "12pt")
    //        .attr("stroke","#aaaaaa");

            //var simulation = d3.forceSimulation()
            //.force("collide",d3.forceCollide().radius(function(d){return d.r;}).iterations(16) ) //衝突値の設定
            //.force("link", d3.forceLink().strength(1.0).distance(function(d){
            //    if(d.id<=10){
            //        return 200;
            //    }else{
        //            return 20;
        //        };}))
        //    .force("charge", d3.forceManyBody())  //反発力の設定
        //    .force("center", d3.forceCenter(width / 2, height / 2))  //svg領域の中心を重力の中心とする設定
        //    .force("x", d3.forceX().x(width / 2).strength(0.1))  //x方向に戻る力
        //    .force("y", d3.forceY().y(height / 2).strength(0.1)); //y方向に戻る力

        var pict_circle1 = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("opacity", function(d){
                    var opacity = 0;
                    if(d.wound_no == state.target_id) opacity = 0.2;
                    return opacity;})
            .attr("cx", function(d) { return xScale(d.pos_x); })
            .attr("cy", function(d) { return yScale(d.pos_y); })
            .attr("fill", function(d){return "#ffffff";})
            .attr("r", function(d){if(d.wound_no == state.target_id) return 600;})
            .attr("stroke",function(){return "#999999";})
            .attr("stroke-width", 10)
            .attr("stroke-dasharray", "10, 10");

        var pict_circle2 = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("opacity", function(d){
                    var opacity = 0;
                    if(d.wound_no == state.target_id) opacity = 0.2;
                    return opacity;})
            .attr("cx", function(d) { return xScale(d.pos_x); })
            .attr("cy", function(d) { return yScale(d.pos_y); })
            .attr("fill", function(d){return "#ffffff";})
            .attr("r", function(d){if(d.wound_no == state.target_id) return 500;})
            .attr("stroke",function(){return "#999999";})
            .attr("stroke-width", 10)
            .attr("stroke-dasharray", "10, 10");

        var pict_circle3 = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("opacity", function(d){
                    var opacity = 0;
                    if(d.wound_no == state.target_id) opacity = 0.2;
                    return opacity;})
            .attr("cx", function(d) { return xScale(d.pos_x); })
            .attr("cy", function(d) { return yScale(d.pos_y); })
            .attr("fill", function(d){return "#ffffff";})
            .attr("r", function(d){if(d.wound_no == state.target_id) return 400;})
            .attr("stroke",function(){return "#999999";})
            .attr("stroke-width", 10)
            .attr("stroke-dasharray", "10, 10");

        var pict_circle4 = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("opacity", function(d){
                    var opacity = 0;
                    if(d.wound_no == state.target_id) opacity = 0.2;
                    return opacity;})
            .attr("cx", function(d) { return xScale(d.pos_x); })
            .attr("cy", function(d) { return yScale(d.pos_y); })
            .attr("fill", function(d){return "#ffffff";})
            .attr("r", function(d){if(d.wound_no == state.target_id) return 300;})
            .attr("stroke",function(){return "#999999";})
            .attr("stroke-width", 10)
            .attr("stroke-dasharray", "10, 10");

        var pict_circle5 = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("opacity", function(d){
                    var opacity = 0;
                    if(d.wound_no == state.target_id) opacity = 0.2;
                    return opacity;})
            .attr("cx", function(d) { return xScale(d.pos_x); })
            .attr("cy", function(d) { return yScale(d.pos_y); })
            .attr("fill", function(d){return "#ffffff";})
            .attr("r", function(d){if(d.wound_no == state.target_id) return 200;})
            .attr("stroke",function(){return "#999999";})
            .attr("stroke-width", 10)
            .attr("stroke-dasharray", "10, 10");

        // "#a22041"
        var pict_circle6 = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("opacity", function(d){
                    var opacity = 0;
                    if(d.wound_no == state.target_id) opacity = 0.2;
                    return opacity;})
            .attr("cx", function(d) { return xScale(d.pos_x); })
            .attr("cy", function(d) { return yScale(d.pos_y); })
            .attr("fill", function(d){return "#ffffff";})
            .attr("r", function(d){if(d.wound_no == state.target_id) return 100;})
            .attr("stroke",function(){return "#999999";})
            .attr("stroke-width", 10)
            .attr("stroke-dasharray", "10, 10");

        var pict_link = g.append("g")
             .attr("class", "links")
             .selectAll("line")
             .data(nodes)
             .enter()
             .append("line")
             .attr("stroke", '#8ec54a')
             .attr("fill", "none")
             .attr("stroke-width",7)
             .attr("x1",0)
             .attr("y1",0)
             .attr("x2",1)
             .attr("y2",1)
             .attr("stroke-dasharray", "20, 10");


        var pict_node_past = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("id", function(d){return d.label;})
            .attr("cx", function(d) { return xScale(d.pos_x); })
            .attr("cy", function(d) { return yScale(d.pos_y); })
            .attr("fill", function(d){
                        if(d.wound_no == state.target_id){
                            return "#ff9999";
                        }else{
                            return "#999999";
                        }
                      })
            .attr("r", 8)
            .attr("stroke",function(){return "white";});


        var pict_label_past = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("text")
            .attr("x", function(d){ return xScale(d.pos_x);})
            .attr("y", function(d){ return yScale(d.pos_y);})
            .text(function(d){ return d.label;})
            .attr("dy", "-23px")
            .attr("dx", "-15px")
            .attr("stroke", "#aaaaaa")
            .attr("font-size", "30px")
            .attr("text-anchor", "middle");

        var pict_node = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("id", function(d){return d.label;})
            .attr("cx", function(d) { return xScale(d.pos_x); })
            .attr("cy", function(d) { return yScale(d.pos_y); })
            .attr("fill", function(d){
                        if(d.wound_no == state.target_id){
                            return "#ff0000";
                        }else{
                            return "#ffff00";
                        }
                      })
            .attr("r", 8)
            .attr("stroke",function(){return "white";});

        var pict_node_img = g.append("g")
            .attr("class", "wound_img")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("image")
            .attr("id", function(d){return d.label;})
            .attr("x", function(d) { return xScale(d.pos_x) - 38; })
            .attr("y", function(d) { return yScale(d.pos_y) - 30;})
            .attr("xlink:href",function(d){
                    var img = "../../results/original_img/ori_img_" + String(d.wound_no) + ".jpg";
                    return img;
            })//dwelling1.svg",
            .attr("width", 75)
            .attr("height", 60)
            .attr("radius", 50)
            .attr("opacity", 1);

        var label_array = [];
        var anchor_array = [];
        var past;
        var now;
        var size_w = 10;
        var size_h = 5;
        var count = 0;
        var pict_label = g.append("g")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("text")
            .attr("x", function(d){
                if(count == 0) return xScale(d.pos_x);
                now = [xScale(d.pos_x), yScale(d.pos_y)];
                past = label_repositioning(past, now, size_w, size_h);
                return past[0];})
            .attr("y", function(d){
                if(count == 0) return yScale(d.pos_y);
                count += 1;
                return past[1];})
            .text(function(d){
                var onFocus = function(){
                    d3.select("#" + id)
                    .attr("stroke", "blue")
                    .attr("stroke-width", "2");
                    };
                var onFocusLost = function(){
                    d3.select("#" + id)
                    .attr("stroke", "none")
                    .attr("stroke-width", "0");
                };
                label_array.push({"x": xScale(d.pos_x), "y": xScale(d.pos_y), "name":  d.label, "width": 0.0, "height": 0.0, "onFocus": onFocus, "onFocusLost": onFocusLost});
                anchor_array.push({"x": xScale(d.pos_x), "y": xScale(d.pos_x), "r": 8});
                return d.label;})
            .attr("dy", "-23px")
            .attr("dx", "-15px")
            .attr("stroke", "#555555")
            .attr("font-size", "30px")
            .attr("text-anchor", "middle");

//            var index = 0;
//            pict_label.each(function() {
//                label_array[index].width = this.getBBox().width;
//                label_array[index].height = this.getBBox().height;
//                index += 1;
//            });

    //    d3.labeler()
    //      .label(label_array)
    //      .anchor(anchor_array)
    //      .width(width)
    //      .height(height)
    //      .start(2000);

//        pict_label
//            .transition()
//            .duration(800)
//            .attr("x", function(d) { return (d.x); })
//            .attr("y", function(d) { return (d.y); });


        //var force = d3.forceSimulation(nodes)
        //    .force("collide",d3.forceCollide().radius(function(d){return 3;}).iterations(3) ) //衝突値の設定
        //    .force("charge", d3.forceManyBody().strength(-30))  //反発力の設定
        //    .force("center", d3.forceCenter(width / 2, height / 2))  //svg領域の中心を重力の中心とする設定
        //    .force("x", function(d){return d3.forceX().x(xScale(d.pos_x)).strength(1000);})  //x方向に戻る力
        //    .force("y", function(d){return d3.forceY().y(yScale(d.pos_y)).strength(1000);}) //y方向に戻る力

        //force.nodes(nodes)
        //     .on("tick", ticked_label);




            //simulation = d3.forceSimulation(nodes)
            //    .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.value*state.link_scale))
            //    .force("charge", d3.forceManyBody())
            //    .force("center", d3.forceCenter(width / 2, height / 2));

            //simulation
            //  .nodes(nodes)
            //  .on("tick", ticked);

            function ticked(){
                pict_node_img
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})

                pict_node_past
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})
                pict_label_past
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });

                pict_node
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})
                pict_label
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });

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

                pict_circle5
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})

                pict_circle6
                    .attr("cx", function(d){ return d.x;})
                    .attr("cy", function(d){ return d.y;})
            }

            function ticked_label(){
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

            function label_repositioning(past, now, size_w, size_h){
                var p_1 = [past[0] - size_w, past[1] - size_h];
                var p_2 = [past[0] + size_w, past[1] + size_h];

                var n_1 = [now[0] - size_w, now[1] - size_h];
                var n_2 = [now[0] - size_w, now[1] + size_h];
                var n_3 = [now[0] + size_w, now[1] - size_h];
                var n_4 = [now[0] + size_w, now[1] + size_h];

                var result;

                if(((p_1[0] <= n_1[0] && n_1[0] < p_2[0]) && (p_1[1] <= n_1[1] && n_1[1] < p_2[1])) == true){
                    result = [now[0] - size_w, now[1] - size_h];
                    return result;
                }

                else if(((p_1[0] <= n_2[0] && n_2[0] < p_2[0]) && (p_1[1] <= n_2[1] && n_2[1] < p_2[1])) == true){
                    result = [now[0] - size_w, now[1] + size_h];
                    return result;
                }

                else if(((p_1[0] <= n_3[0] && n_3[0] < p_2[0]) && (p_1[1] <= n_3[1] && n_3[1] < p_2[1])) == true){
                    result = [now[0] + size_w, now[1] - size_h];
                    return result;
                }

                else if(((p_1[0] <= n_4[0] && n_4[0] < p_2[0]) && (p_1[1] <= n_4[1] && n_4[1] < p_2[1])) == true){
                    result = [now[0] + size_w, now[1] + size_h];
                    return result;
                }

                return [now[0], now[1]];
            }



            //UIに関する記述
            var selecting_context = 0;
            var selecting_context_past = 0;
            var selecting_wound = 0;
            var selected_context = [{"id":0, "selected_context":0}];
            var selected_id = 0;


            var wound_info_timeline = svg.append('rect')
                .attr("x", -5) // 開始x座標
                .attr("y",700) // 開始y座標
                .attr("width",1410) // 横幅
                .attr("height",800) // 縦幅
                .attr("value", i)
                .attr("fill","#ffffff")　// 長方形の中の色
                .attr("stroke-width",5)　// 線の太さ
                .attr("stroke","#999999"); 　//線の色

            var time_line = svg.append('line')
                .attr("x1", -5)
                .attr("y1", 750)
                .attr("x2", 1410)
                .attr("y2",750)
                .attr("fill","#555555")　// 長方形の中の色
                .attr("stroke-width",3)　// 線の太さ
                .attr("stroke","#555555"); 　//線の色;

            var time_line_dot = svg.append('g')
                .selectAll('circle')
                .data(selected_context)
                .enter()
                .append('circle')
                .attr("cx", function(d) {
                            return 72 + 72 * d.id})
                .attr("cy", 750)
                .attr("fill", function(d){
                            return color_pallete[d.selected_context];
                          })
                .attr("r", 10)
                .attr("stroke", "white");


            var context_barMenu = svg.append("g")
            .selectAll('rect')
    		.data(context_info)
    		.enter()
    		.append('rect')
            .attr("x",function(d){ return d.number * 144; }) // 開始x座標
            .attr("y",0) // 開始y座標
            .attr("width",144) // 横幅
            .attr("height",50) // 縦幅
            .attr("value", i)
            .attr("fill", function(d){
                return color_pallete[d.number];
            })　// 長方形の中の色
            .attr("stroke-width",2)　// 線の太さ
            .attr("stroke",function(d){
                return color_pallete[d.number];
            }); 　//線の色

            var context_barMenu_label = svg.append("g")
            .selectAll('rect')
            .data(context_info)
            .enter()
            .append('text')
            .attr("x",function(d){ return d.number * 144 + 72; })
            .attr("y", 50)
            .text(function(d){ return d.context;})
            .attr("dy", "-18px")
            .attr("fill", "#ffffff")
            .attr("stroke", "#ffffff")
            .attr("font-size", "20px")
            .attr("text-anchor", "middle");


            var past_button= svg.append('rect')//前の仮説を消すためのボタン
            .attr("x", 866) // 開始x座標
            .attr("y",0) // 開始y座標
            .attr("width",140) // 横幅
            .attr("height",50) // 縦幅
            .attr("fill","#aaaaaa")　// 長方形の中の色
            .attr("opacity", 0)
            .attr("stroke-width",2)　// 線の太さ
            .attr("stroke","#aaaaaa"); 　//線の色

            var past_button_label = svg.append("g")
            .append('text')
            .attr("x", 938)
            .attr("y", 50)
            .text("Delete")
            .attr("dy", "-18px")
            .attr("fill", "#ffffff")
            .attr("stroke", "#ffffff")
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .attr("opacity",0);

            var time_line_dot_add;

            context_barMenu.on('click', function(d){
                selecting_context = d.number;
                var totalLength;
                var t;

                if(selecting_context != selecting_context_past){
                    var sample = new Promise(function(resolve, reject) {

                    var tmp1 = Number(selected_context.length);
                    var tmp2 = {"id": tmp1, "selected_context": 6};
                    var tmp3 = {"id": tmp1 + 1, "selected_context": selecting_context};
                    selected_context.push(tmp2);
                    selected_context.push(tmp3);

                    selected_id += 2;


                    time_line_dot_add = svg.append('g')
                        .selectAll('circle')
                        .data(selected_context)
                        .enter()
                        .append('circle')
                        .attr("cx", function(d) {
                                    var tmp = 72 + 72 * d.id;
                                    return tmp})
                        .attr("cy", 750)
                        .attr("fill", function(d){
                                    return color_pallete[d.selected_context];
                                  })
                        .attr("r", function(d){
                                    if(d.selected_context < 6){
                                        return 10;
                                    }else{
                                        return 7;
                                    }
                        })
                        .attr("stroke", "white");
                        resolve(time_line_dot_add);
                });

                    sample.then(function(value)
                    {
                        add_log(time_line_dot_add);
                    });

                }

                pict_node.transition().delay(500).duration(1000)
                         .attr("cx", function(n){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                         .attr("cy", function(n){return yScale(dataset_mds[selecting_context][n.wound_no][1]);});

                pict_node_img.transition().delay(500).duration(1000)
                        .attr("x", function(n){
                                                var t = xScale(dataset_mds[selecting_context][n.wound_no][0]) - 38;
                                                return t;})
                        .attr("y", function(n){
                                                var t = yScale(dataset_mds[selecting_context][n.wound_no][1]) - 30;
                                                return t;});

                pict_circle1.transition().delay(500).duration(1000)
                         .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                         .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle2.transition().delay(500).duration(1000)
                         .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                         .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle3.transition().delay(500).duration(1000)
                        .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                        .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle4.transition().delay(500).duration(1000)
                        .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                        .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle5.transition().delay(500).duration(1000)
                        .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                        .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle6.transition().delay(500).duration(1000)
                        .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                        .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_label.transition().delay(500).duration(1000)
                         .attr("x", function(){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                         .attr("y", function(){return yScale(dataset_mds[selecting_context][n.wound_no][1]);});

                pict_node_past.attr("opacity", 1);
                pict_label_past.attr("opacity", 1);

                pict_link.attr("x1",function(d){return  xScale(dataset_mds[selecting_context][d.wound_no][0]);})
                         .attr("y1",function(d){return  yScale(dataset_mds[selecting_context][d.wound_no][1]);})
                         .attr("x2",function(d){return  xScale(dataset_mds[selecting_context_past][d.wound_no][0]);})
                         .attr("y2",function(d){return  yScale(dataset_mds[selecting_context_past][d.wound_no][1]);})
                         .attr("opacity", 0);

                pict_link.transition().delay(1000).duration(1000).attr("opacity", 0.6);
                past_button.transition().duration(10).attr("opacity", 1);
                past_button_label.transition().duration(10).attr("opacity", 1);

                context_barMenu.attr("opacity", function(d){
                    if(d.number == selecting_context){
                        return 1;
                    }else if(d.number == selecting_context_past){
                        return 0.5;
                    }else{
                        return 0;
                    }
                });
                context_barMenu_label.attr("opacity", function(d){
                    if(d.number == selecting_context){
                        return 1;
                    }else if(d.number == selecting_context_past){
                        return 0.5;
                    }else{
                        return 0;
                    }
                });
    		});



            context_barMenu_label.on('click', function(d){
                selecting_context = d.number;
                var totalLength;
                var t;

                if(selecting_context != selecting_context_past){
                    var sample = new Promise(function(resolve, reject) {

                    var tmp1 = Number(selected_context.length);
                    var tmp2 = {"id": tmp1, "selected_context": 6};
                    var tmp3 = {"id": tmp1 + 1, "selected_context": selecting_context};
                    selected_context.push(tmp2);
                    selected_context.push(tmp3);

                    selected_id += 2;


                    time_line_dot_add = svg.append('g')
                        .selectAll('circle')
                        .data(selected_context)
                        .enter()
                        .append('circle')
                        .attr("cx", function(d) {
                                    var tmp = 72 + 72 * d.id;
                                    return tmp})
                        .attr("cy", 750)
                        .attr("fill", function(d){
                                    return color_pallete[d.selected_context];
                                  })
                        .attr("r", function(d){
                                    if(d.selected_context < 6){
                                        return 10;
                                    }else{
                                        return 7;
                                    }
                        })
                        .attr("stroke", "white");
                        resolve(time_line_dot_add);
                });

                    sample.then(function(value)
                    {
                        add_log(time_line_dot_add);
                    });

                }

                pict_node.transition().delay(500).duration(1000)
                         .attr("cx", function(n){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                         .attr("cy", function(n){return yScale(dataset_mds[selecting_context][n.wound_no][1]);});

                 pict_node_img.transition().delay(500).duration(1000)
                         .attr("x", function(n){
                                                         var t = xScale(dataset_mds[selecting_context][n.wound_no][0]) - 38;
                                                 return t;})
                         .attr("y", function(n){
                                                         var t = yScale(dataset_mds[selecting_context][n.wound_no][1]) - 30;
                                     return t;});

                pict_circle1.transition().delay(500).duration(1000)
                          .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                          .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle2.transition().delay(500).duration(1000)
                          .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                          .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle3.transition().delay(500).duration(1000)
                          .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                          .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle4.transition().delay(500).duration(1000)
                          .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                          .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle5.transition().delay(500).duration(1000)
                          .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                          .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_circle6.transition().delay(500).duration(1000)
                          .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                          .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                pict_label.transition().delay(500).duration(1000)
                         .attr("x", function(n){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                         .attr("y", function(n){return yScale(dataset_mds[selecting_context][n.wound_no][1]);});

                pict_node_past.attr("opacity", 1);
                pict_label_past.attr("opacity", 1);

                pict_link.attr("x1",function(d){return  xScale(dataset_mds[selecting_context][d.wound_no][0]);})
                         .attr("y1",function(d){return  yScale(dataset_mds[selecting_context][d.wound_no][1]);})
                         .attr("x2",function(d){return  xScale(dataset_mds[selecting_context_past][d.wound_no][0]);})
                         .attr("y2",function(d){return  yScale(dataset_mds[selecting_context_past][d.wound_no][1]);})
                         .attr("opacity", 0);

                pict_link.transition().delay(1000).duration(1000).attr("opacity", 0.6);
                past_button.transition().duration(10).attr("opacity", 1);
                past_button_label.transition().duration(10).attr("opacity", 1);

                context_barMenu.attr("opacity", function(d){
                    if(d.number == selecting_context){
                        return 1;
                    }else if(d.number == selecting_context_past){
                        return 0.5;
                    }else{
                        return 0;
                    }
                });
                context_barMenu_label.attr("opacity", function(d){
                    if(d.number == selecting_context){
                        return 1;
                    }else if(d.number == selecting_context_past){
                        return 0.5;
                    }else{
                        return 0;
                    }
                });
    		});

            //前の仮説に戻る
            function add_log(object){
                //console.log(object);
                object.on('click', function(d){
                //もし成傷機転の間のdotなら
                if(d.selected_context == 6)
                {
                    var past_no = Number(d.id) - 1;
                    var father_no = Number(d.id) + 1;
                    console.log(past_no);
                    console.log(father_no);

                    selecting_context = selected_context[father_no].selected_context;
                    selecting_context_past = selected_context[past_no].selected_context;
                    var totalLength;
                    var t;

                    pict_node.transition().delay(500).duration(1000)
                             .attr("cx", function(n){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                             .attr("cy", function(n){return yScale(dataset_mds[selecting_context][n.wound_no][1]);});

                    pict_node_img.transition().delay(500).duration(1000)
                             .attr("x", function(n){
                                                             var t = xScale(dataset_mds[selecting_context][n.wound_no][0]) - 38;
                                                     return t;})
                             .attr("y", function(n){
                                                             var t = yScale(dataset_mds[selecting_context][n.wound_no][1]) - 30;
                                         return t;});

                    pict_circle1.transition().delay(500).duration(1000)
                              .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                              .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                    pict_circle2.transition().delay(500).duration(1000)
                              .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                              .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                    pict_circle3.transition().delay(500).duration(1000)
                              .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                              .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                    pict_circle4.transition().delay(500).duration(1000)
                              .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                              .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                    pict_circle5.transition().delay(500).duration(1000)
                              .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                              .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                    pict_circle6.transition().delay(500).duration(1000)
                              .attr("cx", function(){return xScale(dataset_mds[selecting_context][state.target_id][0]);})
                              .attr("cy", function(){return yScale(dataset_mds[selecting_context][state.target_id][1]);});

                    pict_label.transition().delay(500).duration(1000)
                             .attr("x", function(n){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                             .attr("y", function(n){return yScale(dataset_mds[selecting_context][n.wound_no][1]);});

                    pict_node_past.attr("opacity", 1);
                    pict_label_past.attr("opacity", 1);

                    pict_link.attr("x1",function(d){return  xScale(dataset_mds[selecting_context][d.wound_no][0]);})
                             .attr("y1",function(d){return  yScale(dataset_mds[selecting_context][d.wound_no][1]);})
                             .attr("x2",function(d){return  xScale(dataset_mds[selecting_context_past][d.wound_no][0]);})
                             .attr("y2",function(d){return  yScale(dataset_mds[selecting_context_past][d.wound_no][1]);})
                             .attr("opacity", 0);

                    pict_label_past
                             .attr("x", function(n){return xScale(dataset_mds[selecting_context_past][n.wound_no][0]);})
                             .attr("y", function(n){return yScale(dataset_mds[selecting_context_past][n.wound_no][1]);})
                             .attr("opacity", 1);

                    pict_node_past
                             .attr("cx", function(n){return xScale(dataset_mds[selecting_context_past][n.wound_no][0]);})
                             .attr("cy", function(n){return yScale(dataset_mds[selecting_context_past][n.wound_no][1]);})
                             .attr("opacity", 1);

                    pict_link.transition().delay(1000).duration(1000).attr("opacity", 0.6);
                    past_button.transition().duration(10).attr("opacity", 1);
                    past_button_label.transition().duration(10).attr("opacity", 1);

                    context_barMenu.attr("opacity", function(d){
                        if(d.number == selecting_context){
                            return 1;
                        }else if(d.number == selecting_context_past){
                            return 0.5;
                        }else{
                            return 0;
                        }
                    });
                    context_barMenu_label.attr("opacity", function(d){
                        if(d.number == selecting_context){
                            return 1;
                        }else if(d.number == selecting_context_past){
                            return 0.5;
                        }else{
                            return 0;
                        }
                    });



                }else{//もし成傷機転のdotなら
                    return 0;
                }

            });
        }

            //ひとつ前の仮説を消す
            past_button.on('click', function(d){
                pict_node_past
                         .attr("cx", function(n){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                         .attr("cy", function(n){return yScale(dataset_mds[selecting_context][n.wound_no][1]);})
                         .attr("opacity", 0);

                pict_label_past
                         .attr("x", function(n){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                         .attr("y", function(n){return yScale(dataset_mds[selecting_context][n.wound_no][1]);})
                         .attr("opacity", 0);

                selecting_context_past = selecting_context;
                past_button.attr("opacity", 0);
                pict_link.attr("opacity", 0);
                context_barMenu.attr("opacity", 1);
                context_barMenu_label.attr("opacity", 1);
            });

            past_button_label.on('click', function(d){
                pict_node_past
                         .attr("cx", function(n){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                         .attr("cy", function(n){return yScale(dataset_mds[selecting_context][n.wound_no][1]);})
                         .attr("opacity", 0);

                pict_label_past
                         .attr("x", function(n){return xScale(dataset_mds[selecting_context][n.wound_no][0]);})
                         .attr("y", function(n){return yScale(dataset_mds[selecting_context][n.wound_no][1]);})
                         .attr("opacity", 0);

                selecting_context_past = selecting_context;
                past_button.attr("opacity", 0);
                pict_link.attr("opacity", 0);
                context_barMenu.attr("opacity", 1);
                context_barMenu_label.attr("opacity", 1);
            });


            var wound_info_table = svg.append('rect')
                .attr("x", 1008) // 開始x座標
                .attr("y",-5) // 開始y座標
                .attr("width",500) // 横幅
                .attr("height",705) // 縦幅
                .attr("value", i)
                .attr("fill","#ffffff")　// 長方形の中の色
                .attr("stroke-width",5)　// 線の太さ
                .attr("stroke","#999999"); 　//線の色

            var target_wound_info_name = svg.append('text')
                .attr("x", 1065)
                .attr("y", 45)
                .text(function(){
                    var id = "W" + String(selecting_wound);
                    return "Target: " + id;
                })
                .attr("dy", "-18px")
                .attr("fill", "#666666")
                .attr("font-size", "20px")
                .attr("text-anchor", "middle");

            var target_wound_info_image = svg.append('image')
                .attr('xlink:href', function () {
                                      var name = "./results/original_img/ori_img_" + String(selecting_wound) + ".jpg";
                                      return name;})
                .attr('width', 120)
                .attr('height', 120)
                .attr('x', 1025)
                .attr('y', 25);

            var wound_info_name = svg.append('text')
            .attr("x", 1080)
            .attr("y", 195)
            .text(function(){
                var id = "W" + String(selecting_wound);
                return "Selecting: " + id;
            })
            .attr("dy", "-18px")
            .attr("fill", "#666666")
            .attr("font-size", "20px")
            .attr("text-anchor", "middle");

            var wound_info_image = svg.append('image')
            .attr('xlink:href', function () {
                                  var name = "./results/original_img/ori_img_" + String(selecting_wound) + ".jpg";
                                  return name;})
            .attr('width', 120)
            .attr('height', 120)
            .attr('x', 1025)
            .attr('y', 175);

            //表示する画像の変更
            pict_node.on('click',function(d){
                selecting_wound = d.number;
                var path = "./results/original_img/ori_img_" + String(selecting_wound) + ".jpg";
                var name = "Selecting: W" + String(selecting_wound);
                wound_info_image.attr('xlink:href', path);
                wound_info_name.text(name);
            });

            pict_label.on('click',function(d){
                selecting_wound = d.number;
                var name = "./results/original_img/ori_img_" + String(selecting_wound) + ".jpg";
                wound_info_image.attr('xlink:href', name);
            });

            pict_node_img.on('click',function(d){
                selecting_wound = d.number;
                var path = "./results/original_img/ori_img_" + String(selecting_wound) + ".jpg";
                var name = "Selecting: W" + String(selecting_wound);
                wound_info_image.attr('xlink:href', path);
                wound_info_name.text(name);
            });

            pict_label.on('click',function(d){
                selecting_wound = d.number;
                var name = "./results/original_img/ori_img_" + String(selecting_wound) + ".jpg";
                wound_info_image.attr('xlink:href', name);
            });

            var wound_info_outline = svg.append('text')
            .attr("x", 1060)
            .attr("y", 400)
            .text(function(){
                return "Outline";
            })
            .attr("dy", "-18px")
            .attr("fill", "#666666")
            .attr("font-size", "20px")
            .attr("text-anchor", "middle");


            var grid_label = svg.append('text')
            .attr("x", 50)
            .attr("y", 700)
            .text(function(){
                return "□ Grid";
            })
            .attr("dy", "-18px")
            .attr("fill", "#666666")
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .on("click", function(){
                //grid_x.atter("opacity",0);
                //grid_y.atter("opacity",0);
            });

            var contour_flag = 0;
            var contour_label = svg.append('text')
            .attr("x", 150)
            .attr("y", 700)
            .text(function(){
                if(contour_flag == 0){
                    return "■ Contour";
                }else{
                    return "□ Contour"
                }
            })
            .attr("dy", "-18px")
            .attr("fill", "#666666")
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .on("click", function(){
                if(contour_flag == 0){
                    pict_circle1.attr("opacity",0);
                    pict_circle2.attr("opacity",0);
                    pict_circle3.attr("opacity",0);
                    pict_circle4.attr("opacity",0);
                    pict_circle5.attr("opacity",0);
                    pict_circle6.attr("opacity",0);
                    contour_flag = 1;
                }else{
                    pict_circle1.attr("opacity",0.2);
                    pict_circle2.attr("opacity",0.2);
                    pict_circle3.attr("opacity",0.2);
                    pict_circle4.attr("opacity",0.2);
                    pict_circle5.attr("opacity",0.2);
                    pict_circle6.attr("opacity",0.2);
                    contour_flag = 0;
                }
            });



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
        //function dragstarted(d){
        //    if(!d3.event.active) simulation.alphaTarget(.03).restart();
        //    d.fx = d.x;
        //    d.fy = d.y;        }

        //function dragged(d){
        //    d.fx = d3.event.x;
        //    d.fy = d3.event.y;
        //}

        //function draggended(d){
        //    if(!d3.event.active) simulation.alphaTarget(.03);
        //    d.fx = null;
        //    d.fy = null;
        //}


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
  return <svg id="graph_section4" className="graph_section" ref={node => this.node = node}>
  </svg>
}
}

//外部のファイルがこのcompnentを利用できるようにするエクスポート
export default Mdsanalyst;
