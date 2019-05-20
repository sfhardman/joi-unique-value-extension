const VanillaJoi = require('joi');
const clone = require('clone');
const uniqueExtensions = require('../index.js');

const Joi = VanillaJoi.extend(uniqueExtensions.uniqueNumber);

const data = {
  makes: [
    {
      id: 1,
      alternateIds: [ 3 ],
      name: 'Nissan',
    },
    {
      id: 2,
      name: 'Toyota',
    },    
  ],
};

const schema = Joi.object({
  makes: Joi.array().items({
    id: Joi.number().unique('makes.[].id'),
    alternateIds: Joi.array().items(Joi.number()),  
    name: Joi.string(),
  }),
});

const alternateSchema = Joi.object({
  makes: Joi.array().items({
    id: Joi.number().unique([
      'makes.[].id',
      'makes.[].alternateIds.[]',
    ]),
    alternateIds: Joi.array().items(Joi.number()),  
    name: Joi.string(),
  }),
});

describe('Joi-unique-value-extension-string', () => {
  it('fails validation when context is not supplied', () => {
    const workingData = clone(data);
    const result = Joi.validate(workingData, schema);
    expect(result.error).toBeTruthy();
    expect(result.error.name).toBe('ValidationError');
  });
  it('passes validation when no duplicate value is supplied', () => {
    const workingData = clone(data);
    const result = Joi.validate(workingData, schema, { context: { data: workingData } });
    expect(result.error).toBeFalsy();
  });
  it('fails validation when a duplicate value is supplied', () => {
    const workingData = clone(data);
    workingData.makes.push({
      id: 2,
      name: 'toyota',
    })
    const result = Joi.validate(workingData, schema, { context: { data: workingData } });
    expect(result.error).toBeTruthy();
    expect(result.error.name).toBe('ValidationError');
  });
  it('passes validation when no duplicate value is supplied including alternate search path', () => {
    const workingData = clone(data);
    const result = Joi.validate(workingData, alternateSchema, { context: { data: workingData } });
    expect(result.error).toBeFalsy();
  });
  it('fails validation when a duplicate value is supplied on alternate search path', () => {
    const workingData = clone(data);
    workingData.makes.push({
      id: 3,
      name: 'Datsun',
    })
    const result = Joi.validate(workingData, alternateSchema, { context: { data: workingData } });
    expect(result.error).toBeTruthy();
    expect(result.error.name).toBe('ValidationError');
  });  
});
