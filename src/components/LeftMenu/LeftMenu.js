import React from 'react';
import './LeftMenu.css';

//JSXやメゾットを定義する実質上の中身
class LeftMenu extends React.Component {
  constructor(props){
    super(props);

    //関数をバインド
    this.app_context = this.app_context.bind(this);
    this.link_scale_add = this.link_scale_add.bind(this);
    this.link_scale_sub = this.link_scale_sub.bind(this);
    this.link_scale_rst = this.link_scale_rst.bind(this);

    this.state = {
      context : "no_context",
      link_range: 100,
      link_scale:200
    };

}
  app_context(){
    //console.log("Hello");
    const newContext = document.getElementById("select_context").value;
    const newTarget = document.getElementById("select_target").selectedIndex;
    this.setState({
      context: newContext,
      target_id:newTarget
    });
    //親コンポーネントを更新
    console.log(this.state);
    this.props.updateState({
      context: newContext,
      target_id:newTarget
    });
  }

  link_scale_add(){
      const tmp = document.getElementById("link_scale");
      var new_link_scale = Number(tmp.placeholder) + 50;
      this.setState({
        link_scale: new_link_scale
      });
      tmp.placeholder = new_link_scale;

      //親コンポーネントを更新
      console.log(this.state);
      this.props.updateState({
        link_scale: new_link_scale
      });

  }

  link_scale_sub(){
      const tmp = document.getElementById("link_scale");
      var new_link_scale = Number(tmp.placeholder) - 10;
      this.setState({
        link_scale: new_link_scale
      });
      tmp.placeholder = new_link_scale;

      //親コンポーネントを更新
      console.log(this.state);
      this.props.updateState({
        link_scale: new_link_scale
      });
  }

  link_scale_rst(){
      const tmp = document.getElementById("link_scale");
      var new_link_scale = 200;
      this.setState({
        link_scale: new_link_scale
      });
      tmp.placeholder = new_link_scale;

      //親コンポーネントを更新
      console.log(this.state);
      this.props.updateState({
        link_scale: new_link_scale
      });
  }

  updateState(state){
    this.setState(state);
    //親コンポーネントを更新
    this.props.updateState(state);
  }

  link_rangeChange = (e) => {
    const index = e.target.value;
    this.setState({ link_range:index });
    //親コンポーネントを更新
    console.log(this.state);
    this.props.updateState({
      link_range:index
    });

  };


  render(){
    return(
      <div>
        <div className="main_title">Menu</div><br></br>
        <div className="menu_box">
        <input id="acd-check3" className="acd-check" type="checkbox" />
        <label className="acd-label" for="acd-check3"><i class="fas fa-cog" /> General</label>
        <div className="acd-content">
            <div className="subtitle">Context</div>
            <select id="select_context">
                <option value="no_context">No context</option>
                <option value="incision_context">Incision context</option>
                <option value="contusion_context">Contusion context</option>
				<option value="stab_context">Stab context</option>
            </select><br></br>

            <div className="subtitle">Target wound</div>
            <select id="select_target">
                <option value="0">Wound0</option>
                <option value="1">Wound1</option>
                <option value="3">Wound2</option>
            </select><br></br>

            <button onClick={this.app_context}>
                     apply
            </button>
        </div>
        </div>

        <div className="menu_box">
        <input id="acd-check2" className="acd-check" type="checkbox" />
        <label className="acd-label" for="acd-check2"><i class="fas fa-draw-polygon" /> Graph</label>
        <div className="acd-content">
            <div className="subtitle">Links rate</div>
            <input type="range" id="link_range" min={0} max={100} step={10}
                    value={this.state.link_range} onChange={this.link_rangeChange} />
                    {this.state.link_range}％<br></br>

            <div className="subtitle">Links scale</div>
            <input type="text" id="link_scale" placeholder={this.state.link_scale}/>
            <button onClick={this.link_scale_add}>
                     +
            </button>
            <button onClick={this.link_scale_sub}>
                     -
            </button>
            <button onClick={this.link_scale_sub}>
                     reset
            </button>

        </div>
        </div>

      </div>


    );
  };
}


//外部のファイルがこのcompnentを利用できるようにするeエクスポート
export default LeftMenu;
