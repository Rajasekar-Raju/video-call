import React from "react";

import { css } from "@emotion/core";
import PulseLoader from "react-spinners/PulseLoader";

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

export default class Progressbar extends React.Component {
    render() {
        if (this.props.show) {
            return (
                <div className="sweet-loading">
                    <PulseLoader
                        css={override}
                        size={15}
                        margin={2}
                        color={"#2c5566"}
                        loading={this.props.show}
                    />
                </div>

            );
        }

        return null;
    }
}
