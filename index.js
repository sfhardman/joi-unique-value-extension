const getNextPath = searchPathChunks => searchPathChunks
  .filter((chunk, index) => index > 0)
  .join('.');

const getSearchValues = (searchPath, data) => {
  const searchPathChunks = searchPath.split('.').filter(chunk => !!chunk);
  if (!searchPathChunks.length) {
    return [data];
  }  
  const currentChunk = searchPathChunks[0];
  if (currentChunk === '[]') {
    if (!Array.isArray(data)) {
      return [];
    };
    const result = [];
    data.forEach(item => result.push(...getSearchValues(getNextPath(searchPathChunks), item)));
    return result;
  }
  if (!data[currentChunk]) {
    return [];
  }
  return getSearchValues(getNextPath(searchPathChunks), data[currentChunk]);
};

const createCache = (searchPaths, data) => {
  const result = [];
  searchPaths.forEach(searchPath => result.push(...getSearchValues(searchPath, data)));
  return result;
};

const joiUniqueBaseExtension = (joi, baseType) => ({
  name: baseType,
  base: joi[baseType](),
  language: {
    noContext: 'The data to look for duplicate values in must be passed in options.context.data',
    duplicateFound: '"{{value}}" was required to be unique, but a duplicate was found',
  },  
  rules: [
    {
      name: 'unique',
      params: {
        searchPath: joi.alternatives([
          joi.string(),
          joi.array().items(joi.string()),
        ]).required(),
      },
      validate: (params, value, state, options) => {
        if (!(options && options.context && options.context.data)) {
          return joi.createError(`${baseType}.noContext`,
            null, state, options);
        }
        const searchPaths = Array.isArray(params.searchPath) ? params.searchPath : [ params.searchPath ];
        const cacheKey = searchPaths.join(',');

        options.context._uniqueValueCache = options.context._uniqueValueCache || {};

        if (!options.context._uniqueValueCache[cacheKey]) {
          options.context._uniqueValueCache[cacheKey] = createCache(searchPaths, options.context.data);
        }

        let count = 0;
        for (let i = 0; i < options.context._uniqueValueCache[cacheKey].length; i += 1) {
          if (value === options.context._uniqueValueCache[cacheKey][i]) {
            count += 1;
            if (count > 1) {
              return joi.createError(`${baseType}.duplicateFound`,
                { value },
                state, options);
            }
          }
        }
      },
    },
  ],
});

const joiUniqueStringExtension = joi => joiUniqueBaseExtension(joi, 'string');
const joiUniqueNumberExtension = joi => joiUniqueBaseExtension(joi, 'number');

module.exports = {
  uniqueString: joiUniqueStringExtension,
  uniqueNumber: joiUniqueNumberExtension,
};
