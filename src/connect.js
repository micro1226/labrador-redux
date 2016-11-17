/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-11-09
 * @author Li <li@maichong.it>
 */
// @flow

import type { Component } from 'labrador';
import * as utils from 'labrador/utils';
import { getStore } from './util/store';

const defaultMapStateToProps: Function = () => ({});

export default function connect(mapStateToProps: Function) {
  const shouldSubscribe: boolean = mapStateToProps !== null && mapStateToProps !== undefined;
  const mapState: Function = mapStateToProps || defaultMapStateToProps;

  return function wrapWithConnect(component: Component) {
    if (!shouldSubscribe) {
      return component;
    }
    let unSubscribe: Function;
    let onLoad: Function = component.prototype.onLoad;
    let onUnload: Function = component.prototype.onUnload;

    function onStateChange() {
      let mappedProps: $DataMap = mapState(getStore().getState());
      if (!utils.shouldUpdate(this.props, mappedProps)) {
        return;
      }
      let nextProps: $DataMap;
      if (this.props && this.props.merge && this.props.asMutable) {
        nextProps = this.props.merge(mappedProps);
      } else {
        nextProps = Object.assign({}, this.props, mappedProps);
      }
      if (this.onUpdate) {
        this.onUpdate(nextProps);
        if (__DEV__) {
          // Development
          console.log('%c%s onUpdate(%o) Component:%o',
            'color:#2a8f99',
            this.id, utils.getDebugObject(nextProps),
            this
          );
        }
        this._update();
      }
      this.props = nextProps;
    }

    component.prototype.onLoad = function (...args) {
      let store: $DataMap = getStore();
      if (!store) {
        console.error('store对象不存在,请前往"app.js"文件中使用"redux"创建store,并传参到"labrador-redux"的setStore()方法中');
      }
      unSubscribe = store.subscribe(onStateChange.bind(this));
      onStateChange.call(this);
      if (onLoad) {
        onLoad.apply(this, args);
      }
    };

    component.prototype.onUnload = function () {
      unSubscribe();
      if (onUnload) {
        onUnload.call(this);
      }
    };

    return component;
  };
}
