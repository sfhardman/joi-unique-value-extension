const VanillaJoi = require('joi');
const clone = require('clone');
const uniqueExtensions = require('../index.js');

const Joi = VanillaJoi.extend(uniqueExtensions.uniqueString);

const data = {
  makes: [
    {
      id: 'nissan',
      alternateIds: [ 'datsun' ],
      name: 'Nissan',
    },
    {
      id: 'toyota',
      name: 'Toyota',
    },    
  ],
};

const schema = Joi.object({
  makes: Joi.array().items({
    id: Joi.string().unique('makes.[].id'),
    alternateIds: Joi.array().items(Joi.string()),  
    name: Joi.string(),
  }),
});

const alternateSchema = Joi.object({
  makes: Joi.array().items({
    id: Joi.string().unique([
      'makes.[].id',
      'makes.[].alternateIds.[]',
    ]),
    alternateIds: Joi.array().items(Joi.string()),  
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
      id: 'toyota',
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
      id: 'datsun',
      name: 'Datsun',
    })
    const result = Joi.validate(workingData, alternateSchema, { context: { data: workingData } });
    expect(result.error).toBeTruthy();
    expect(result.error.name).toBe('ValidationError');
  });  
  it('performs reasonably', () => {
    const perfSchema = Joi.object({
      items: Joi.array().items({
        itemId: Joi.string().unique('items.[].itemId'),
      }),
    });
    const data = {
      items: [],
    };
    const itemCount = 1000;
    for (let i = 0; i < itemCount; i += 1) {
      const id = `${10000* Math.random()}`;
      data.items.push({
        itemId: id,
      });
    }
    const start = new Date();
    const result = Joi.validate(data, perfSchema, { context: { data } });
    const end = new Date();
    const durationMs = end - start;
    expect(result.error).toBeFalsy();
    expect(durationMs).toBeLessThan(500);
  }); 
});
