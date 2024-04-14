import { MergeTypeError } from './rf-util-error.js';

/**
 * Merge the objects source and destiny. The result is the merged object. But, if the replace option is defined the destiny object is updated.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merging options. It's can be a array in this case merge only the specified properties.
 *  - properties {array} - list of properties to merge.
 *  - replace {boolean} - if it's true the destiny object is updated with the source values.
 *  - deep {number} - if it's defined and other than zero object values are merged too, until the epecified level.
 *  - skipExistent {bool} - if it's true the destiny values are no overriden.
 * @returns {object} - the merged object.
 */
export function merge(dst, src, options) {
  if (!src) {
    return dst;
  }

  if (Array.isArray(src)) {
    if (!dst) {
      dst = [];
    } else if (!Array.isArray(dst)) {
      throw new MergeTypeError(typeof dst, typeof src);
    }

    let result;
    if (options?.replace) {
      result = dst;
    } else {
      result = [...dst];
    }

    if (options?.deep) {
      const deepOptions = merge(options, {});
      if (deepOptions.deep > 0) {
        deepOptions.deep--;
      }
                
      for (let i = 0, e = src.length; i < e; i++) {
        let v = src[i];
        if (v && typeof v === 'object') {
          if (Array.isArray(v)) {
            v = merge([], v, deepOptions);
          } else {
            v = merge({}, v, deepOptions);
          }
        }

        result.push(v);
      }
    } else {
      result.push(...src);
    }

    return result;
  }

  if (!dst) {
    dst = {};
  } else if (Array.isArray(dst)) {
    throw new MergeTypeError(typeof dst, typeof src);
  }

  let properties;
  if (Array.isArray(options)) {
    properties = options;
    options = {};
  } else {
    properties = options?.properties;
  }
        
  if (properties === undefined) {
    properties = Object.keys(src);
  }

  let result;
  if (options?.replace) {
    result = dst;
  } else {
    result = {};
    for (const k in dst) {
      result[k] = dst[k];
    }
  }

  if (options?.deep) {
    const deepOptions = merge(options, {});
    if (deepOptions.deep > 0) {
      deepOptions.deep--;
    }

    for(let i = 0, e = properties.length; i < e; i++) {
      const p = properties[i];
      let isSrcObject = typeof src[p] === 'object';
      let v;

      if (dst[p] === undefined) {
        if (isSrcObject) {
          if (Array.isArray(src[p])) {
            v = merge([], src[p], deepOptions);
          } else if (Buffer.isBuffer(src[p])) {
            v = Buffer.from(src[p]);
          } else if (src[p] === null) {
            v = null;
          } else {
            v = merge({}, src[p], deepOptions);
          }
        } else {
          v = src[p];
        }
      } else {
        let isDstObject = typeof dst[p] === 'object';

        if (isDstObject) {
          if (isSrcObject && deepOptions.deep && !Buffer.isBuffer(src[p])) {
            v = merge(dst[p], src[p], deepOptions);
          } else if (options?.skipExistent) {
            v = dst[p];
          } else {
            v = src[p];
          }
        } else if (options?.skipExistent) {
          v = dst[p] || src[p];
        } else {
          v = src[p] || dst[p];
        }
      }

      result[p] = v;
    }
  } else if (options?.skipExistent) {
    for(let i = 0, e = properties.length; i < e; i++) {
      const p = properties[i];
      result[p] = dst[p] ?? src[p];
    }
  } else {
    for(let i = 0, e = properties.length; i < e; i++) {
      const p = properties[i];
      result[p] = src[p] ?? dst[p];
    }
  }
    
  return result;
}

/**
 * Deep version for the merge method. @see compelte method.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merge options @see merge method.
 * @returns {object} - the destiny
 */
export function deepMerge(dst, src) {
  return merge(dst, src, { deep: -1 });
}

/**
 * Complete the properties of the destiny object whit the source object. If the destiny object is null or undefined returns a new object whit the source values.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merge options @see merge method.
 * @returns {object} - the destiny
 */
export function complete(dst, src, options) {
  return merge(dst, src, merge(options, { skipExistent: true, replace: true }));
}

/**
 * Deep version for the complete method. @see compelte method.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merge options @see merge method.
 * @returns {object} - the destiny
 */
export function deepComplete(dst, src, options) {
  return merge(dst, src, merge(options, { skipExistent: true, replace: true, deep: -1 }));
}

/**
 * Replace the values of properties of destiny with the source properties values.
 * @param {object} dst - destiny
 * @param {object} src - source
 * @param {Options} options - merge options @see merge method.
 * @returns {object} - the destiny
 */
export function replace(dst, src, options) {
  return merge(dst, src, merge(options, { replace: true }));
}
