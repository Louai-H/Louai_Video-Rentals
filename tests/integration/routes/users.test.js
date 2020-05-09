const request = require('supertest');
const { User } = require('../../../models/user');
const bcrypt = require('bcryptjs');
const lodash = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');

let server;

describe('/api/users', () => {
    beforeEach(() => { server = require('../../../index'); });
    afterEach(async () => {
        await server.close();
        await User.deleteMany({});
    });

    describe('GET/me', () => {
        let token;
        let user;

        it('should return 401 if client is not logged in', async () => {
            const res = await request(server).get('/api/users/me');

            expect(res.status).toBe(401);
        });

        it('should return user details (without the password) if the user is logged in', async () => {
            user = new User({
                name: 'name1',
                email: 'email@gmail.com',
                password: '12345'
            });
            await user.save();

            token = user.generateAuthToken();

            const res = await request(server).get('/api/users/' + 'me').set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                name: user.name,
                email: user.email,
                _id: user._id.toString()
            });
        });
    });

    describe('POST/', () => {
        let newUser;

        const registerNewUser = () => {
            return request(server).post('/api/users').send(newUser);
        }

        beforeEach(async () => {
            newUser = {
                name: 'name1',
                email: 'email@email.com',
                password: '12345'
            };
        })

        it('should return 400, if the request input is not valid: name is not valid', async () => {
            newUser.name = '12';

            const res = await registerNewUser();

            expect(res.status).toBe(400);
        });

        it('should return 400, if the request input is not valid: email is not valid', async () => {
            newUser.email = 'wrongEmailPattern';

            const res = await registerNewUser();

            expect(res.status).toBe(400);
        });

        it('should return 400, if the request input is not valid: password is not valid', async () => {
            newUser.password = '';

            const res = await registerNewUser();

            expect(res.status).toBe(400);
        });

        it('should return 400, if a user with this email is already regitered', async () => {
            await new User(newUser).save();

            const res = await registerNewUser();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/already registered/);
        });

        it('should save the user in the database if input is valid', async () => {
            const res = await registerNewUser();

            expect(res.status).toBe(200);
            const userInDb = await User.findOne(lodash.omit(newUser, ['password']));
            expect(userInDb).not.toBeNull();
        });

        it('should save the user password hashed in the database if input is valid', async () => {
            await registerNewUser();

            const userInDb = await User.findOne({ email: newUser.email });
            const isValidHashing = await bcrypt.compare(newUser.password, userInDb.password);

            expect(isValidHashing).toBeTruthy();
        });

        it('should authenticate the user automatically upon successful registeration & return user details (without the password) along with a valid token in the header', async () => {
            const res = await registerNewUser();
            const userInDb = await User.findOne({ email: newUser.email }).select('_id');

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toMatchObject(lodash.omit(newUser, ['password']));

            let token = res.header['x-auth-token'];
            const decoded = jwt.verify(token, config.get('jwtPrivateKey'));

            expect(decoded._id).toBe(userInDb._id.toString());
        });
    });
});