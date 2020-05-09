const request = require('supertest');
const { User } = require('../../../models/user');
const { Genre } = require('../../../models/genre');

describe('auth middleware', () => {
    let token;

    beforeEach(() => {
        server = require('../../../index');
        token = new User({ name: 'Louai', email: 'email@gmail.com', password: '123456', isAdmin: true }).generateAuthToken();
    });
    afterEach(async () => {
        await Genre.deleteMany({});
        await server.close();
    });

    const callEndpoint = () => {   // call any endpoint that uses the auth middleware
        return request(server).post('/api/genres').set('x-auth-token', token).send({ name: 'genre1' });
    }

    it('should return 401 if no token is provided', async () => {
        token = '';
        const res = await callEndpoint();

        expect(res.status).toBe(401);
    });

    it('should return 400 token is invalid', async () => {
        token = 'a';
        const res = await callEndpoint();

        expect(res.status).toBe(400);
    });

    it('should return 200 token is valid', async () => {
        const res = await callEndpoint();

        expect(res.status).toBe(200);
    });
});