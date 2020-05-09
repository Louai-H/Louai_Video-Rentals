const validate = require('../../../middleware/validate');

describe('validate middleware', () => {
    let req;
    let res;
    let next;
    let validator;
    let middlewareFunction;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            body: '',
            status: (code) => {
                res.status = code;
                return res;
            },
            send: (response) => { res.body = response }
        };
        next = jest.fn();
        
        validator = jest.fn().mockReturnValueOnce({
            error: {
                details: [{ message: 'errorMessage' }]
            }
        });

        middlewareFunction = validate(validator);
    });

    it('should return 400 and an error if the request body is not a valid request', () => {      
      middlewareFunction(req, res, next);
      
      expect(typeof middlewareFunction).toBe('function');
      expect(res.status).toBe(400);
      expect(res.body).toBe('errorMessage');      
    });

    it('should not return 400 and an error but to pass to the next() middleware if the request body is valid', () => {      
      validator = jest.fn().mockReturnValueOnce({  });
      middlewareFunction = validate(validator);
      middlewareFunction(req, res, next);
      
      expect(typeof middlewareFunction).toBe('function');
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toBe(400); 
    });
});