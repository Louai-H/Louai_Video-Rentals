const config = require('../../../startup/config');
var configModule = require('config');
jest.mock('config', () => {
    return {
        get: jest.fn().mockReturnValue(false)
    }
});

describe('config startup', () => {
    it('should throw an Error if no jwtPrivateKey is defined', () => {
        expect.assertions(2);

        try {
            config();
        } catch (error) {
            expect(configModule.get).toHaveBeenCalledWith('jwtPrivateKey');
        }

        expect(() => { config() }).toThrow();
    });
});