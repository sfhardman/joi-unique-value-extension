const getNextPath = fkPathChunks => fkPathChunks
  .filter((chunk, index) => index > 0)
  .join('.');

const findDuplicate = (value, searchPath, data, valuePath = [], trackedPath = []) => {
  const searchPathChunks = searchPath.split('.').filter(chunk => !!chunk);
  if (!searchPathChunks.length) {
    const isMatch = (data === value) && (valuePath.join('.') !== trackedPath.join('.'));
    return isMatch ? trackedPath : null;
  }
  const currentChunk = searchPathChunks[0];
  if (currentChunk === '[]') {
    if (!Array.isArray(data)) {
      return null;
    }
    for (let i = 0; i < data.length; i += 1) {
      const item = data[i];
      const nextTrackedPath = trackedPath.slice();
      nextTrackedPath.push(i);
      const dupe = findDuplicate(value, getNextPath(searchPathChunks), item, valuePath, nextTrackedPath);
      if (dupe) {
        return dupe;
      }
    }
  } else if (!(currentChunk in data)) {
    return null;
  } else {
    const nextTrackedPath = trackedPath.slice();
    nextTrackedPath.push(currentChunk);    
    return findDuplicate(value, getNextPath(searchPathChunks), data[currentChunk], valuePath, nextTrackedPath);
  }
};

const joiUniqueBaseExtension = (joi, baseType) => ({
  name: baseType,
  base: joi[baseType](),
  language: {
    noContext: 'The data to look for duplicate values in must be passed in options.context',
    duplicateFound: '"{{value}}" was required to be unique, but duplicate found at "{{path}}"',
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
        // console.log(state);
        if (!options.context) {
          return joi.createError(`${baseType}.noContext`,
            null, state, options);
        }
        const searchPaths = Array.isArray(params.searchPath) ? params.searchPath : [ params.searchPath ];
        const duplicates = searchPaths.map(path => findDuplicate(value, path, options.context, state.path))
          .filter(dupe => !!dupe);
        if (duplicates.length) {
          return joi.createError(`${baseType}.duplicateFound`,
            { value, path: duplicates[0].join('.') },
            state, options);
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
