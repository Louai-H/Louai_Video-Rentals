const request = require('supertest');
const { Rental } = require('../../../models/rental');
const { Movie } = require('../../../models/movie');
const { User } = require('../../../models/user');
const { Customer } = require('../../../models/customer');
const { Genre } = require('../../../models/genre');

let server;

describe('/api/rentals', () => {
    beforeEach(() => { server = require('../../../index'); });
    afterEach(async () => {
        await server.close();
        await Rental.deleteMany({});
        await Movie.deleteMany({});
        await Customer.deleteMany({});
    });

    describe('GET/', () => {
        let token = new User().generateAuthToken();

        it('should return 401 if client is not logged in', async () => {
            const res = await request(server).get('/api/rentals');

            expect(res.status).toBe(401);
        });

        it('should return all rentals if client is logged in', async () => {
            let rental1 = { customer: new Customer(), movie: new Movie() };
            let rental2 = { customer: new Customer(), movie: new Movie() };
            let rentals = [rental1, rental2];
            await Rental.collection.insertMany(rentals);

            const res = await request(server).get('/api/rentals').set('x-auth-token', token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);

            expect(res.body).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    _id: rental1._id.toString(),
                    movie: expect.objectContaining({ _id: rental1.movie._id.toString() }),
                    customer: expect.objectContaining({ _id: rental1.customer._id.toString() })
                }),
                expect.objectContaining({
                    _id: rental2._id.toString(),
                    movie: expect.objectContaining({ _id: rental2.movie._id.toString() }),
                    customer: expect.objectContaining({ _id: rental2.customer._id.toString() })
                })
            ]));
        });
    });

    describe('GET/:id', () => {
        let id;
        let rental;
        let token;

        const getById = () => {
            return request(server).get('/api/rentals/' + id).set('x-auth-token', token);
        }

        beforeEach(async () => {
            token = new User().generateAuthToken();

            rental = new Rental({
                customer: { name: 'c12345', phone: '12345' },
                movie: { title: 'm12345', dailyRentalRate: 1 }
            });
            await rental.save();

            id = rental._id;
        });

        it('should return 401, client is not logged in', async () => {
            token = '';

            const res = await getById();

            expect(res.status).toBe(401);
        });

        it('should return 404 if invalid id is passed', async () => {
            id = '1';

            const res = await getById();

            expect(res.status).toBe(404);
        });


        it('should return 404 if no rental with the given id exists', async () => {
            await Rental.deleteMany({});

            const res = await getById();

            expect(res.status).toBe(404);
        });

        it('should return a rental if input is valid', async () => {
            const res = await getById();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('dateOut');
            expect(res.body).toMatchObject({
                _id: id.toString(),
                customer: { _id: rental.customer._id.toString(), name: 'c12345', phone: '12345' },
                movie: { _id: rental.movie._id.toString(), title: 'm12345', dailyRentalRate: 1 }
            });
        });
    });

    describe('POST/', () => {
        let token;
        let customer;
        let movie;
        let customerId;
        let movieId;

        const postRental = () => {
            return request(server).post('/api/rentals').set('x-auth-token', token).send({ customerId, movieId });
        }

        beforeEach(async () => {
            token = new User().generateAuthToken();

            customer = new Customer({ name: 'c12345', phone: '12345' });
            await customer.save();

            movie = new Movie({
                title: 'm12345',
                genre: new Genre({ name: 'genre1' }),
                dailyRentalRate: 1,
                numberInStock: 1,
                dailyRentalRate: 1
            });
            await movie.save();

            customerId = customer._id;
            movieId = movie._id;
        })

        it('should return 401, client is not logged in', async () => {
            token = '';

            const res = await postRental();

            expect(res.status).toBe(401);
        });

        it('should return 400, invalid token', async () => {
            token = '1';

            const res = await postRental();

            expect(res.status).toBe(400);
        });

        it('should return 400 if customerId is not a valid id', async () => {
            customerId = '1';

            const res = await postRental();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movieId is not a valid id', async () => {
            movieId = '1';

            const res = await postRental();

            expect(res.status).toBe(400);
        });

        it('should return 400 if customer for the given customerId does not exist', async () => {
            await Customer.deleteMany({});

            const res = await postRental();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movie for the given movieId does not exist', async () => {
            await Movie.deleteMany({});

            const res = await postRental();

            expect(res.status).toBe(400);
        });

        it('should return 400 if (movie.numberInStock === 0)', async () => {
            movie.numberInStock = 0;
            await Movie.findByIdAndUpdate(movieId, movie);

            const res = await postRental();

            expect(res.status).toBe(400);
        });

        it('should return 500 if something failed (in try block)', async () => {
            // should create an error inside the try block in order to be catched
            const Fawn = require('fawn');
            jest.spyOn(Fawn, 'Task').mockImplementationOnce(() => { throw new Error('test error') });

            const res = await postRental();

            expect(res.status).toBe(500);
            expect(res.text).toBe('Something Failed.');

            Fawn.Task.mockRestore();
        });

        it('should save the rental if input is valid', async () => {
            const res = await postRental();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('dateOut');

            expect(res.body).toMatchObject({
                customer: {
                    _id: customer._id.toString(),
                    name: customer.name,
                    phone: customer.phone
                },
                movie: {
                    _id: movie._id.toString(),
                    title: movie.title,
                    dailyRentalRate: movie.dailyRentalRate
                }
            });
        });
    });
});