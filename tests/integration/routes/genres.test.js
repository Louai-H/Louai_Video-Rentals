const request = require('supertest');
const { Genre } = require('../../../models/genre');
const { User } = require('../../../models/user');
const mongoose = require('mongoose');

let server;

describe('/api/genres', () => {
  beforeEach(() => { server = require('../../../index'); });
  afterEach(async () => {
    await server.close();
    await Genre.deleteMany({});
    await User.deleteMany({});
  });

  describe('GET/', () => {
    it('should return all genres', async () => {
      await Genre.collection.insertMany([
        { name: 'genre1' },
        { name: 'genre2' }
      ]);

      const res = await request(server).get('/api/genres');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
      expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
    });
  });

  describe('GET/:id', () => {
    it('should return a genre if valid id is passed', async () => {
      const genre = new Genre({ name: 'genre1' });
      await genre.save();

      const res = await request(server).get('/api/genres/' + genre._id);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', genre.name);
      expect(res.body).toHaveProperty('_id', genre._id.toString())
      expect(res.body).toMatchObject({ name: genre.name, _id: genre._id.toString() });
    });

    it('should return 404 if invalid id is passed', async () => {
      const res = await request(server).get('/api/genres/1');

      expect(res.status).toBe(404);
    });

    it('should return 404 if no genre with the given id exists', async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get('/api/genres/' + id);

      expect(res.status).toBe(404);
    });
  });

  describe('POST/', () => {
    let user = new User({ name: 'Louai', email: 'email@gmail.com', password: '123456' });
    let token;
    let genreName;

    const postGenre = () => {
      return request(server).post('/api/genres').set('x-auth-token', token).send({ name: genreName });
    }

    beforeEach(async () => {
      user.isAdmin = true;
      token = user.generateAuthToken();
      genreName = 'genre1';
    })

    it('should return 401, client is not logged in', async () => {
      token = '';
      const res = await postGenre();

      expect(res.status).toBe(401);
    });

    it('should return 403, client is logged in but is not an Admin', async () => {
      user.isAdmin = false;
      token = user.generateAuthToken();

      const res = await postGenre();

      expect(res.status).toBe(403);
    });

    it('should return 400, genre is not valid: less than 3 characters', async () => {
      genreName = '12';
      const res = await postGenre();

      expect(res.status).toBe(400);
    });

    it('should return 400, genre is not valid: more than 50 characters', async () => {
      genreName = new Array(52).join('a');
      const res = await postGenre();

      expect(res.status).toBe(400);
    });

    it('should save the genre if it is valid', async () => {
      await postGenre();

      const genre = await Genre.findOne({ name: 'genre1' });

      expect(genre).not.toBeNull();
    });

    it('should return the genre in the response if it is valid', async () => {
      const res = await postGenre();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', 'genre1');
    });
  });

  describe('PUT/:id', () => {
    let user;
    let token;
    let newName;
    let genre;
    let id;

    const updateGenre = async () => {
      return await request(server).put('/api/genres/' + id).set('x-auth-token', token).send({ name: newName });
    }

    beforeEach(async () => {
      genre = new Genre({ name: 'genre1' });
      await genre.save();

      user = new User({ isAdmin: true });
      token = user.generateAuthToken();
      id = genre._id;
      newName = 'updatedName';
    })

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await updateGenre();

      expect(res.status).toBe(401);
    });

    it('should return 403, client is logged in but is not an Admin', async () => {
      user.isAdmin = false;
      token = user.generateAuthToken();

      const res = await updateGenre();

      expect(res.status).toBe(403);
    });

    it('should return 400 if genre is invalid: less than 3 characters', async () => {
      newName = '12';

      const res = await updateGenre();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre is invalid: more than 50 characters', async () => {
      newName = new Array(52).join('a');

      const res = await updateGenre();

      expect(res.status).toBe(400);
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await updateGenre();

      expect(res.status).toBe(404);
    });

    it('should return 404 if genre with the given id was not found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await updateGenre();

      expect(res.status).toBe(404);
    });

    it('should update the genre in the database if input is valid', async () => {
      await updateGenre();

      const updatedGenre = await Genre.findById(genre._id);

      expect(updatedGenre.name).toBe(newName);
    });

    it('should return the updated genre in the response if input is valid', async () => {
      const res = await updateGenre();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', newName);
    });
  });


  describe('DELETE /:id', () => {
    let user;
    let token;
    let genre;
    let id;

    const deleteGenre = async () => {
      return await request(server).delete('/api/genres/' + id).set('x-auth-token', token).send();
    }

    beforeEach(async () => {
      genre = new Genre({ name: 'genre1' });
      await genre.save();

      id = genre._id;
      user = new User({ isAdmin: true });
      token = user.generateAuthToken();
    })

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await deleteGenre();

      expect(res.status).toBe(401);
    });

    it('should return 403 if the user is not an admin', async () => {
      user.isAdmin = false;
      token = user.generateAuthToken();

      const res = await deleteGenre();

      expect(res.status).toBe(403);
    });

    it('should return 404 if id is invalid', async () => {
      id = 1;

      const res = await deleteGenre();

      expect(res.status).toBe(404);
    });

    it('should return 404 if no genre with the given id was found', async () => {
      id = mongoose.Types.ObjectId();

      const res = await deleteGenre();

      expect(res.status).toBe(404);
    });

    it('should delete the genre if input is valid', async () => {
      await deleteGenre();

      const genreInDb = await Genre.findById(id);

      expect(genreInDb).toBeNull();
    });

    it('should return the removed genre', async () => {
      const res = await deleteGenre();

      expect(res.body).toHaveProperty('_id', genre._id.toHexString());
      expect(res.body).toHaveProperty('name', genre.name);
    });
  });
});