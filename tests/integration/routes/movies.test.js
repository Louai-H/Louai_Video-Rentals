const request = require('supertest');
const { Movie } = require('../../../models/movie');
const { User } = require('../../../models/user');
const { Genre } = require('../../../models/genre');
const mongoose = require('mongoose');
const lodash = require('lodash');

let server;

describe('/api/movies', () => {
    beforeEach(() => { server = require('../../../index'); });
    afterEach(async () => {
        await server.close();
        await Movie.deleteMany({});
        await Genre.deleteMany({});
    });

    describe('GET/', () => {
        it('should return all movies', async () => {
            let movies = [
                { title: 'movie1', genre: { name: 'genre1' }, numberInStock: 1, dailyRentalRate: 3 },
                { title: 'movie2', genre: { name: 'genre2' }, numberInStock: 2, dailyRentalRate: 2 }
            ];
            await Movie.collection.insertMany(movies);

            const res = await request(server).get('/api/movies');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            movies.forEach(m => m._id = m._id.toString());
            expect(res.body).toMatchObject(movies);
        });
    });

    describe('GET/:id', () => {
        let movieId;
        let movie;

        const getById = () => {
            return request(server).get('/api/movies/' + movieId);
        }

        beforeEach(async () => {
            movieId = mongoose.Types.ObjectId();

            movie = new Movie({
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2,
                genre: { name: '12345' },
                numberInStock: 10
            });
            await movie.save();
        });

        it('should return 404 if invalid id is passed', async () => {
            movieId = '1';

            const res = await getById();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no movie with the given id exists', async () => {
            movieId = mongoose.Types.ObjectId();

            const res = await getById();

            expect(res.status).toBe(404);
        });

        it('should return a movie if valid and existent id is passed', async () => {
            const res = await getById();

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                _id: movie._id.toString(),
                title: '12345',
                dailyRentalRate: 2,
                genre: { name: '12345' },
                numberInStock: 10
            });
        });
    });

    describe('POST/', () => {
        let user;
        let token;
        let movie;
        let movieFromClient;
        let genre;

        const postMovie = () => {
            return request(server).post('/api/movies').set('x-auth-token', token).send(movieFromClient);
        }

        beforeEach(async () => {
            user = new User({ isAdmin: true });
            token = user.generateAuthToken();
            genre = new Genre({ name: '12345' });
            await genre.save();

            movie = new Movie({
                title: '12345',
                genre: genre,
                numberInStock: 10,
                dailyRentalRate: 2
            });
            await movie.save();

            movieFromClient = lodash.pick(movie, ['title', 'numberInStock', 'dailyRentalRate']);
            movieFromClient.genreId = movie.genre._id;
        })

        it('should return 401, client is not logged in', async () => {
            token = '';

            const res = await postMovie();

            expect(res.status).toBe(401);
        });

        it('should return 403, client is logged in but is not an Admin', async () => {
            user.isAdmin = false;
            token = user.generateAuthToken();

            const res = await postMovie();

            expect(res.status).toBe(403);
        });


        it('should return 400, invalid token', async () => {
            token = '1';

            const res = await postMovie();

            expect(res.status).toBe(400);
        });

        it('should return 400, movie is not valid: according to the Movie model validation', async () => {
            movieFromClient.title = '1234';

            const res = await postMovie();

            expect(res.status).toBe(400);
        });

        it('should return 400, movie is not valid: title is required', async () => {
            movieFromClient.title = '';

            const res = await postMovie();

            expect(res.status).toBe(400);
        });

        it('should return 400, movie is not valid: title less than 5 characters', async () => {
            movieFromClient.title = '1234';

            const res = await postMovie();

            expect(res.status).toBe(400);
        });

        it('should return 400, movie is not valid: tite more than 255 characters', async () => {
            movieFromClient.title = new Array(257).join('a');

            const res = await postMovie();

            expect(res.status).toBe(400);
        });

        it('should return 400, genreId is invalid', async () => {
            movieFromClient.genreId = '1';

            const res = await postMovie();

            expect(res.status).toBe(400);
        });

        it('should return 400, if genre of the given genreId is not found', async () => {
            await Genre.deleteMany({});

            const res = await postMovie();

            expect(res.status).toBe(400);
        });

        it('should save the movie if input is valid', async () => {
            const res = await postMovie();

            const movieInDb = await Movie.findOne(movie);

            expect(res.status).toBe(200);
            expect(movieInDb).not.toBeNull();
        });

        it('should return the movie in the response if input is valid', async () => {
            const res = await postMovie();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toMatchObject({
                title: '12345',
                dailyRentalRate: 2,
                genre: { name: '12345' },
                numberInStock: 10
            });
        });
    });

    describe('PUT/:id', () => {
        let user;
        let token;
        let movie;
        let newMovie;
        let id;
        let genre;

        const updateMovie = () => {
            return request(server).put('/api/movies/' + id).set('x-auth-token', token).send(newMovie);
        }

        beforeEach(async () => {
            user = new User({ isAdmin: true });
            token = user.generateAuthToken();
            genre = new Genre({ name: '12345' });
            await genre.save();

            movie = new Movie({
                title: '12345',
                genre: genre,
                numberInStock: 10,
                dailyRentalRate: 2
            });
            await movie.save();
            id = movie._id;

            newMovie = {
                title: 'newTitle',
                genreId: genre._id,
                numberInStock: 1,
                dailyRentalRate: 1
            }
        })

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await updateMovie();

            expect(res.status).toBe(401);
        });

        it('should return 403, client is not an Admin', async () => {
            user.isAdmin = false;
            token = user.generateAuthToken();

            const res = await updateMovie();

            expect(res.status).toBe(403);
        });

        it('should return 400, invalid token', async () => {
            token = '1';

            const res = await updateMovie();

            expect(res.status).toBe(400);
        });

        it('should return 400 if movie is invalid: according to Movie model validation', async () => {
            newMovie.title = '1234';

            const res = await updateMovie();

            expect(res.status).toBe(400);
        });

        it('should return 400, genreId is invalid', async () => {
            newMovie.genreId = '1';

            const res = await updateMovie();

            expect(res.status).toBe(400);
        });

        it('should return 400, if genre of the given genreId is not found', async () => {
            newMovie.genreId = mongoose.Types.ObjectId();

            const res = await updateMovie();

            expect(res.status).toBe(400);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await updateMovie();

            expect(res.status).toBe(404);
        });

        it('should return 404 if movie with the given id was not found', async () => {
            await Movie.deleteMany({});

            const res = await updateMovie();

            expect(res.status).toBe(404);
        });

        it('should update the movie in the database if input is valid', async () => {
            const res = await updateMovie();

            const movieInDb = await Movie.findById(id);

            expect(res.status).toBe(200);
            expect(movieInDb).not.toBeNull();
        });

        it('should return the updated movie in the response if input is valid', async () => {
            const res = await updateMovie();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toMatchObject({
                title: 'newTitle',
                genre: { _id: newMovie.genreId.toString() },
                numberInStock: 1,
                dailyRentalRate: 1
            });
        });
    });


    describe('DELETE /:id', () => {
        let user;
        let token;
        let movie;
        let id;

        const deleteMovie = () => {
            return request(server).delete('/api/movies/' + id).set('x-auth-token', token);
        }

        beforeEach(async () => {
            movie = new Movie({
                title: '12345',
                genre: { name: '12345' },
                numberInStock: 1,
                dailyRentalRate: 1
            });
            await movie.save();

            id = movie._id;

            user = new User({ isAdmin: true });
            token = user.generateAuthToken();
        })

        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await deleteMovie();

            expect(res.status).toBe(401);
        });

        it('should return 403 if the user is not an admin', async () => {
            user.isAdmin = false;
            token = user.generateAuthToken();

            const res = await deleteMovie();

            expect(res.status).toBe(403);
        });

        it('should return 404 if id is invalid', async () => {
            id = 1;

            const res = await deleteMovie();

            expect(res.status).toBe(404);
        });

        it('should return 404 if no movie with the given id was found', async () => {
            await Movie.deleteMany({});

            const res = await deleteMovie();

            expect(res.status).toBe(404);
        });

        it('should delete the movie if input is valid', async () => {
            const res = await deleteMovie();

            const movieInDb = await Movie.findById(id);

            expect(res.status).toBe(200);
            expect(movieInDb).toBeNull();
        });

        it('should return the removed movie', async () => {
            const res = await deleteMovie();

            expect(res.body).toHaveProperty('_id', movie._id.toString());
            expect(res.body).toMatchObject({
                title: '12345',
                genre: { _id: movie.genre._id.toString(), name: '12345' },
                numberInStock: 1,
                dailyRentalRate: 1
            });
        });
    });
});