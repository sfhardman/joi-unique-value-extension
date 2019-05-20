# Joi-unique-value-extension

This is an extension for the [Joi](https://github.com/hapijs/joi) validation library that allows validation that a field is unique compared to a set of other field values.

## Usage

```js

const VanillaJoi = require('joi');
const uniqueExtensions = require('joi-unique-value-extension');

const Joi = VanillaJoi.extend(uniqueExtensions.uniqueString);
// also available: uniqueExtensions.uniqueNumber

const schema = Joi.object({
  packages: Joi.array().items({
    // require that packageId must not collide with the packageId field 
    // of one of the other items in the 'packages' array of the reference data
    packageId: Joi.string().unique('packages.[].packageId'),
  }),
});

const referenceData = {
  packages: [
    { packageId: 'joi' },
    { packageId: 'hapi' },
  ],
};

const pass = Joi.validate(referenceData, schema, { context: { data: referenceData } });

console.log(pass.error); // null - no error

referenceData.packages.push({ packageId: 'hapi' });

const fail = Joi.validate(referenceData, schema, { context: { data: referenceData } });

console.log(fail.error); //"packageId" '"hapi" was required to be unique, but duplicate found at "packages.2.packageId"'

```

## API

### `unique(searchPath)`

Requires that the field value must be unique compared to all other values found at searchPath.

Reference data to search for duplicates in must be supplied to Joi in options.context.data (e.g. in a call to `Joi.validate(data, schema, options)`) 

- `searchPath` - The format of fkPath has dot seperated object fields, with search across an array indicated by a pair of square brackets (`[]`)

e.g.:

```js
const referenceData = {
  species: [
    { speciesId: 'tiger' },
  ],
};

const animalSchema = Joi.object({
  species: Joi.array().items(Joi.object({
    speciesId: Joi.string().unique('species.[].speciesId'),
  })),
});
```

`searchPath` may be an array of possible search paths instead of a string.

e.g.:

```js
const referenceData = {
  species: [
    { speciesId: 'tiger', alternateId: 'panthera tigris' },
  ],
};

const animalSchema = Joi.object({
  species: Joi.array().items(Joi.object({
    speciesId: Joi.string().unique([
      'species.[].speciesId',
      'species.[].alternateId',
    ]),
    alternateId: Joi.string().unique([
      'species.[].speciesId',
      'species.[].alternateId',
    ]),    
  })),
});
```

### options

#### options.context.data
This extension requires that you pass the data that contains the possible duplicates in the ```options.context.data``` parameter to the validate method.  Note that the ```context``` object should not be re-used between calls to validate as it is used to cache lookups for performance reasons.