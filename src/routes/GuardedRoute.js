import React from "react";
import { Route, Redirect } from "react-router-dom";
import auth from './Auth'


function GuardedRoute(props) {
  const { component: Component, path } = props;
  return (
    <Route
      exact
      path={path}
      render={props => {
        if (!auth.isAuthenticated()) {
          console.log('login');
          return <Redirect push to="/login" />
        }
        return <Component {...props} />
      }}
    />
  );
}

export default GuardedRoute;
