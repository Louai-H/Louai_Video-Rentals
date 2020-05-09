const admin = require('../../../middleware/admin');

describe('admin middleware', () => {
    it('should return 403 ("Access denied.") if user is not an admin ', () => {
      const req = {
        user: { isAdmin: false }
      };
      var res = {
          body: '',
          status(code) {
              res.status = code;
              return res;
            },
          send: (response) => { res.body = response }
        };
      const next = jest.fn();
      
      admin(req, res, next);
      
      expect(res.status).toBe(403);
      expect(res.body).toMatch(/denied/);
    });
});