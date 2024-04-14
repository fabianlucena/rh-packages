const dependencies = {};

export function lcfirst(text) {
  return text[0].toLowerCase() + text.slice(1);
}

function addDependency(name, dependencyData) {
  if (!dependencyData.dependency) {
    dependencyData.dependency = name;
    if (dependencyData.static) {
      name = dependencyData.dependency.constructor;
    } else if (dependencyData.singleton) {
      name = lcfirst(dependencyData.dependency.name);
    }

    if (!name) {
      throw new Error(`No name provided for dependency ${dependencyData.dependency}.`);
    }
  }

  if (dependencies[name]) {
    throw new Error(`Dependency ${name} already exists.`);
  }

  dependencies[name] = dependencyData;
}

export function addStatic(name, dependency) {
  addDependency(name, { dependency, static: true });
}

export function addSingleton(name, dependency) {
  addDependency(name, { dependency, singleton: true });
}

export function addScoped(name, dependency) {
  addDependency(name, { dependency, scoped: true });
}

export function addTransient(name, dependency) {
  addDependency(name, { dependency, transient: true });
}

export function get(name, defaultValue) {
  return _getDependency(name, null, defaultValue);
}

export function getDependency(name, defaultValue) {
  return _getDependency(name, null, defaultValue);
}

export function getScoped(name, scope, defaultValue) {
  return _getDependency(name, scope, defaultValue);
}

function _getDependency(name, scope, defaultValue) {
  const dependency = dependencies[name];
  if (!dependency) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(`Dependency ${name} does not exist.`);
  }

  if (dependency.static) {
    return dependency.dependency;
  }

  if (dependency.singleton) {
    if (!dependency.value) {
      if (dependency.dependency.singleton) {
        dependency.value = dependency.dependency.singleton();
      } else if (dependency.dependency.factory) {
        dependency.value = dependency.dependency.factory();
      } else if (dependency.dependency.create) {
        dependency.value = dependency.dependency.create();
      } else {
        dependency.value = new dependency.dependency();
      }
    }

    return dependency.value;
  }

  if (dependency.transient) {
    return new dependency.dependency();
  }

  if (dependency.scoped) {
    if (!scope) {
      if (!dependency.value) {
        dependency.value = new dependency.dependency();
      }
    }

    dependency.scopes ??= {};

    if (!dependency.scope[scope]) {
      dependency.scope[scope] = new dependency.dependency();
    }

    return dependency.scope[scope];
  }

  throw new Error(`Error in dependency lifetime definition ${name}.`);
}


export default {
  addStatic,
  addSingleton,
  addScoped,
  addTransient,
  get,
  getDependency,
  getScoped,
};