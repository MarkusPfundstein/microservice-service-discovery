class MicroService {
  async init({
    name,
    plugins,
    state,
    observers,
    emitters,
    api,
  }) {
    if (!name) {
      return Promise.reject(new Error('name required'));
    }

    this.name = name;
    this.__state = { ...state };

    await this._initializePlugins(plugins);
    await this._initializeObservers(observers);
    await this._initializeEmitters(emitters);
    await this._initializeApi(api);
  }

  async _initializePlugins(plugins) {
    for (let [plugin, pluginConfig] of plugins) {
      await plugin.init(pluginConfig);
    }
  }

  async _initializeObservers(observers) {
    return await observers.forEach(async (observerFun) => {
      await observerFun(this);
    });
  }

  async _initializeEmitters(emitters) {
    return await emitters.forEach(async (emitterFun) => {
      await emitterFun(this);
    });
  }

  async _initializeApi(api) {
    return await api.forEach(async (apiFun) => {
      await apiFun(this);
    });
  }

  assignEmitter(emitterName, fn) {
    if (this[emitterName] != null) {
      throw new Error(`${emitterName} already property of ${this.name}`);
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
