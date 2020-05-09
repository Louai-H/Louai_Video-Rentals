const request = require('supertest');
const { Customer } = require('../../../models/customer');
const { User } = require('../../../models/user');

let server;

describe('/api/customers', () => {
    beforeEach(() => { server = require('../../../index'); });
    afterEach(async () => {
        await server.close();
        await Customer.deleteMany({});
    });

    describe('GET/', () => {
        let token;
        let user;

        const getAllCustomers = () => {            
            return request(server).get('/api/customers').set('x-auth-token', token);
        }

        beforeEach(() => {
            user = new User({ isAdmin: true }) ;
            token = user.generateAuthToken();
        });

        afterEach( async () => { await User.deleteMany({}); });


        it('should return 401 if client is not logged in', async () => {
            token = '';

            const res = await getAllCustomers();
            
            expect(res.status).toBe(401);
        });

        it('should return 403 if client is not an Admin', async () => {
            user.isAdmin = false;
            token = user.generateAuthToken();

            const res = await getAllCustomers();
            
            expect(res.status).toBe(403);
            
        });

        it('should return all customers if user is an Admin', async () => {
            let customers = [
                { name: 'customer1', phone: '12345' },
                { name: 'customer2', phone: '54321' }
            ];
            await Customer.collection.insertMany(customers);

            const res = await getAllCustomers();

            expect(res.status).toBe(200);
            expect(res.body).toEqual(expect.arrayContaining([
                expect.objectContaining({ name: 'customer1', phone: '12345' }),
                expect.objectContaining({ name: 'customer2', phone: '54321' })
            ]));
        });
    });

    describe('GET/:id', () => {
        let customerId;
        let customer; 

        const getById = () => {
            return request(server).get('/api/customers/' + customerId);
        }

        beforeEach( async () => {
            customer = new Customer({ name: 'customer1', phone: '12345' });
            await customer.save();

            customerId = customer._id;
        });

        it('should return 404 if id is an invalid id type', async () => {
            customerId = '1';

            const res = await getById();

            expect(res.status).toBe(404);
            expect(res.text).toMatch(/Invalid ID/);
        });

        it('should return 404 if no customer with the given id exists', async () => {
            await Customer.deleteMany({});

            const res = await getById();

            expect(res.status).toBe(404);
            expect(res.text).toMatch(/not found/);
        });

        it('should return a customer if valid and existent id is passed', async () => {
            const res = await getById();

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ _id: customer._id.toString(), name: 'customer1', phone: '12345' });
        });
    });

    describe('POST/', () => {
        let customer;

        const postCustomer = () => {
            return request(server).post('/api/customers').send(customer);
        }

        beforeEach(async () => {
            customer = { name: 'customer1', phone: '12345', isGold: true };
        })

        it('should return 400, customer is not valid', async () => {
            customer.phone = '1234';

            const res = await postCustomer();

            expect(res.status).toBe(400);
            expect(res.text).toMatch(/phone/);
        });

        it('should save the customer in the database if input is valid', async () => {
            const res = await postCustomer();

            const customerInDb = await Customer.findOne(customer);
            
            expect(res.status).toBe(200);
            expect(customerInDb).not.toBeNull();
        });

        it('should return the customer in the response upon saving a new customer successfully', async () => {
            const res = await postCustomer();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toMatchObject(customer);
        });
    });

    describe('PUT/:id', () => {
        let customerId;
        let customer;
        let editedCustomer;     

        const updateCustomer = () => {
            return request(server).put('/api/customers/' + customerId).send(editedCustomer);
        }

        beforeEach(async () => {
            customer = new Customer({ name: 'customer1', phone: '12345', isGold: true });
            await customer.save();

            customerId = customer._id;

            editedCustomer = { name: 'customer2', phone: '54321', isGold: false };
        })
    
        it('should return 404 if the customerId parameter is an invalid id', async () => {
            customerId = '1';
            
            const res = await updateCustomer();
            
            expect(res.status).toBe(404);
            expect(res.text).toMatch(/Invalid ID/);
        });
    
        it('should return 400 if editedCustomer is invalid: according to Customer model validation', async () => {
            editedCustomer.name = 100000 ;
            
            const res = await updateCustomer();
            
            expect(res.status).toBe(400);
            expect(res.text).toMatch(/must be a string/);
        });
    
        it('should return 404 if customer with the given customerId was not found', async () => {
            await Customer.deleteMany({});
            
            const res = await updateCustomer();
            
            expect(res.status).toBe(404);
            expect(res.text).toMatch(/not found/);
        });
    
        it('should update the customer in the database if input is valid', async () => {
          const res = await updateCustomer();

          const customerInDb = await Customer.findById(customerId);
                   
          expect(res.status).toBe(200);
          expect(customerInDb).not.toBeNull();
        });
    
        it('should return the updated movie in the response if input is valid', async () => {
          const res = await updateCustomer();
    
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toMatchObject(editedCustomer);
        });
      });
      
      
    describe('DELETE /:id', () => {
        let customerId;
        let customer;
    
        const deleteCustomer = () => {
          return request(server).delete('/api/customers/' + customerId);
        }
    
        beforeEach(async () => {
            // Before each test we need to create a customer and put it in the database.
            customer = new Customer({ name: 'customer1', phone: '12345' });
            await customer.save();

            customerId = customer._id;
        })
    
        it('should return 404 if the customerId parameter is an invalid id', async () => {
            customerId = 1;
            
            const res = await deleteCustomer();
            
            expect(res.status).toBe(404);
            expect(res.text).toMatch(/Invalid ID/);
        });
    
        it('should return 404 if no customer with the given customerId was found', async () => {
            await Customer.deleteMany({});
            
            const res = await deleteCustomer();
            
            expect(res.status).toBe(404);
            expect(res.text).toMatch(/not found/);
        });
    
        it('should delete the customer from the database if input is valid', async () => {
          const res = await deleteCustomer();
    
          const customerInDb = await Customer.findById(customerId);
    
          expect(res.status).toBe(200);
          expect(customerInDb).toBeNull();
        });
    
        it('should return the removed customer upon successful deletion', async () => {
          const res = await deleteCustomer();
    
          expect(res.body).toHaveProperty('_id', customerId.toString());
          expect(res.body).toMatchObject({ name: 'customer1', phone: '12345' });
        });
    });  
});