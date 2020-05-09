const request = require('supertest');
const { User } = require('../../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

let server;

describe('/api/users', () => {
    beforeEach(() => { server = require('../../../index'); });
    afterEach(async () => {
        await server.close();
        await User.deleteMany({});
    });

    describe('POST/', () => {
        let userToAuthenticate;
        let registeredUser;
        let hashedPassword;
        let salt;

        const authenticateUser = () => {
            return request(server).post('/api/auth').send(userToAuthenticate);
        }

        beforeAll(async () => { salt = await bcrypt.genSalt(10); });
        beforeEach(async () => {
            userToAuthenticate = {
                email: 'email@email.com',
                password: '12345'
            };
            hashedPassword = await bcrypt.hash(userToAuthenticate.password, salt);
            registeredUser = new User({ email: userToAuthenticate.email, password: hashedPassword, name: 'name' });
            await registeredUser.save();
        })

        it('should return 400, if the request input is not valid: email is required', async () => {
            userToAuthenticate.email = '';

            const res = await authenticateUser();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/empty/);
        });

        it('should return 400, if the request input is not valid: email is not valid', async () => {
            userToAuthenticate.email = 'wrongEmailPattern';

            const res = await authenticateUser();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/valid email/);
        });

        it('should return 400, if the request input is not valid: password is not valid', async () => {
            userToAuthenticate.password = '123';

            const res = await authenticateUser();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/length/);
        });

        it("should return 400, 'Invalid email or password' if there is no registered user that matches this user", async () => {
            await User.deleteMany({});

            const res = await authenticateUser();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Invalid email or password./);
        });

        it("should return 400, 'Invalid email or password' if there is no registered user that matches this user's password", async () => {
            registeredUser.password = await bcrypt.hash('diffrentPassword_123456', salt);
            await User.findByIdAndUpdate(registeredUser._id, registeredUser);

            const res = await authenticateUser();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/Invalid email or password./);
        });

        it('should authenticate the user if input is valid & the user is already registered', async () => {
            const res = await authenticateUser();

            expect(res.status).toBe(200);
            expect(res.body).not.toBeNull();
        });

        it('should return a valid token as a response for the user upon successful authentication', async () => {
            const res = await authenticateUser();

            const decoded = jwt.verify(res.text, config.get('jwtPrivateKey'));

            expect(decoded._id).toBe(registeredUser._id.toString());
        });
    });
});