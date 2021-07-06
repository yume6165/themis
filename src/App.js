import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import * as d3 from 'd3';

//Tilte.jsをインポートする
import Title from './components/Title/Title';
//import Correlationgraph from './components/Correlationgraph/Correlationgraph';
//import Correlationgraph2 from './components/Correlationgraph/Correlationgraph2';
//import Correlationgraph3 from './components/Correlationgraph/Correlationgraph3';
import Mdsanalyst from './components/Correlationgraph/Mdsanalyst';
import LeftMenu from './components/LeftMenu/LeftMenu';
import Test from './components/Correlationgraph/test';

class App extends Component{

  state = {context: 'no_context',
           target_id:0,
           link_range: 100,
           link_scale:200
       }

  onClickHandler = () => {
    //10は10進数の意味
    let nextVersion = parseInt(this.state.version, 10) + 1;
    //Fixedは小数点の位置を指定させてくれる
    this.setState({version: nextVersion.toFixed(1)});
  }

  updateState = (s)=>{
    this.setState(s);
    this.render();
  }



  render(){
    //upgradeButtonの初期の要素
    let upgradeButton = (
      <p
        onClick={this.onClickHandler}
        id="upgradeButton"
        className="upgrade-button"
      >Upgrade</p>
    );

    if( this.state.version === '5.0'){
      upgradeButton = (
        <p
          className="upgraded-button"
        >Already up-to-date</p>
      );
    }

  return (


    <div className="App">
      <header className="App-header">
        <div className="App-title">
            <i class="fas fa-balance-scale"></i>THEMIS<p>Theoretical Estimation of Meaning of InSults</p>
        </div>

      </header>



      <body className="App-body">
        <div className="LeftMenu">
          <LeftMenu updateState={this.updateState} />
        </div>

        <div class="tab_wrap">
            <input id="tab1" type="radio" name="tab_btn" />
            <input id="tab2" type="radio" name="tab_btn" />
            <input id="tab3" type="radio" name="tab_btn" />
            <input id="tab4" type="radio" name="tab_btn" checked/>

            <div className="tab_area">
                <label className="tab1_label" for="tab1">Original</label>
                <label className="tab2_label" for="tab2">Contour</label>
                <label className="tab3_label" for="tab3">Colleration</label>
                <label className="tab4_label" for="tab4">MDS</label>
            </div>

            <div class="panel_area">
                <div id="panel1" class="tab_panel">
                    <div className="Correlationgraph" id="Correlationgraph">
                    
                    </div>
                </div>

                <div id="panel2" class="tab_panel">
                    <div className="Correlationgraph2" id="Correlationgraph2">

                    </div>
                </div>

                <div id="panel3" class="tab_panel">
                    <div className="Correlationgraph3" id="Correlationgraph3">

                    </div>
                </div>

                <div id="panel4" class="tab_panel">
                    <div className="Correlationgraph4" id="Mdsanalyst">
                    <Mdsanalyst context={this.state} />
                    </div>
                </div>

            </div>
        </div>









      </body>

    </div>
  );
}
}

export default App;
