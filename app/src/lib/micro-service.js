class MicroService {
  async init({
    plugins,
    initialState,
    observers,
    emitters,
    api,
  }) {
    this.__state = initialState || {};

    await this._initializePlugins(plugins);
  }

  async _initializePlugins(plugins) {
    for (let initFun of plugins) {
      await initFun(this);
    }
  }

  assignEmitter(emitterName, fn) {
    if (this[emitterName] != null) {
      throw new Error(`${emitterName} is already a property`);
    }
    this[emitterName] = fn;
  }

  getState() {
    return this.__state;
  }

  setState(updateState) {
    this.__state = {
      ...this.__state,
      ...updateState,
    };
    return this.getState();
  }
}

module.exports = MicroService;
