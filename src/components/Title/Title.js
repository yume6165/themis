//Title.js

import React from 'react';
import './Title.css';

//JSXやメゾットを定義する実質上の中身
const Title = (props) =>{
  return(
    <div>
      <h2
        style={props.titleStyle}
        id="versionStatemant">{props.children}</h2>

      
    </div>
  );
}

//外部のファイルがこのcompnentを利用できるようにするeエクスポート
export default Title;
