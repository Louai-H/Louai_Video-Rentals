const validateObjectId = require('../../../middleware/validateObjectId');

describe('validateObjectId middleware', () => {
    it('should return 404 ("Invalid ID.") if an id parameter in the request is not a valid ObjectId type', () => {
      const req = {
        params: { id: '1' }
      };
      var res = {
          body: '',
          status: (code) => {
              res.status = code;
              return res;
            },
          send: (response) => { res.body = response }
        };
      const next = jest.fn();
      
      validateObjectId(req, res, next);
      
      expect(res.status).toBe(404);
      expect(res.body).toMatch(/Invalid/);      
    });
});