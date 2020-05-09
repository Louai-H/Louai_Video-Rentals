const error = require('../../../middleware/error');
const winston = require('winston');
jest.mock('winston', () => {
  return {
    error: jest.fn()
  }
});

describe('error middleware', () => {
  it('should log the recieved error and return 403 ("Something failed.") ', () => {
    const req = {};
    var res = {
      body: '',
      status(code) {
        res.status = code;
        return res;
      },
      send: (response) => { res.body = response }
    };
    const next = jest.fn();
    const err = {
      message: 'message',
      name: 'name',
      stack: 'stack'
    }

    error(err, req, res, next);

    expect(res.status).toBe(500);
    expect(res.body).toMatch(/failed/);
    expect(winston.error).toHaveBeenCalled();

    expect(winston.error.mock.calls[0][0]).toBe(err.message);
    expect(winston.error.mock.calls[0][1]).toMatchObject({ meta: err });
  });
});